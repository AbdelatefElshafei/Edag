const { generateApi, registerMiddleware } = require('./lib/api-generator');
const { errorHandler } = require('./lib/error-handler');

module.exports = {
  generateApi,
  registerMiddleware,
  errorHandler
};