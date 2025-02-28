import { ConfigModule } from '@nestjs/config';
import configuration from '../src/config/configuration';

// Load environment configuration for tests
void ConfigModule.forRoot({
  load: [configuration],
  isGlobal: true,
});

// Mock bcrypt for all tests
jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

// Mock JWT service for all tests
jest.mock('@nestjs/jwt', () => ({
  JwtService: jest.fn().mockImplementation(() => ({
    sign: jest.fn(),
    verify: jest.fn(),
  })),
}));
