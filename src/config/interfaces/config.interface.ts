export interface Config {
  app: AppConfig;
  database: DatabaseConfig;
  jwt: JwtConfig;
  swagger: SwaggerConfig;
}

export interface AppConfig {
  nodeEnv: string;
  port: number;
}

export interface DatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  name: string;
}

export interface JwtConfig {
  secret: string;
  expiration: string;
}

export interface SwaggerConfig {
  title: string;
  description: string;
  version: string;
  path: string;
}
