
export type ResponseDefinition = {
  statusCode: number;
  description: string;
  type?: string;
};

export type PathParameterDefinition = {
  description?: string;
};

export type SecurityScheme = {
  type: 'apiKey' | 'http' | 'oauth2' | 'openIdConnect';
  description?: string;
  name?: string;
  in?: 'query' | 'header' | 'cookie';
  scheme?: string;
  bearerFormat?: string;
  flows?: any; // OAuth2 flows
  openIdConnectUrl?: string;
};

export type QueryParameter = {
  name: string;
  required: boolean;
  schema: {
    type: string;
    minimum?: number;
    maximum?: number;
    format?: string;
    pattern?: string;
  };
  description?: string;
};

export type HeaderDefinition = {
  name: string;
  required?: boolean;
  schema: {
    type: string;
    format?: string;
  };
  description?: string;
};

export type ServerVariable = {
  default: string;
  enum?: string[];
  description?: string;
};

export type ServerConfiguration = {
  url: string;
  description?: string;
  variables?: {
    [key: string]: ServerVariable;
  };
};

export type RouteDefinition = {
  path: string;
  method: 'get' | 'post' | 'put' | 'delete' | 'patch';
  description?: string;
  requestType?: string;
  parameters?: {
    [key: string]: PathParameterDefinition;
  };
  queryParameters?: {
    [key: string]: Omit<QueryParameter, 'name'>;
  };
  headers?: {
    request?: HeaderDefinition[];
    response?: HeaderDefinition[];
  };
  security?: string[];
  responses: ResponseDefinition[];
};