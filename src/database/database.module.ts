import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: async (
        configService: ConfigService,
      ): Promise<TypeOrmModuleOptions> => {
        const logger = new Logger('DatabaseModule');
        const maxRetries = 5;
        const retryDelay = 5000; // 5 seconds

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            // Test the connection
            const connection: TypeOrmModuleOptions = {
              type: 'mysql',
              host: configService.get('database.host'),
              port: configService.get('database.port'),
              username: configService.get('database.username'),
              password: configService.get('database.password'),
              database: configService.get('database.name'),
              entities: [__dirname + '/../**/*.entity{.ts,.js}'],
              synchronize: configService.get('app.nodeEnv') === 'development',
              logging: configService.get('app.nodeEnv') === 'development',
              migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
              migrationsRun: true,
            };

            // Try to connect
            const mysql = require('mysql2/promise');
            const pool = await mysql.createPool({
              host: connection.host,
              port: connection.port,
              user: connection.username,
              password: connection.password,
              database: connection.database,
            });

            // Test the connection
            await pool.query('SELECT 1');
            await pool.end();

            logger.log('Successfully connected to database');
            return connection;
          } catch (error) {
            logger.warn(
              `Failed to connect to database (attempt ${attempt}/${maxRetries}): ${error.message}`,
            );

            if (attempt === maxRetries) {
              logger.error(
                'Max retries reached. Unable to connect to database.',
              );
              throw error;
            }

            // Wait with exponential backoff before retrying
            const delay = retryDelay * Math.pow(2, attempt - 1);
            logger.log(`Waiting ${delay}ms before next attempt...`);
            await new Promise((resolve) => setTimeout(resolve, delay));
          }
        }

        throw new Error('Failed to connect to database after all retries');
      },
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
