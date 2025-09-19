// examples/server.js
const express = require('express');
const path = require('path');
const { generateApi, registerMiddleware } = require('../lib/api-generator');
const { errorHandler } = require('../lib/error-handler');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 3005;

// 1. Apply global middleware
app.use(express.json()); // Middleware to parse JSON bodies

// 2. Register named middleware that can be used in the YAML config
// Here, we're using the popular 'morgan' logger
registerMiddleware('logger', morgan('dev'));

// 3. Generate the API routes from your configuration
generateApi(app, {
  configPath: path.join(__dirname, 'routes.yaml'), // Use path.join for reliability
  handlerPath: path.join(__dirname, 'handlers'),   // Use path.join for reliability
});

// 4. Add the centralized error handler. This MUST be last.
app.use(errorHandler);

// 5. Start the server
app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
  console.log(`📚 API documentation available at http://localhost:${PORT}/api-docs`);
});