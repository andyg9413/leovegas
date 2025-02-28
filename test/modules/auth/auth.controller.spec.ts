import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../../../src/modules/auth/auth.controller';
import { AuthService } from '../../../src/modules/auth/auth.service';
import { UserMapper } from '../../../src/modules/users/mappers/user.mapper';
import { User, UserRole } from '../../../src/modules/users/entities/user.entity';
import { LoginDto } from '../../../src/modules/auth/dto/login.dto';
import { UserResponseDto } from '../../../src/modules/users/dto/user-response.dto';
import { UsersService } from '../../../src/modules/users/users.service';
import { TokenValidationGuard } from '../../../src/modules/auth/guards/token-validation.guard';
import { JwtService } from '@nestjs/jwt';
import { BadRequestException } from '@nestjs/common';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;
  let userMapper: jest.Mocked<UserMapper>;

  const mockUser: User = {
    id: '1',
    name: 'Test User',
    email: 'test@example.com',
    password: 'hashedPassword',
    role: UserRole.USER,
    access_token: undefined,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockUserResponse: UserResponseDto = {
    id: mockUser.id,
    name: mockUser.name,
    email: mockUser.email,
    role: mockUser.role,
    created_at: mockUser.created_at,
    updated_at: mockUser.updated_at,
  };

  beforeEach(async () => {
    const mockAuthService = {
      login: jest.fn(),
      logout: jest.fn(),
    };

    const mockUserMapper = {
      toResponseDto: jest.fn(),
    };

    const mockUsersService = {
      findOne: jest.fn(),
      findByEmail: jest.fn(),
      updateAccessToken: jest.fn(),
    };

    const mockJwtService = {
      sign: jest.fn(),
      verify: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: UserMapper,
          useValue: mockUserMapper,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        TokenValidationGuard,
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
    userMapper = module.get(UserMapper);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should login user successfully', async () => {
      const mockAccessToken = 'mock.jwt.token';
      const mockLoginResponse = {
        access_token: mockAccessToken,
        user: mockUser,
      };

      authService.login.mockResolvedValue(mockLoginResponse);
      userMapper.toResponseDto.mockReturnValue(mockUserResponse);

      const result = await controller.login(loginDto);

      expect(result).toEqual({
        access_token: mockAccessToken,
        user: mockUserResponse,
      });
      expect(authService.login).toHaveBeenCalledWith(loginDto);
      expect(userMapper.toResponseDto).toHaveBeenCalledWith(mockUser);
    });

    it('should handle validation errors in login dto', async () => {
      const invalidLoginDto = {
        email: 'invalid-email',
        password: '123', // too short
      };

      authService.login.mockImplementation(() => {
        throw new BadRequestException('Validation failed');
      });

      await expect(controller.login(invalidLoginDto as LoginDto)).rejects.toThrow(BadRequestException);
      expect(authService.login).toHaveBeenCalledWith(invalidLoginDto);
    });

    it('should handle authentication errors', async () => {
      authService.login.mockRejectedValue(new Error('Authentication failed'));

      await expect(controller.login(loginDto)).rejects.toThrow('Authentication failed');
      expect(userMapper.toResponseDto).not.toHaveBeenCalled();
    });

    it('should handle mapping errors', async () => {
      const mockLoginResponse = {
        access_token: 'mock.jwt.token',
        user: mockUser,
      };

      authService.login.mockResolvedValue(mockLoginResponse);
      userMapper.toResponseDto.mockImplementation(() => {
        throw new Error('Mapping error');
      });

      await expect(controller.login(loginDto)).rejects.toThrow('Mapping error');
    });
  });

  describe('logout', () => {
    it('should logout user successfully', async () => {
      await controller.logout(mockUser);

      expect(authService.logout).toHaveBeenCalledWith(mockUser.id);
    });

    it('should handle errors during logout', async () => {
      authService.logout.mockRejectedValue(new Error('Logout failed'));

      await expect(controller.logout(mockUser)).rejects.toThrow('Logout failed');
    });
  });
}); 