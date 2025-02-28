import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from '../../../src/modules/auth/auth.service';
import { UsersService } from '../../../src/modules/users/users.service';
import {
  User,
  UserRole,
} from '../../../src/modules/users/entities/user.entity';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;

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

  const mockJwtToken = 'mock.jwt.token';

  beforeEach(async () => {
    const mockUsersService = {
      findByEmail: jest.fn(),
      findOne: jest.fn(),
      updateAccessToken: jest.fn(),
    };

    const mockJwtService = {
      sign: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateUser', () => {
    it('should validate user with correct credentials', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser(
        'test@example.com',
        'password123',
      );

      expect(result).toEqual(mockUser);
      expect(usersService.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'password123',
        mockUser.password,
      );
    });

    it('should throw UnauthorizedException when user not found', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(
        service.validateUser('nonexistent@example.com', 'password123'),
      ).rejects.toThrow(UnauthorizedException);
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when password is invalid', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.validateUser('test@example.com', 'wrongpassword'),
      ).rejects.toThrow(UnauthorizedException);
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'wrongpassword',
        mockUser.password,
      );
    });

    it('should handle bcrypt errors', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockRejectedValue(
        new Error('Bcrypt error'),
      );

      await expect(
        service.validateUser('test@example.com', 'password123'),
      ).rejects.toThrow('Bcrypt error');
    });
  });

  describe('login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should login user successfully', async () => {
      const updatedUser = { ...mockUser, access_token: mockJwtToken };

      usersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jwtService.sign.mockReturnValue(mockJwtToken);
      usersService.findOne.mockResolvedValue(updatedUser);

      const result = await service.login(loginDto);

      expect(result).toEqual({
        access_token: mockJwtToken,
        user: updatedUser,
      });
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
      });
      expect(usersService.updateAccessToken).toHaveBeenCalledWith(
        mockUser.id,
        mockJwtToken,
      );
      expect(usersService.findOne).toHaveBeenCalledWith(mockUser.id);
    });

    it('should throw UnauthorizedException when validation fails', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(jwtService.sign).not.toHaveBeenCalled();
      expect(usersService.updateAccessToken).not.toHaveBeenCalled();
    });

    it('should handle token update errors', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jwtService.sign.mockReturnValue(mockJwtToken);
      usersService.updateAccessToken.mockRejectedValue(
        new Error('Update failed'),
      );

      await expect(service.login(loginDto)).rejects.toThrow('Update failed');
      expect(jwtService.sign).toHaveBeenCalled();
    });

    it('should handle user fetch errors after token update', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jwtService.sign.mockReturnValue(mockJwtToken);
      usersService.updateAccessToken.mockResolvedValue(undefined);
      usersService.findOne.mockRejectedValue(new Error('Fetch failed'));

      await expect(service.login(loginDto)).rejects.toThrow('Fetch failed');
      expect(usersService.updateAccessToken).toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('should logout user successfully', async () => {
      await service.logout(mockUser.id);

      expect(usersService.updateAccessToken).toHaveBeenCalledWith(
        mockUser.id,
        undefined,
      );
    });

    it('should handle errors during logout', async () => {
      usersService.updateAccessToken.mockRejectedValue(
        new Error('Logout failed'),
      );

      await expect(service.logout(mockUser.id)).rejects.toThrow(
        'Logout failed',
      );
    });
  });
});
