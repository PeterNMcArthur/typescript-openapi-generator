import { SchemaObject, ParameterObject, SecuritySchemeObject } from 'openapi3-ts';
import OpenAPIGenerator from '../index';
import { RouteDefinition, UserList } from '../types';

describe('OpenAPIGenerator', () => {
  it('should create a basic OpenAPI specification', () => {
    const generator = new OpenAPIGenerator('Test API', '1.0.0');
    
    generator.addRoute({
      path: '/users',
      method: 'get',
      description: 'Get users',
      requestType: 'UserQuery',
      responses: [
        {
          statusCode: 200,
          description: 'Successfully retrieved users',
          type: 'UserList'
        },
        {
          statusCode: 400,
          description: 'Bad request',
          type: 'ErrorResponse'
        },
        {
          statusCode: 404,
          description: 'Users not found',
          type: 'ErrorResponse'
        }
      ]
    });

    const spec = generator.generateSpec();

    expect(spec.info.title).toBe('Test API');
    expect(spec.info.version).toBe('1.0.0');
    expect(spec.paths['/users']).toBeDefined();
    expect(spec.paths['/users'].get).toBeDefined();
    expect(spec.paths['/users'].get.requestBody).toBeDefined();
    expect(spec.paths['/users'].get.requestBody.content['application/json'].schema).toBeDefined();
    expect(spec.paths['/users'].get.responses['200'].content['application/json'].schema).toBeDefined();
  });

  it('should support multiple route compositions', () => {
    const generator = new OpenAPIGenerator('Test API', '1.0.0');
    
    generator
      .addRoute({
        path: '/users',
        method: 'get',
        description: 'List users',
        responses: [{ statusCode: 200, description: 'Success', type: 'UserList' }]
      })
      .addRoute({
        path: '/users',
        method: 'post',
        description: 'Create user',
        requestType: 'CreateUserRequest',
        responses: [{ statusCode: 201, description: 'Created', type: 'User' }]
      });

    const spec = generator.generateSpec();
    expect(spec.paths['/users'].get).toBeDefined();
    expect(spec.paths['/users'].post).toBeDefined();
    expect(spec.paths['/users'].post.requestBody).toBeDefined();
  });

  it('should write spec to file', () => {
    const fs = require('fs');
    const path = require('path');
    const tmpFile = path.join(__dirname, 'test-spec.json');
    
    const generator = new OpenAPIGenerator('Test API', '1.0.0');
    generator.addRoute({
      path: '/test',
      method: 'get',
      description: 'Test endpoint',
      responses: [{ statusCode: 200, description: 'Success' }]
    });

    generator.writeSpecToFile(tmpFile);
    
    expect(fs.existsSync(tmpFile)).toBe(true);
    const written = JSON.parse(fs.readFileSync(tmpFile, 'utf8'));
    expect(written.info.title).toBe('Test API');
    
    // Cleanup
    fs.unlinkSync(tmpFile);
  });

  it('should generate correct schema for UserList type', () => {
    const generator = new OpenAPIGenerator('Test API', '1.0.0');
    
    generator.addRoute({
      path: '/users',
      method: 'get',
      description: 'Get users',
      responses: [
        {
          statusCode: 200,
          description: 'Successfully retrieved users',
          type: 'UserList'
        }
      ]
    });

    const spec = generator.generateSpec();
    const schema = spec.paths['/users'].get.responses['200'].content['application/json'].schema;

    // Verify the schema structure
    expect(schema).toBeDefined();
    expect(schema.type).toBe('array');
    expect(schema.items).toBeDefined();
    expect(schema.items.type).toBe('object');
    expect(schema.items.properties).toBeDefined();
    expect(schema.items.properties.id).toBeDefined();
    expect(schema.items.properties.name).toBeDefined();
    expect(schema.items.properties.email).toBeDefined();
  });

  it('should include UserType enum in components schema', () => {
    const generator = new OpenAPIGenerator('Test API', '1.0.0');
    
    // Use the User type which contains UserType enum
    generator.addRoute({
      path: '/users/{userId}',
      method: 'get',
      description: 'Get user',
      responses: [
        {
          statusCode: 200,
          description: 'Successfully retrieved user',
          type: 'User'
        }
      ]
    });

    const spec = generator.generateSpec();

    // Ensure components exists
    expect(spec.components).toBeDefined();
    expect(spec.components?.schemas).toBeDefined();
    
    // Check User schema
    const userSchema = spec.components?.schemas?.User as SchemaObject;
    expect(userSchema).toBeDefined();
    expect(userSchema.properties?.type).toBeDefined();
    
    // Check UserType enum schema
    const userTypeRef = userSchema.properties?.type as SchemaObject;
    expect(userTypeRef.type).toBe('string');
    expect(userTypeRef.enum).toEqual(['admin', 'user', 'trial', 'guest']);
  });

  it('should properly handle path parameters', () => {
    const generator = new OpenAPIGenerator('Test API', '1.0.0');
    
    generator.addRoute({
      path: '/users/{userId}',
      method: 'get',
      description: 'Get user by ID',
      parameters: {
        userId: {
          description: 'The ID of the user to retrieve'
        }
      },
      responses: [
        {
          statusCode: 200,
          description: 'Successfully retrieved user',
          type: 'User'
        }
      ]
    });

    const spec = generator.generateSpec();
    
    // Check if path exists
    expect(spec.paths['/users/{userId}']).toBeDefined();
    expect(spec.paths['/users/{userId}'].get).toBeDefined();
    
    // Verify path parameter is properly defined
    const parameters = spec.paths['/users/{userId}'].get.parameters;
    expect(parameters).toBeDefined();
    expect(parameters).toHaveLength(1);
    expect(parameters[0].name).toBe('userId');
    expect(parameters[0].in).toBe('path');
    expect(parameters[0].required).toBe(true);
    expect(parameters[0].schema.type).toBe('string');
    expect(parameters[0].description).toBe('The ID of the user to retrieve');

    // Add a test for multiple path parameters
    generator.addRoute({
      path: '/users/{userId}/posts/{postId}',
      method: 'get',
      description: 'Get user post',
      parameters: {
        userId: {
          description: 'The ID of the user'
        },
        postId: {
          description: 'The ID of the post'
        }
      },
      responses: [
        {
          statusCode: 200,
          description: 'Successfully retrieved post',
          type: 'Post'
        }
      ]
    });

    const updatedSpec = generator.generateSpec();
    const multiParams = updatedSpec.paths['/users/{userId}/posts/{postId}'].get.parameters;
    expect(multiParams).toHaveLength(2);
    expect(multiParams[0].name).toBe('userId');
    expect(multiParams[0].required).toBe(true);
    expect(multiParams[1].name).toBe('postId');
    expect(multiParams[1].required).toBe(true);
  });

  it('should support security schemes', () => {
    const generator = new OpenAPIGenerator('Test API', '1.0.0');
    
    generator.addSecurityScheme('bearerAuth', {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      description: 'Enter JWT Bearer token'
    });

    generator.addRoute({
      path: '/secure-endpoint',
      method: 'get',
      security: ['bearerAuth'],
      responses: [
        {
          statusCode: 200,
          description: 'Success'
        }
      ]
    });

    const spec = generator.generateSpec();
    const bearerAuth = spec.components?.securitySchemes?.bearerAuth as SecuritySchemeObject;
    expect(bearerAuth).toBeDefined();
    expect(bearerAuth.type).toBe('http');
    expect(spec.paths['/secure-endpoint'].get.security).toBeDefined();
  });

  it('should support query parameters', () => {
    const generator = new OpenAPIGenerator('Test API', '1.0.0');
    
    generator.addRoute({
      path: '/users',
      method: 'get',
      queryParameters: {
        page: {
          required: false,
          schema: { type: 'integer', minimum: 1 },
          description: 'Page number'
        },
        limit: {
          required: false,
          schema: { type: 'integer', minimum: 1, maximum: 100 },
          description: 'Items per page'
        }
      },
      responses: [
        {
          statusCode: 200,
          description: 'Success',
          type: 'UserList'
        }
      ]
    });

    const spec = generator.generateSpec();
    const parameters = spec.paths['/users'].get.parameters as ParameterObject[];
    expect(parameters).toBeDefined();
    expect(parameters.find((p: ParameterObject) => p.name === 'page')).toBeDefined();
    expect(parameters.find((p: ParameterObject) => p.name === 'limit')).toBeDefined();
  });

  it('should support custom headers', () => {
    const generator = new OpenAPIGenerator('Test API', '1.0.0');
    
    generator.addRoute({
      path: '/users',
      method: 'post',
      headers: {
        request: [
          {
            name: 'X-API-Version',
            required: true,
            schema: { type: 'string' },
            description: 'API Version'
          }
        ],
        response: [
          {
            name: 'X-Rate-Limit',
            required: false,
            description: 'Rate limit details',
            schema: { type: 'integer' }
          }
        ]
      },
      responses: [
        {
          statusCode: 201,
          description: 'User created'
        }
      ]
    });

    const spec = generator.generateSpec();
    const operation = spec.paths['/users'].post;
    const parameters = operation.parameters as ParameterObject[];
    expect(parameters.find((p: ParameterObject) => p.name === 'X-API-Version' && p.in === 'header')).toBeDefined();
    expect(operation.responses['201'].headers?.['X-Rate-Limit']).toBeDefined();
  });

  it('should support server configurations', () => {
    const generator = new OpenAPIGenerator('Test API', '1.0.0');
    
    generator.addServer({
      url: 'https://api.example.com/v1',
      description: 'Production server'
    });

    generator.addServer({
      url: 'https://staging-api.example.com/v1',
      description: 'Staging server',
      variables: {
        environment: {
          default: 'staging',
          enum: ['staging', 'qa']
        }
      }
    });

    const spec = generator.generateSpec();
    expect(spec.servers).toBeDefined();
    expect(spec.servers).toHaveLength(2);
    expect(spec.servers?.[0]?.url).toBe('https://api.example.com/v1');
    expect(spec.servers?.[1]?.variables?.environment?.default).toBe('staging');
  });

  it('should add multiple routes using addRoutes method', () => {
    const generator = new OpenAPIGenerator('Test API', '1.0.0');
    
    const routes: RouteDefinition[] = [
        {
            path: '/users',
            method: 'get',
            description: 'List users',
            responses: [{ statusCode: 200, description: 'Success', type: 'UserList' }]
        },
        {
            path: '/users',
            method: 'post',
            description: 'Create user',
            requestType: 'CreateUserRequest',
            responses: [{ statusCode: 201, description: 'Created', type: 'User' }]
        }
    ];

    generator.addRoutes(routes);
    const spec = generator.generateSpec();

    expect(spec.paths['/users'].get).toBeDefined();
    expect(spec.paths['/users'].post).toBeDefined();
  });

  it('should not alter spec when addRoutes is called with an empty array', () => {
    const generator = new OpenAPIGenerator('Test API', '1.0.0');
    
    generator.addRoutes([]);
    const spec = generator.generateSpec();

    expect(spec.paths).toEqual({});
  });

  it('should handle multiple route types correctly', () => {
    const generator = new OpenAPIGenerator('Test API', '1.0.0');
    
    const routes: RouteDefinition[] = [
        {
            path: '/users/{userId}',
            method: 'get',
            description: 'Get user by ID',
            responses: [{ statusCode: 200, description: 'Success', type: 'User' }]
        },
        {
            path: '/users',
            method: 'delete',
            description: 'Delete user',
            requestType: 'DeleteUserRequest',
            responses: [{ statusCode: 204, description: 'No Content' }]
        }
    ];

    generator.addRoutes(routes);
    const spec = generator.generateSpec();

    expect(spec.paths['/users/{userId}'].get).toBeDefined();
    expect(spec.paths['/users'].delete).toBeDefined();
  });

  it('should validate responses for added routes', () => {
    const generator = new OpenAPIGenerator('Test API', '1.0.0');
    
    const routes: RouteDefinition[] = [
        {
            path: '/users',
            method: 'get',
            description: 'Get users',
            responses: [
                {
                    statusCode: 200,
                    description: 'Successfully retrieved users',
                    type: 'UserList'
                }
            ]
        }
    ];

    generator.addRoutes(routes);
    const spec = generator.generateSpec();
    const schema = spec.paths['/users'].get.responses['200'].content['application/json'].schema;

    expect(schema).toBeDefined();
    expect(schema.type).toBe('array');
    expect(schema.items).toBeDefined();
  });
});
