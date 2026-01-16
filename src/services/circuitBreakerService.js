/**
 * Circuit Breaker Service
 * Implements the circuit breaker pattern to prevent cascading failures
 * when external services (like Twilio) are unavailable.
 *
 * States:
 * - CLOSED: Normal operation, requests pass through
 * - OPEN: Service is down, requests fail fast
 * - HALF_OPEN: Testing if service has recovered
 */

const logger = require('./logger');

class CircuitBreaker {
  /**
   * Create a new circuit breaker
   * @param {string} name - Name of the circuit (for logging)
   * @param {Object} options - Configuration options
   * @param {number} options.failureThreshold - Failures before opening (default: 5)
   * @param {number} options.successThreshold - Successes to close from half-open (default: 2)
   * @param {number} options.timeout - Time before trying again in ms (default: 60000)
   */
  constructor(name, options = {}) {
    this.name = name;
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
    this.lastStateChange = new Date();

    // Configuration
    this.failureThreshold = options.failureThreshold || 5;
    this.successThreshold = options.successThreshold || 2;
    this.timeout = options.timeout || 60000; // 1 minute default
  }

  /**
   * Check if circuit allows a request
   * @returns {boolean}
   */
  canRequest() {
    if (this.state === 'CLOSED') {
      return true;
    }

    if (this.state === 'OPEN') {
      // Check if timeout has passed - try half-open
      const now = Date.now();
      if (now - this.lastFailureTime >= this.timeout) {
        this._transitionTo('HALF_OPEN');
        return true;
      }
      return false;
    }

    // HALF_OPEN - allow limited requests to test recovery
    return true;
  }

  /**
   * Record a successful operation
   */
  recordSuccess() {
    if (this.state === 'HALF_OPEN') {
      this.successCount++;

      if (this.successCount >= this.successThreshold) {
        this._transitionTo('CLOSED');
        logger.info('Circuit breaker recovered', {
          circuit: this.name,
          successCount: this.successCount
        });
      }
    } else if (this.state === 'CLOSED') {
      // Reset failure count on success in closed state
      this.failureCount = 0;
    }
  }

  /**
   * Record a failed operation
   */
  recordFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.state === 'HALF_OPEN') {
      // Any failure in half-open goes back to open
      this._transitionTo('OPEN');
      this.successCount = 0;
      logger.warn('Circuit breaker re-opened after failure in HALF_OPEN', {
        circuit: this.name
      });
    } else if (this.state === 'CLOSED' && this.failureCount >= this.failureThreshold) {
      this._transitionTo('OPEN');
      logger.error('Circuit breaker opened due to failures', {
        circuit: this.name,
        failureCount: this.failureCount,
        threshold: this.failureThreshold
      });
    }
  }

  /**
   * Manually reset the circuit breaker to closed state
   */
  reset() {
    this._transitionTo('CLOSED');
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
    logger.info('Circuit breaker manually reset', { circuit: this.name });
  }

  /**
   * Force the circuit open (for testing or emergency)
   */
  forceOpen() {
    this._transitionTo('OPEN');
    this.lastFailureTime = Date.now();
    logger.warn('Circuit breaker forced open', { circuit: this.name });
  }

  /**
   * Get current state information
   * @returns {Object}
   */
  getState() {
    return {
      name: this.name,
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
      lastStateChange: this.lastStateChange,
      config: {
        failureThreshold: this.failureThreshold,
        successThreshold: this.successThreshold,
        timeoutMs: this.timeout
      }
    };
  }

  /**
   * Execute a function with circuit breaker protection
   * @param {Function} fn - Async function to execute
   * @returns {Promise<any>}
   */
  async execute(fn) {
    if (!this.canRequest()) {
      const error = new Error(`Circuit breaker is OPEN for ${this.name}`);
      error.code = 'CIRCUIT_OPEN';
      error.circuitState = this.getState();
      throw error;
    }

    try {
      const result = await fn();
      this.recordSuccess();
      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  /**
   * Internal: Transition to a new state
   * @param {string} newState
   * @private
   */
  _transitionTo(newState) {
    if (this.state !== newState) {
      const oldState = this.state;
      this.state = newState;
      this.lastStateChange = new Date();

      if (newState === 'CLOSED') {
        this.failureCount = 0;
        this.successCount = 0;
      } else if (newState === 'HALF_OPEN') {
        this.successCount = 0;
      }

      logger.info('Circuit breaker state change', {
        circuit: this.name,
        from: oldState,
        to: newState
      });
    }
  }
}

// Singleton instances for different services
const circuitBreakers = {};

/**
 * Get or create a circuit breaker by name
 * @param {string} name - Circuit breaker name
 * @param {Object} options - Configuration options (only used on creation)
 * @returns {CircuitBreaker}
 */
const getCircuitBreaker = (name, options = {}) => {
  if (!circuitBreakers[name]) {
    circuitBreakers[name] = new CircuitBreaker(name, options);
  }
  return circuitBreakers[name];
};

/**
 * Get all circuit breaker states (for monitoring/health checks)
 * @returns {Object}
 */
const getAllStates = () => {
  const states = {};
  for (const [name, breaker] of Object.entries(circuitBreakers)) {
    states[name] = breaker.getState();
  }
  return states;
};

/**
 * Reset all circuit breakers (useful for testing)
 */
const resetAll = () => {
  for (const breaker of Object.values(circuitBreakers)) {
    breaker.reset();
  }
};

// Pre-configure the Twilio circuit breaker
getCircuitBreaker('twilio', {
  failureThreshold: 5,    // Open after 5 consecutive failures
  successThreshold: 2,    // Close after 2 successes in half-open
  timeout: 60000          // Try again after 1 minute
});

module.exports = {
  CircuitBreaker,
  getCircuitBreaker,
  getAllStates,
  resetAll
};
