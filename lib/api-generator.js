// lib/api-generator.js
const express = require('express');
const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path'); 
const { validationMiddleware } = require('./validation');
const { handleSuccess } = require('./response-handler');
const { generateSwaggerDocs } = require('./doc-generator');
const swaggerUi = require('swagger-ui-express');

const handlers = {};
const middlewares = {};

function registerMiddleware(name, middleware) {
    middlewares[name] = middleware;
}

function generateApi(app, { configPath, handlerPath }) {
    const router = express.Router();
    const configFile = fs.readFileSync(configPath, 'utf8');
    const routes = yaml.load(configFile);

    // Create a reliable, absolute path to the handlers directory
    const absoluteHandlerPath = path.resolve(process.cwd(), handlerPath);
    const handlerFiles = fs.readdirSync(absoluteHandlerPath);

    handlerFiles.forEach(file => {
        // Create a reliable, absolute path to each handler file
        const handlerFilePath = path.join(absoluteHandlerPath, file);
        const handlerModule = require(handlerFilePath);
        
        // Get the module name without the '.js' extension
        const moduleName = path.basename(file, '.js');
        handlers[moduleName] = handlerModule;
    });

    routes.forEach(route => {
        const [handlerModule, handlerFunc] = route.handler.split('.');
        const handler = handlers[handlerModule]?.[handlerFunc];
        if (!handler) {
            throw new Error(`Handler ${route.handler} not found. Make sure the file and function exist.`);
        }

        const routeMiddlewares = [];
        if (route.middleware) {
            route.middleware.forEach(mwName => {
                const mw = middlewares[mwName];
                if (mw) routeMiddlewares.push(mw);
            });
        }
        if (route.validate) {
            routeMiddlewares.push(validationMiddleware(route.validate));
        }

        router[route.method.toLowerCase()](
            route.path,
            ...routeMiddlewares,
            (req, res, next) => {
                Promise.resolve(handler(req, res, next))
                    .then(data => handleSuccess(res, data, route.successMessage))
                    .catch(err => next(err));
            }
        );
    });

    const swaggerDocs = generateSwaggerDocs(routes);
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

    app.use(router);
}

module.exports = { generateApi, registerMiddleware };