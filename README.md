# Lambda OpenAPI Generator

## Overview

`lambda-openapi-generator` is a TypeScript library that helps you generate OpenAPI (Swagger) specifications for AWS Lambda functions with ease. It provides a simple, composable interface for creating API documentation directly from your TypeScript types.

## Features

- Generate OpenAPI 3.0 specifications from TypeScript types
- Composable route definitions with rich metadata
- Automatic type inference and schema generation
- Support for path parameters with validation
- Query parameter definitions with optional/required flags
- Request and response header management
- Multiple response type definitions
- Security scheme configurations
- Server configurations for different environments
- Type-driven API documentation
- Easy integration with AWS Lambda functions

## Installation

```bash
npm install lambda-openapi-generator
```

## Basic Usage

```typescript
import OpenAPIGenerator from 'lambda-openapi-generator';

// Create a generator instance
const generator = new OpenAPIGenerator('My Lambda API', '1.0.0');

// Add server configurations
generator.addServer({
  url: 'https://api.example.com',
  description: 'Production server'
});

// Add security schemes
generator.addSecurityScheme('bearerAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT'
});

// Define routes with comprehensive configurations
generator.addRoute({
  path: '/users/{userId}',
  method: 'get',
  description: 'Retrieve a user by ID',
  parameters: {
    userId: {
      description: 'The unique identifier of the user'
    }
  },
  queryParameters: [{
    name: 'include',
    description: 'Fields to include in the response',
    required: false,
    schema: { type: 'string' }
  }],
  headers: {
    request: [{
      name: 'x-api-key',
      description: 'API Key for authentication',
      required: true,
      schema: { type: 'string' }
    }],
    response: [{
      name: 'x-rate-limit',
      description: 'Rate limit information',
      schema: { type: 'integer' }
    }]
  },
  responses: [{
    statusCode: 200,
    description: 'Successful response',
    type: 'User'
  }, {
    statusCode: 404,
    description: 'User not found',
    type: 'Error'
  }],
  security: ['bearerAuth']
});

// Generate the OpenAPI specification
const spec = generator.generateSpec();

// Write to a file
generator.writeSpecToFile('./openapi.json');
```

## Type Definitions

The generator automatically infers OpenAPI schemas from your TypeScript types:

```typescript
interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

interface Error {
  code: string;
  message: string;
}
```

## Advanced Usage

The library supports complex route compositions and can be extended to handle more sophisticated type mappings.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License
