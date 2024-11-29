# Lambda OpenAPI Generator

## Overview

`lambda-openapi-generator` is a TypeScript library that helps you generate OpenAPI (Swagger) specifications for AWS Lambda functions with ease. It provides a simple, composable interface for creating API documentation directly from your TypeScript types.

## Features

- Generate OpenAPI 3.0 specifications
- Composable route definitions
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

// Define routes with type information
generator
  .addRoute({
    path: '/users',
    method: 'get',
    description: 'Retrieve list of users',
    responseType: 'UserList'
  })
  .addRoute({
    path: '/users',
    method: 'post',
    description: 'Create a new user',
    requestType: 'CreateUserRequest',
    responseType: 'User'
  });

// Generate the OpenAPI specification
const spec = generator.generateSpec();

// Optionally write to a file
generator.writeSpecToFile('./openapi.json');
```

## Advanced Usage

The library supports complex route compositions and can be extended to handle more sophisticated type mappings.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License
