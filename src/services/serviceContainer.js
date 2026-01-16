/**
 * Service Container
 *
 * Simple dependency injection container for MoreStars services.
 * Allows registering, resolving, and mocking services for testing.
 *
 * Features:
 * - Singleton and factory registration
 * - Lazy loading of services
 * - Easy mocking for tests
 * - Service lifecycle management
 */

class ServiceContainer {
  constructor() {
    this._services = new Map();
    this._singletons = new Map();
    this._factories = new Map();
  }

  /**
   * Register a service as a singleton
   * The factory function is only called once, and the result is cached.
   *
   * @param {string} name Service name
   * @param {function|object} factoryOrInstance Factory function or instance
   * @returns {ServiceContainer} For chaining
   */
  singleton(name, factoryOrInstance) {
    if (typeof factoryOrInstance === 'function') {
      this._factories.set(name, {
        factory: factoryOrInstance,
        singleton: true
      });
    } else {
      // Direct instance registration
      this._singletons.set(name, factoryOrInstance);
    }
    return this;
  }

  /**
   * Register a service as a factory
   * The factory function is called each time the service is resolved.
   *
   * @param {string} name Service name
   * @param {function} factory Factory function
   * @returns {ServiceContainer} For chaining
   */
  factory(name, factory) {
    this._factories.set(name, {
      factory,
      singleton: false
    });
    return this;
  }

  /**
   * Register a service (alias for singleton for compatibility)
   *
   * @param {string} name Service name
   * @param {function|object} factoryOrInstance Factory or instance
   * @returns {ServiceContainer} For chaining
   */
  register(name, factoryOrInstance) {
    return this.singleton(name, factoryOrInstance);
  }

  /**
   * Resolve a service by name
   *
   * @param {string} name Service name
   * @returns {*} Service instance
   * @throws {Error} If service is not registered
   */
  resolve(name) {
    // Check for cached singleton
    if (this._singletons.has(name)) {
      return this._singletons.get(name);
    }

    // Check for factory
    if (this._factories.has(name)) {
      const { factory, singleton } = this._factories.get(name);
      const instance = factory(this);

      if (singleton) {
        this._singletons.set(name, instance);
      }

      return instance;
    }

    throw new Error(`Service '${name}' is not registered`);
  }

  /**
   * Check if a service is registered
   *
   * @param {string} name Service name
   * @returns {boolean}
   */
  has(name) {
    return this._singletons.has(name) || this._factories.has(name);
  }

  /**
   * Get a service (alias for resolve)
   *
   * @param {string} name Service name
   * @returns {*} Service instance
   */
  get(name) {
    return this.resolve(name);
  }

  /**
   * Override a service (useful for testing)
   *
   * @param {string} name Service name
   * @param {*} instance Mock/stub instance
   * @returns {ServiceContainer} For chaining
   */
  mock(name, instance) {
    this._singletons.set(name, instance);
    return this;
  }

  /**
   * Clear a specific mock/singleton
   *
   * @param {string} name Service name
   * @returns {ServiceContainer} For chaining
   */
  clearMock(name) {
    this._singletons.delete(name);
    return this;
  }

  /**
   * Reset all singletons (useful between tests)
   * Keeps factories intact for re-resolution
   */
  resetSingletons() {
    this._singletons.clear();
  }

  /**
   * Reset everything - all registrations
   */
  reset() {
    this._services.clear();
    this._singletons.clear();
    this._factories.clear();
  }

  /**
   * Get list of registered service names
   *
   * @returns {string[]} Service names
   */
  getRegisteredServices() {
    return [
      ...this._singletons.keys(),
      ...this._factories.keys()
    ].filter((v, i, a) => a.indexOf(v) === i); // Unique
  }
}

// Create default global container
const container = new ServiceContainer();

// Register core services
container.singleton('logger', () => require('./logger'));
container.singleton('cache', () => require('./cacheService'));
container.singleton('sms', () => require('./smsService'));
container.singleton('email', () => require('./emailService'));
container.singleton('stripe', () => require('./stripeService'));
container.singleton('analytics', () => require('./analyticsService'));
container.singleton('sentry', () => require('./sentryService'));

// Factory for services that need fresh instances
container.factory('smsLimitService', () => require('./smsLimitService'));

/**
 * Helper to get a service from the default container
 * @param {string} name Service name
 * @returns {*} Service instance
 */
function getService(name) {
  return container.resolve(name);
}

/**
 * Create a new container (useful for testing with isolated state)
 * @returns {ServiceContainer} New container instance
 */
function createContainer() {
  return new ServiceContainer();
}

module.exports = {
  container,
  ServiceContainer,
  getService,
  createContainer
};
