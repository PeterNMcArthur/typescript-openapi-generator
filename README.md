# TS to OpenAPI Spec

## Overview

`ts-to-openapi-spec` is a TypeScript library that helps you generate OpenAPI (Swagger) specifications for AWS Lambda functions with ease. It provides a simple, composable interface for creating API documentation directly from your TypeScript types.

## Features

- Generate OpenAPI 3.0 specifications from TypeScript types
- Project-based configuration with glob pattern support
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
npm install ts-to-openapi-spec
```

## Basic Usage

```typescript
import OpenAPIGenerator from 'ts-to-openapi-spec';

// Create a generator instance with project configuration
const generator = await OpenAPIGenerator.create({
  title: 'My Lambda API',
  version: '1.0.0',
  project: {
    rootDir: 'src',
    include: ['**/*.ts'],       // Include all TypeScript files
    exclude: ['**/*.test.ts']   // Exclude test files
  }
});

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
  description: 'Get user by ID',
  parameters: {
    userId: {
      description: 'The user ID'
    }
  },
  responses: [
    {
      statusCode: 200,
      description: 'User found',
      type: 'User'  // References your TypeScript type
    },
    {
      statusCode: 404,
      description: 'User not found',
      type: 'ErrorResponse'
    }
  ]
});

// Generate the OpenAPI specification
const spec = generator.generateSpec();
```

## Project Configuration

The library now uses a project-based configuration approach, making it easier to work with TypeScript files across your project:

```typescript
type ProjectConfig = {
  rootDir: string;        // Root directory for TypeScript files
  include: string[];      // Glob patterns for files to include
  exclude?: string[];     // Optional glob patterns for files to exclude
};

type GeneratorConfig = {
  title?: string;         // API title
  version?: string;       // API version
  project: ProjectConfig; // Project configuration
};
```

### Example Configurations

1. Basic configuration:
```typescript
const config = {
  title: 'My API',
  version: '1.0.0',
  project: {
    rootDir: 'src',
    include: ['**/*.ts']
  }
};
```

2. With exclusions:
```typescript
const config = {
  title: 'My API',
  version: '1.0.0',
  project: {
    rootDir: 'src',
    include: ['**/*.ts'],
    exclude: ['**/*.test.ts', '**/*.spec.ts']
  }
};
```

3. Multiple source directories:
```typescript
const config = {
  title: 'My API',
  version: '1.0.0',
  project: {
    rootDir: 'src',
    include: ['types/**/*.ts', 'models/**/*.ts']
  }
};
```

## Type Discovery

The library will automatically discover and process TypeScript types from all files matching your project configuration. This means you can:

1. Organize your types across multiple files
2. Use types from any file in your project
3. Exclude test files or other non-API types
4. Keep your API documentation close to your type definitions

## Examples

### Complex Route Definition

```typescript
generator.addRoute({
  path: '/users',
  method: 'get',
  description: 'Search users',
  queryParameters: {
    name: {
      required: false,
      schema: {
        type: 'string'
      },
      description: 'Filter by name'
    }
  },
  headers: {
    request: [
      {
        name: 'X-API-Key',
        required: true,
        schema: {
          type: 'string'
        }
      }
    ]
  },
  security: ['bearerAuth'],
  responses: [
    {
      statusCode: 200,
      description: 'Users found',
      type: 'UserList'
    }
  ]
});
```

### Multiple Routes

```typescript
generator.addRoutes([
  {
    path: '/users',
    method: 'post',
    description: 'Create user',
    requestType: 'CreateUserRequest',
    responses: [
      {
        statusCode: 201,
        description: 'User created',
        type: 'User'
      }
    ]
  },
  {
    path: '/users/{userId}',
    method: 'delete',
    description: 'Delete user',
    parameters: {
      userId: {
        description: 'The user ID'
      }
    },
    responses: [
      {
        statusCode: 204,
        description: 'User deleted'
      }
    ]
  }
]);
```

## Contributing

Please see our [Contributing Guide](CONTRIBUTING.md) for details on how to contribute to this project.

## License

MIT
