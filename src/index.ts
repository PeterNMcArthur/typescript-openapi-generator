import { Project } from 'ts-morph';
import { OpenAPIObject, PathItemObject, OperationObject, SchemaObject, SchemaObjectType, ParameterObject, SecuritySchemeObject, ServerObject, ResponseObject } from 'openapi3-ts';
import { RouteDefinition, SecurityScheme, ServerConfiguration, ResponseDefinition, PathParameterDefinition, QueryParameter, HeaderDefinition, ServerVariable } from './types';

// Re-export types
export type {
  RouteDefinition,
  SecurityScheme,
  ServerConfiguration,
  ResponseDefinition,
  PathParameterDefinition,
  QueryParameter,
  HeaderDefinition,
  ServerVariable
} from './types';

export class OpenAPIGenerator {
  private spec: OpenAPIObject = {
    openapi: '3.0.0',
    info: {
      title: 'Lambda API',
      version: '1.0.0'
    },
    paths: {},
    components: {
      schemas: {},
      securitySchemes: {}
    },
    servers: []
  };

  private project: Project;
  private typeChecker: any;

  constructor(title?: string, version?: string, sourceFiles?: string[]) {
    if (title) this.spec.info.title = title;
    if (version) this.spec.info.version = version;

    this.project = new Project({
      tsConfigFilePath: 'tsconfig.json',
    });
    
    // Add source files if provided, otherwise use default
    if (sourceFiles && sourceFiles.length > 0) {
      sourceFiles.forEach(file => this.project.addSourceFileAtPath(file));
    } else {
      this.project.addSourceFileAtPath('src/types.ts');
    }
    
    const program = this.project.getProgram();
    this.typeChecker = program.getTypeChecker();
  }

  addSecurityScheme(name: string, scheme: SecurityScheme): this {
    if (!this.spec.components) {
      this.spec.components = {
        schemas: {},
        securitySchemes: {}
      };
    }
    if (!this.spec.components.securitySchemes) {
      this.spec.components.securitySchemes = {};
    }
    this.spec.components.securitySchemes[name] = scheme as SecuritySchemeObject;
    return this;
  }

  addServer(server: ServerConfiguration): this {
    if (!this.spec.servers) {
      this.spec.servers = [];
    }
    this.spec.servers.push(server as ServerObject);
    return this;
  }

  private extractPathParameters(path: string): string[] {
    const matches = path.match(/{([^}]+)}/g);
    return matches ? matches.map(match => match.slice(1, -1)) : [];
  }

  addRoute(route: RouteDefinition): this {
    // Create path if it doesn't exist
    if (!this.spec.paths[route.path]) {
      this.spec.paths[route.path] = {};
    }

    const pathItem = this.spec.paths[route.path] as PathItemObject;
    const operation: OperationObject = {
      description: route.description || '',
      responses: {}
    };

    // Handle path parameters
    const pathParams = this.extractPathParameters(route.path);
    const parameters: ParameterObject[] = [];

    if (pathParams.length > 0) {
      pathParams.forEach(paramName => {
        parameters.push({
          name: paramName,
          in: 'path',
          required: true,
          schema: {
            type: 'string'
          } as SchemaObject,
          description: route.parameters?.[paramName]?.description || `${paramName} parameter`
        });
      });
    }

    // Handle query parameters
    if (route.queryParameters) {
      Object.entries(route.queryParameters).forEach(([name, param]) => {
        parameters.push({
          name,
          in: 'query',
          required: param.required,
          schema: param.schema as SchemaObject,
          description: param.description
        });
      });
    }

    // Handle request headers
    if (route.headers?.request) {
      route.headers.request.forEach(header => {
        parameters.push({
          name: header.name,
          in: 'header',
          required: header.required || false,
          schema: header.schema as SchemaObject,
          description: header.description
        });
      });
    }

    if (parameters.length > 0) {
      operation.parameters = parameters;
    }

    // Handle security
    if (route.security) {
      operation.security = route.security.map(scheme => ({ [scheme]: [] }));
    }

    // Add request body if request type is specified
    if (route.requestType) {
      operation.requestBody = {
        content: {
          'application/json': {
            schema: this.extractTypeSchema(route.requestType)
          }
        }
      };
    }

    // Handle responses and response headers
    route.responses.forEach(response => {
      const responseObj: ResponseObject = {
        description: response.description,
        content: {
          'application/json': {
            schema: response.type ? this.extractTypeSchema(response.type) : {}
          }
        }
      };

      // Add response headers if specified
      if (route.headers?.response) {
        const headers: Record<string, any> = {};
        route.headers.response.forEach(header => {
          headers[header.name] = {
            description: header.description,
            schema: header.schema,
            required: header.required || false
          };
        });
        responseObj.headers = headers;
      }

      operation.responses[response.statusCode.toString()] = responseObj;
    });

    pathItem[route.method] = operation;
    return this;
  }

  addRoutes(routes: RouteDefinition[]): void {
    if (!Array.isArray(routes)) {
      throw new Error("Routes must be an array");
    }

    for (const route of routes) {
      this.addRoute(route);
    }
  }

  private extractTypeSchema(typeName: string): SchemaObject {
    // Search for the type in all source files
    const sourceFiles = this.project.getSourceFiles();
    let typeAlias = null;
    
    for (const sourceFile of sourceFiles) {
      try {
        typeAlias = sourceFile.getTypeAlias(typeName);
        if (typeAlias) break;
      } catch (error) {
        continue;
      }
    }
    
    if (!typeAlias) {
      throw new Error(`Type '${typeName}' not found in any source files`);
    }

    const tsType = typeAlias.getType();
    
    // Register the schema in components
    const schema = this.getSchemaForType(tsType);
    if (this.spec.components?.schemas) {
      this.spec.components.schemas[typeName] = schema;
    }
    
    if (tsType.isArray()) {
      const elementType = tsType.getArrayElementType();
      return {
        type: 'array',
        items: this.getSchemaForType(elementType)
      };
    }

    return schema;
  }

  private getSchemaForType(type: any): SchemaObject {
    const properties: Record<string, SchemaObject> = {};
    
    if (type.isArray()) {
      const elementType = type.getArrayElementType();
      return {
        type: 'array',
        items: this.getSchemaForType(elementType)
      };
    }

    if (type.isEnum()) {
      return {
        type: 'string',
        enum: type.getUnionTypes().map((t: any) => t.getLiteralValue())
      };
    }

    if (type.isObject()) {
      type.getProperties().forEach((prop: any) => {
        const propType = prop.getTypeAtLocation(prop.getValueDeclaration());
        let propSchema: SchemaObject;

        if (propType.isEnum()) {
          propSchema = {
            type: 'string',
            enum: propType.getUnionTypes().map((t: any) => t.getLiteralValue())
          };
        } else {
          propSchema = {
            type: this.getTypeString(propType)
          };
        }
        
        properties[prop.getName()] = propSchema;
      });

      return {
        type: 'object',
        properties
      };
    }

    return {
      type: this.getTypeString(type)
    };
  }

  private getTypeString(type: any): SchemaObjectType {
    if (type.isNumberLiteral() || type.isNumber()) return 'number';
    if (type.isStringLiteral() || type.isString()) return 'string';
    if (type.isBooleanLiteral() || type.isBoolean()) return 'boolean';
    if (type.isArray()) return 'array';
    if (type.isObject()) return 'object';
    if (type.isNull() || type.isUndefined()) return 'null';
    return 'string'; // Default fallback
  }

  private mapTypeToSchemaType(typeString: string): SchemaObjectType {
    switch (typeString.toLowerCase()) {
      case 'string':
        return 'string';
      case 'number':
        return 'number';
      case 'boolean':
        return 'boolean';
      case 'object':
        return 'object';
      case 'array':
        return 'array';
      case 'null':
      case 'undefined':
        return 'null';
      default:
        return 'string'; // Default fallback
    }
  }

  generateSpec(): OpenAPIObject {
    return this.spec;
  }

  // Optional: Write spec to a file
  writeSpecToFile(filePath: string) {
    const fs = require('fs');
    fs.writeFileSync(filePath, JSON.stringify(this.spec, null, 2));
  }
}

// Export for use
export default OpenAPIGenerator;
