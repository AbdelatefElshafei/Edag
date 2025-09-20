# Express Dynamic API Generator
<img width="1024" height="611" alt="Edag" src="https://github.com/user-attachments/assets/1ccaf8c4-854d-4c5c-8711-a87f89bf6bc1" />
[![npm version](https://badge.fury.io/js/edag.svg)](https://www.npmjs.com/package/edag)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

An unopinionated, lightweight library for Express.js that accelerates API development by adopting a declarative, configuration-driven approach. It automatically generates routes, validates request payloads, and produces OpenAPI documentation from a single, centralized configuration file.

This library is designed to eliminate boilerplate, enforce consistency, and serve as a "single source of truth" for your API's structure.

### The Philosophy

In modern backend development, API endpoints often require a tedious combination of routing, validation, request handling, response formatting, and documentation. This logic is typically scattered across multiple files, leading to code duplication and architectural drift.

**Express Dynamic API Generator** treats your API's definition as a formal configuration. By defining your routes, validation schemas, and handler links in one place, you gain:

-   **Reduced Boilerplate:** No more repetitive `app.get(...)`, `app.post(...)` blocks.
-   **Enforced Consistency:** All routes automatically adhere to standardized validation and response structures.
-   **Self-Documentation:** The configuration that builds your API is the same one that generates its documentation. They can never be out of sync.
-   **Rapid Prototyping & Iteration:** Add, remove, or modify endpoints and their validation rules with minimal code changes.

---

### Features

-   **Declarative Route Generation**: Define all API routes in a single YAML or JSON file.
-   **Schema-Based Request Validation**: Built-in validation for request `body`, `params`, and `query` using a Joi-like syntax.
-   **Standardized JSON Responses**: Automatically wraps all successful responses and errors in a consistent `{ status, data, message }` envelope.
-   **Automatic OpenAPI 3.0 Documentation**: Generates and serves interactive API documentation using Swagger UI.
-   **Extensible Middleware Integration**: Apply global or route-specific middleware with simple configuration keys.
-   **Centralized and Predictable Error Handling**: Catches exceptions from handlers and validation layers, formatting them into a standard error response.

---

### Installation

```bash
npm install edag
```

### Core Concepts

The library operates on three core components:

1.  **The Configuration File (`routes.yaml`)**: The heart of the library. A structured file where you declaratively define every aspect of your API endpoints.
2.  **Handlers**: Your business logic. These are standard asynchronous functions that receive `(req, res, next)` and return data or throw errors. They are decoupled from the routing and validation layers.
3.  **The Generator (`generateApi`)**: The function that connects everything. It parses the configuration, dynamically creates Express routes, attaches middleware and validators, links handlers, and sets up the documentation endpoint.

---

### Quick Start

This example demonstrates a simple User API.

#### 1. Project Structure

```
/my-api-project
|-- /handlers
|   |-- userHandlers.js
|-- routes.yaml
|-- server.js
|-- package.json
```

#### 2. Define Your API in `routes.yaml`

```yaml
# A list of all API endpoints for the application.

- path: /users
  method: get
  handler: userHandlers.getAllUsers
  middleware: [logger]
  summary: "Retrieves a list of all users"
  successMessage: "Users retrieved successfully"

- path: /users/:id
  method: get
  handler: userHandlers.getUserById
  middleware: [logger]
  summary: "Retrieves a single user by their ID"
  successMessage: "User found"
  validate:
    params:
      id:
        type: number
        integer: true
        required: true

- path: /users
  method: post
  handler: userHandlers.createUser
  middleware: [logger]
  summary: "Creates a new user"
  successMessage: "User created successfully"
  validate:
    body:
      name:
        type: string
        required: true
        min: 2
      email:
        type: string
        email: true
        required: true
```

#### 3. Implement Your Business Logic in `handlers/userHandlers.js`

Handlers are kept clean and focused. They receive the request, perform an action, and either return data or throw a structured error.

```javascript
// handlers/userHandlers.js

// This is a mock database. In a real application, this would be a database service.
const users = [{ id: 1, name: 'John Doe', email: 'john@example.com' }];
let nextId = 2;

module.exports = {
  getAllUsers: async (req, res) => {
    return users;
  },

  getUserById: async (req, res) => {
    const user = users.find(u => u.id === parseInt(req.params.id));
    if (!user) {
      // Throw an error to be caught by the centralized handler.
      // Setting a statusCode is a best practice.
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }
    return user;
  },

  createUser: async (req, res) => {
    // req.body is already validated at this point.
    const newUser = { id: nextId++, ...req.body };
    users.push(newUser);
    // Return the newly created resource.
    return newUser;
  },
};
```

#### 4. Bootstrap Your Express Server in `server.js`

```javascript
const express = require('express');
const path = require('path');
const morgan = require('morgan'); 

// Import from the library
const { generateApi, registerMiddleware, errorHandler } = require('edag');

const app = express();
const PORT = process.env.PORT || 3000;

// 1. Apply global middleware
app.use(express.json());

// 2. Register any named middleware you want to use in your YAML config
registerMiddleware('logger', morgan('dev'));

// 3. Generate the API from your configuration
generateApi(app, {
  configPath: path.join(__dirname, 'routes.yaml'),
  handlerPath: path.join(__dirname, 'handlers'),
});

// 4. Register the centralized error handler (must be placed after generateApi)
app.use(errorHandler);

// 5. Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`API documentation available at http://localhost:${PORT}/api-docs`);
});
```

---

### API Reference

#### `generateApi(app, options)`

This is the primary function of the library.

-   `app`: An Express application instance.
-   `options`: An object with the following properties:
    -   `configPath` (string, required): The file path to your `routes.yaml` or `routes.json` file.
    -   `handlerPath` (string, required): The path to the directory containing your handler files.

#### `registerMiddleware(name, middleware)`

Registers a middleware function with a friendly name that can be referenced in `routes.yaml`.

-   `name` (string, required): The alias for the middleware (e.g., `'auth'`).
-   `middleware` (function, required): An Express middleware function `(req, res, next)`.

#### `errorHandler`

A pre-built, centralized Express error handling middleware. It's highly recommended to register this last in your middleware stack.

#### Route Configuration (`routes.yaml`)

Each object in the root array defines a route. The following keys are supported:

| Key              | Type     | Required | Description                                                                                                                              |
| ---------------- | -------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `path`           | `string` | Yes      | The URL path for the route, supporting Express path parameters (e.g., `/users/:id`).                                                     |
| `method`         | `string` | Yes      | An HTTP method: `get`, `post`, `put`, `delete`, or `patch`.                                                                              |
| `handler`        | `string` | Yes      | A string formatted as `fileName.functionName` that points to the handler function. `fileName` corresponds to a file in the `handlerPath`. |
| `summary`        | `string` | No       | A brief description of the endpoint, used for generating API documentation.                                                              |
| `successMessage` | `string` | No       | A custom message to be included in the standardized success response. Defaults to `'Success'`.                                              |
| `middleware`     | `array`  | No       | An array of string names corresponding to middleware registered with `registerMiddleware`. They execute in order.                            |
| `validate`       | `object` | No       | An object specifying validation rules for `body`, `params`, or `query`. See the validation schema below.                                   |

#### Validation Schema

The `validate` object can contain `body`, `params`, or `query` keys. Each of these is an object where keys are field names and values are rule objects.

```yaml
validate:
  body:
    fieldName:
      type: string            # 'string', 'number', 'boolean', 'array', 'object'
      required: true          # boolean
      # String-specific rules
      email: true             # boolean
      min: 2                  # number (min length)
      max: 100                # number (max length)
      # Number-specific rules
      integer: true           # boolean
```
---

### Contributing

Contributions, issues, and feature requests are welcome. Feel free to check the [issues page](https://github.com/AbdelatefElshafei/edag/issues). To contribute:

1.  Fork the repository.
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.
