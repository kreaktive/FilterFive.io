/**
 * CSV Stream Processor
 *
 * Memory-efficient CSV processing using streams and chunking.
 * Processes rows in configurable chunk sizes to prevent memory exhaustion
 * with large files while providing progress callbacks.
 */

const fs = require('fs');
const csv = require('csv-parser');
const { Transform } = require('stream');
const logger = require('../services/logger');

/**
 * Configuration defaults
 */
const DEFAULTS = {
  chunkSize: 50,         // Process 50 rows at a time
  maxRows: 500,          // Maximum total rows allowed
  maxFileSize: 5 * 1024 * 1024, // 5MB
  highWaterMark: 64 * 1024      // 64KB buffer for file stream
};

/**
 * Create a transform stream that processes rows in chunks
 *
 * @param {object} options Configuration options
 * @param {number} options.chunkSize Rows per chunk (default: 50)
 * @param {number} options.maxRows Maximum total rows (default: 500)
 * @param {function} options.onChunk Callback for each chunk: (chunk, metadata) => Promise
 * @param {function} options.onProgress Callback for progress: ({ current, total, percent }) => void
 * @param {function} options.normalizeRow Transform each row before processing
 * @returns {Transform} Transform stream
 */
function createChunkProcessor(options = {}) {
  const {
    chunkSize = DEFAULTS.chunkSize,
    maxRows = DEFAULTS.maxRows,
    onChunk,
    onProgress,
    normalizeRow = (row) => row
  } = options;

  let buffer = [];
  let totalRows = 0;
  let processedRows = 0;
  let chunkIndex = 0;
  let exceededMax = false;

  return new Transform({
    objectMode: true,
    async transform(row, encoding, callback) {
      try {
        // Enforce row limit
        if (totalRows >= maxRows) {
          if (!exceededMax) {
            exceededMax = true;
            logger.warn('CSV row limit exceeded', { maxRows, totalRows });
          }
          // Skip but don't error - we'll report the limit at the end
          return callback();
        }

        totalRows++;

        // Normalize the row
        const normalizedRow = normalizeRow(row);
        normalizedRow._rowNumber = totalRows;

        buffer.push(normalizedRow);

        // Process chunk when buffer is full
        if (buffer.length >= chunkSize) {
          const chunk = buffer;
          buffer = [];
          chunkIndex++;

          // Call onChunk if provided
          if (onChunk) {
            await onChunk(chunk, {
              chunkIndex,
              chunkSize: chunk.length,
              startRow: processedRows + 1,
              endRow: processedRows + chunk.length
            });
          }

          processedRows += chunk.length;

          // Report progress
          if (onProgress) {
            onProgress({
              current: processedRows,
              total: totalRows,
              percent: Math.round((processedRows / totalRows) * 100),
              chunkIndex
            });
          }

          // Pass chunk through (as array)
          this.push(chunk);
        }

        callback();
      } catch (error) {
        callback(error);
      }
    },

    async flush(callback) {
      try {
        // Process remaining rows in buffer
        if (buffer.length > 0) {
          const chunk = buffer;
          buffer = [];
          chunkIndex++;

          if (onChunk) {
            await onChunk(chunk, {
              chunkIndex,
              chunkSize: chunk.length,
              startRow: processedRows + 1,
              endRow: processedRows + chunk.length,
              isFinal: true
            });
          }

          processedRows += chunk.length;

          if (onProgress) {
            onProgress({
              current: processedRows,
              total: totalRows,
              percent: 100,
              chunkIndex,
              isFinal: true
            });
          }

          this.push(chunk);
        }

        // Push metadata as final item
        this.push({
          _metadata: true,
          totalRows,
          processedRows,
          chunks: chunkIndex,
          exceededMax,
          maxRows
        });

        callback();
      } catch (error) {
        callback(error);
      }
    }
  });
}

/**
 * Process a CSV file using streams with memory-efficient chunking
 *
 * @param {string} filePath Path to CSV file
 * @param {object} options Processing options
 * @param {number} options.chunkSize Rows per chunk
 * @param {number} options.maxRows Maximum rows to process
 * @param {function} options.onChunk Async callback for each chunk
 * @param {function} options.onProgress Progress callback
 * @param {function} options.normalizeRow Row transformation function
 * @param {function} options.validateRow Row validation function (returns {isValid, errors})
 * @returns {Promise<object>} Processing results
 */
async function processCSVStream(filePath, options = {}) {
  const {
    chunkSize = DEFAULTS.chunkSize,
    maxRows = DEFAULTS.maxRows,
    onChunk,
    onProgress,
    normalizeRow = defaultNormalizeRow,
    validateRow,
    mapHeaders = defaultMapHeaders
  } = options;

  return new Promise((resolve, reject) => {
    const results = {
      validRows: [],
      invalidRows: [],
      totalRows: 0,
      processedRows: 0,
      chunks: 0,
      exceededMax: false,
      errors: []
    };

    const fileStream = fs.createReadStream(filePath, {
      highWaterMark: DEFAULTS.highWaterMark
    });

    const csvParser = csv({
      mapHeaders: mapHeaders
    });

    const chunkProcessor = createChunkProcessor({
      chunkSize,
      maxRows,
      normalizeRow,
      onProgress,
      onChunk: async (chunk, metadata) => {
        // Validate each row in the chunk if validator provided
        if (validateRow) {
          for (const row of chunk) {
            const validation = validateRow(row);
            if (validation.isValid) {
              results.validRows.push({
                ...row,
                ...validation.data // Include any normalized data from validation
              });
            } else {
              results.invalidRows.push({
                ...row,
                errors: validation.errors
              });
              results.errors.push({
                row: row._rowNumber,
                name: row.name,
                phone: row.phone,
                error: validation.errors.join(', ')
              });
            }
          }
        } else {
          // No validation, all rows are valid
          results.validRows.push(...chunk);
        }

        // Call custom onChunk handler
        if (onChunk) {
          await onChunk(chunk, metadata);
        }
      }
    });

    fileStream
      .on('error', (error) => {
        logger.error('CSV file stream error', { error: error.message, filePath });
        reject(error);
      })
      .pipe(csvParser)
      .on('error', (error) => {
        logger.error('CSV parse error', { error: error.message, filePath });
        reject(error);
      })
      .pipe(chunkProcessor)
      .on('data', (data) => {
        // Handle metadata object
        if (data._metadata) {
          results.totalRows = data.totalRows;
          results.processedRows = data.processedRows;
          results.chunks = data.chunks;
          results.exceededMax = data.exceededMax;
          if (data.exceededMax) {
            results.errors.push({
              row: null,
              error: `File exceeds maximum ${data.maxRows} rows. Only first ${data.maxRows} rows were processed.`
            });
          }
        }
      })
      .on('end', () => {
        logger.info('CSV stream processing complete', {
          totalRows: results.totalRows,
          validRows: results.validRows.length,
          invalidRows: results.invalidRows.length,
          chunks: results.chunks
        });
        resolve(results);
      })
      .on('error', (error) => {
        logger.error('CSV chunk processor error', { error: error.message });
        reject(error);
      });
  });
}

/**
 * Default header mapping function
 * Normalizes headers to lowercase and trims whitespace
 */
function defaultMapHeaders({ header }) {
  return header.toLowerCase().trim();
}

/**
 * Default row normalization function
 * Maps common CSV column names to standard format
 */
function defaultNormalizeRow(row) {
  return {
    name: row.name?.trim() || row.customer_name?.trim() || row.customername?.trim() || '',
    phone: row.phone?.trim() || row.customer_phone?.trim() || row.customerphone?.trim() || row.mobile?.trim() || row.cell?.trim() || '',
    email: row.email?.trim() || row.customer_email?.trim() || row.customeremail?.trim() || ''
  };
}

/**
 * Validate file size before processing
 * @param {string} filePath Path to file
 * @param {number} maxSize Maximum size in bytes
 * @returns {Promise<{valid: boolean, size: number, error?: string}>}
 */
async function validateFileSize(filePath, maxSize = DEFAULTS.maxFileSize) {
  const stats = await fs.promises.stat(filePath);

  if (stats.size > maxSize) {
    return {
      valid: false,
      size: stats.size,
      error: `File size (${Math.round(stats.size / 1024)}KB) exceeds maximum allowed (${Math.round(maxSize / 1024)}KB)`
    };
  }

  return {
    valid: true,
    size: stats.size
  };
}

/**
 * Count lines in a file efficiently (streaming)
 * Useful for progress indication before processing
 * @param {string} filePath Path to file
 * @returns {Promise<number>} Line count
 */
async function countLines(filePath) {
  return new Promise((resolve, reject) => {
    let count = 0;
    fs.createReadStream(filePath)
      .on('data', (chunk) => {
        for (let i = 0; i < chunk.length; i++) {
          if (chunk[i] === 10) count++; // newline character
        }
      })
      .on('end', () => resolve(count))
      .on('error', reject);
  });
}

module.exports = {
  processCSVStream,
  createChunkProcessor,
  validateFileSize,
  countLines,
  defaultNormalizeRow,
  defaultMapHeaders,
  DEFAULTS
};
