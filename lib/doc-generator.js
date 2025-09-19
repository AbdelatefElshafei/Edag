function generateSwaggerDocs(routes) {
  const swaggerDef = {
    openapi: '3.0.0',
    info: {
      title: 'Dynamic API',
      version: '1.0.0',
      description: 'API documentation generated dynamically.',
    },
    paths: {},
  };

  routes.forEach(route => {
    if (!swaggerDef.paths[route.path]) {
      swaggerDef.paths[route.path] = {};
    }

    const pathItem = {
      summary: route.summary || route.handler,
      description: route.description || '',
      responses: {
        '200': {
          description: 'Successful response',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: { type: 'string', example: 'success' },
                  data: { type: 'object' },
                  message: { type: 'string' }
                }
              }
            }
          }
        }
      }
    };

    swaggerDef.paths[route.path][route.method.toLowerCase()] = pathItem;
  });

  return swaggerDef;
}

module.exports = { generateSwaggerDocs };