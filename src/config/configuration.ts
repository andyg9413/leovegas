import { Config } from './interfaces/config.interface';

const configuration = (): Config => ({
  app: {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3000', 10),
  },
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || 'root',
    name: process.env.DB_NAME || 'leovegas_db',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiration: process.env.JWT_EXPIRATION || '1h',
  },
  swagger: {
    title: process.env.SWAGGER_TITLE || 'LeoVegas API',
    description:
      process.env.SWAGGER_DESCRIPTION || 'LeoVegas NodeJS Developer API test',
    version: process.env.SWAGGER_VERSION || '1.0',
    path: process.env.SWAGGER_PATH || 'api-docs',
  },
});

export default configuration;
