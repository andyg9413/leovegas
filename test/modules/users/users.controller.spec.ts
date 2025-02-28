import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { UsersController } from '../../../src/modules/users/users.controller';
import { UsersService } from '../../../src/modules/users/users.service';
import { UserMapper } from '../../../src/modules/users/mappers/user.mapper';
import {
  User,
  UserRole,
} from '../../../src/modules/users/entities/user.entity';
import { CreateUserDto } from '../../../src/modules/users/dto/create-user.dto';
import { UpdateUserDto } from '../../../src/modules/users/dto/update-user.dto';
import { UsersQueryDto } from '../../../src/modules/users/dto/users-query.dto';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;
  let mapper: UserMapper;

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

  const mockAdminUser: User = {
    ...mockUser,
    id: '2',
    email: 'admin@example.com',
    role: UserRole.ADMIN,
  };

  const mockUsersService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    findAllPaginated: jest.fn(),
  };

  const mockUserMapper = {
    toResponseDto: jest.fn(),
    toResponseDtoArray: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: UserMapper,
          useValue: mockUserMapper,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
    mapper = module.get<UserMapper>(UserMapper);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createUserDto: CreateUserDto = {
      name: 'New User',
      email: 'new@example.com',
      password: 'password123',
      role: UserRole.USER,
    };

    it('should create a new user successfully', async () => {
      const createdUser = { ...mockUser, ...createUserDto };
      const mappedUser = { ...createdUser, password: undefined };

      mockUsersService.create.mockResolvedValue(createdUser);
      mockUserMapper.toResponseDto.mockReturnValue(mappedUser);

      const result = await controller.create(createUserDto);

      expect(result).toEqual(mappedUser);
      expect(mockUsersService.create).toHaveBeenCalledWith(createUserDto);
      expect(mockUserMapper.toResponseDto).toHaveBeenCalledWith(createdUser);
    });
  });

  describe('findAll', () => {
    const query: UsersQueryDto = { page: 1, limit: 10 };
    const mockPaginatedResult = {
      data: [mockUser, mockAdminUser],
      total: 2,
      page: 1,
      limit: 10,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    };

    it('should return paginated users', async () => {
      const mappedUsers = [
        { ...mockUser, password: undefined },
        { ...mockAdminUser, password: undefined },
      ];

      mockUsersService.findAllPaginated.mockResolvedValue(mockPaginatedResult);
      mockUserMapper.toResponseDtoArray.mockReturnValue(mappedUsers);

      const result = await controller.findAll(query);

      expect(result).toEqual({
        ...mockPaginatedResult,
        data: mappedUsers,
      });
      expect(mockUsersService.findAllPaginated).toHaveBeenCalledWith(query);
      expect(mockUserMapper.toResponseDtoArray).toHaveBeenCalledWith(
        mockPaginatedResult.data,
      );
    });

    it('should apply all filters correctly', async () => {
      const query = {
        page: 1,
        limit: 10,
        name: 'Test',
        email: '@example.com',
        role: UserRole.USER,
      };

      const mockPaginatedResult = {
        data: [mockUser],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      };

      const mappedUsers = [{ ...mockUser, password: undefined }];

      mockUsersService.findAllPaginated.mockResolvedValue(mockPaginatedResult);
      mockUserMapper.toResponseDtoArray.mockReturnValue(mappedUsers);

      const result = await controller.findAll(query);

      expect(result).toEqual({
        ...mockPaginatedResult,
        data: mappedUsers,
      });
      expect(mockUsersService.findAllPaginated).toHaveBeenCalledWith(query);
    });
  });

  describe('findOne', () => {
    it('should return a user when admin requests', async () => {
      const mappedUser = { ...mockUser, password: undefined };

      mockUsersService.findOne.mockResolvedValue(mockUser);
      mockUserMapper.toResponseDto.mockReturnValue(mappedUser);

      const result = await controller.findOne(mockUser.id, mockAdminUser);

      expect(result).toEqual(mappedUser);
      expect(mockUsersService.findOne).toHaveBeenCalledWith(mockUser.id);
      expect(mockUserMapper.toResponseDto).toHaveBeenCalledWith(mockUser);
    });

    it('should return a user when requesting own details', async () => {
      const mappedUser = { ...mockUser, password: undefined };

      mockUsersService.findOne.mockResolvedValue(mockUser);
      mockUserMapper.toResponseDto.mockReturnValue(mappedUser);

      const result = await controller.findOne(mockUser.id, mockUser);

      expect(result).toEqual(mappedUser);
    });

    it('should throw ForbiddenException when non-admin requests other user details', async () => {
      const otherUserId = '3';

      await expect(controller.findOne(otherUserId, mockUser)).rejects.toThrow(
        ForbiddenException,
      );
      expect(mockUsersService.findOne).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    const updateUserDto: UpdateUserDto = {
      name: 'Updated Name',
    };

    it('should update user when admin requests', async () => {
      const updatedUser = { ...mockUser, ...updateUserDto };
      const mappedUser = { ...updatedUser, password: undefined };

      mockUsersService.findOne.mockResolvedValue(mockUser);
      mockUsersService.update.mockResolvedValue(updatedUser);
      mockUserMapper.toResponseDto.mockReturnValue(mappedUser);

      const result = await controller.update(
        mockUser.id,
        updateUserDto,
        mockAdminUser,
      );

      expect(result).toEqual(mappedUser);
      expect(mockUsersService.update).toHaveBeenCalledWith(
        mockUser.id,
        updateUserDto,
      );
    });

    it('should update own user details', async () => {
      const updatedUser = { ...mockUser, ...updateUserDto };
      const mappedUser = { ...updatedUser, password: undefined };

      mockUsersService.findOne.mockResolvedValue(mockUser);
      mockUsersService.update.mockResolvedValue(updatedUser);
      mockUserMapper.toResponseDto.mockReturnValue(mappedUser);

      const result = await controller.update(
        mockUser.id,
        updateUserDto,
        mockUser,
      );

      expect(result).toEqual(mappedUser);
    });

    it('should throw ForbiddenException when non-admin updates other user', async () => {
      const otherUserId = '3';

      await expect(
        controller.update(otherUserId, updateUserDto, mockUser),
      ).rejects.toThrow(ForbiddenException);
      expect(mockUsersService.update).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException when non-admin tries to update role', async () => {
      const updateWithRole = { ...updateUserDto, role: UserRole.ADMIN };

      await expect(
        controller.update(mockUser.id, updateWithRole, mockUser),
      ).rejects.toThrow(ForbiddenException);
      expect(mockUsersService.update).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException when trying to demote admin', async () => {
      const updateWithRole = { role: UserRole.USER };

      mockUsersService.findOne.mockResolvedValue(mockAdminUser);

      await expect(
        controller.update(mockAdminUser.id, updateWithRole, mockAdminUser),
      ).rejects.toThrow(ForbiddenException);
      expect(mockUsersService.update).not.toHaveBeenCalled();
    });

    it('should handle partial updates', async () => {
      const partialUpdate = { name: 'New Name' };
      const updatedUser = { ...mockUser, ...partialUpdate };
      const mappedUser = { ...updatedUser, password: undefined };

      mockUsersService.findOne.mockResolvedValue(mockUser);
      mockUsersService.update.mockResolvedValue(updatedUser);
      mockUserMapper.toResponseDto.mockReturnValue(mappedUser);

      const result = await controller.update(
        mockUser.id,
        partialUpdate,
        mockUser,
      );

      expect(result).toEqual(mappedUser);
      expect(mockUsersService.update).toHaveBeenCalledWith(
        mockUser.id,
        partialUpdate,
      );
    });

    it('should handle password updates', async () => {
      const updateWithPassword = { password: 'newpassword123' };
      const updatedUser = { ...mockUser, password: 'hashedNewPassword' };
      const mappedUser = { ...updatedUser, password: undefined };

      mockUsersService.findOne.mockResolvedValue(mockUser);
      mockUsersService.update.mockResolvedValue(updatedUser);
      mockUserMapper.toResponseDto.mockReturnValue(mappedUser);

      const result = await controller.update(
        mockUser.id,
        updateWithPassword,
        mockUser,
      );

      expect(result).toEqual(mappedUser);
      expect(mockUsersService.update).toHaveBeenCalledWith(
        mockUser.id,
        updateWithPassword,
      );
    });

    it('should allow admin to update user role', async () => {
      const updateWithRole = { role: UserRole.ADMIN };
      const updatedUser = { ...mockUser, ...updateWithRole };
      const mappedUser = { ...updatedUser, password: undefined };

      mockUsersService.findOne.mockResolvedValue(mockUser);
      mockUsersService.update.mockResolvedValue(updatedUser);
      mockUserMapper.toResponseDto.mockReturnValue(mappedUser);

      const result = await controller.update(
        mockUser.id,
        updateWithRole,
        mockAdminUser,
      );

      expect(result).toEqual(mappedUser);
      expect(mockUsersService.update).toHaveBeenCalledWith(
        mockUser.id,
        updateWithRole,
      );
    });
  });

  describe('remove', () => {
    it('should remove user when admin requests', async () => {
      mockUsersService.findOne.mockResolvedValue(mockUser);
      mockUsersService.remove.mockResolvedValue(undefined);

      await controller.remove(mockUser.id, mockAdminUser);

      expect(mockUsersService.remove).toHaveBeenCalledWith(mockUser.id);
    });

    it('should throw ForbiddenException when trying to delete own account', async () => {
      await expect(
        controller.remove(mockAdminUser.id, mockAdminUser),
      ).rejects.toThrow(ForbiddenException);
      expect(mockUsersService.remove).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException when trying to delete admin user', async () => {
      mockUsersService.findOne.mockResolvedValue(mockAdminUser);

      await expect(
        controller.remove(mockAdminUser.id, mockAdminUser),
      ).rejects.toThrow(ForbiddenException);
      expect(mockUsersService.remove).not.toHaveBeenCalled();
    });

    it('should handle non-existent user deletion', async () => {
      mockUsersService.findOne.mockResolvedValue(null);

      await expect(
        controller.remove('nonexistent-id', mockAdminUser),
      ).rejects.toThrow();
      expect(mockUsersService.remove).not.toHaveBeenCalled();
    });

    it('should handle database errors during deletion', async () => {
      mockUsersService.findOne.mockResolvedValue(mockUser);
      mockUsersService.remove.mockRejectedValue(new Error('Database error'));

      await expect(
        controller.remove(mockUser.id, mockAdminUser),
      ).rejects.toThrow();
    });
  });
});
