import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../../../src/modules/users/users.service';
import { User, UserRole } from '../../../src/modules/users/entities/user.entity';

describe('UsersService', () => {
  let service: UsersService;
  let repository: Repository<User>;

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

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    query: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createUserDto = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      role: UserRole.USER,
    };

    it('should create a new user successfully', async () => {
      const hashedPassword = 'hashedPassword';
      jest.spyOn(bcrypt, 'hash').mockResolvedValue(hashedPassword as never);
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue({ ...createUserDto, password: hashedPassword });
      mockRepository.save.mockResolvedValue({ id: '1', ...createUserDto, password: hashedPassword });

      const result = await service.create(createUserDto);

      expect(result).toEqual(expect.objectContaining({ id: '1', ...createUserDto, password: "hashedPassword" }));
      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { email: createUserDto.email } });
      expect(bcrypt.hash).toHaveBeenCalledWith(createUserDto.password, 10);
      expect(mockRepository.create).toHaveBeenCalledWith({ ...createUserDto, password: hashedPassword });
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should throw ConflictException if email already exists', async () => {
      mockRepository.findOne.mockResolvedValue({ id: '1', ...createUserDto });

      await expect(service.create(createUserDto)).rejects.toThrow(ConflictException);
      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { email: createUserDto.email } });
      expect(mockRepository.create).not.toHaveBeenCalled();
      expect(mockRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('findAllPaginated', () => {
    const mockUsers = [
      { id: '1', name: 'User 1', email: 'user1@example.com', role: UserRole.USER },
      { id: '2', name: 'User 2', email: 'user2@example.com', role: UserRole.ADMIN },
    ];

    it('should return paginated users without filters', async () => {
      mockRepository.findAndCount.mockResolvedValue([mockUsers, 2]);

      const result = await service.findAllPaginated({ page: 1, limit: 10 });

      expect(result).toEqual({
        data: mockUsers,
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      });
      expect(mockRepository.findAndCount).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 10,
        order: { created_at: 'DESC' },
      });
    });

    it('should apply filters correctly', async () => {
      const filters = {
        page: 1,
        limit: 10,
        name: 'User',
        email: '@example.com',
        role: UserRole.ADMIN,
      };

      mockRepository.findAndCount.mockResolvedValue([[mockUsers[1]], 1]);

      const result = await service.findAllPaginated(filters);

      expect(result.data).toEqual([mockUsers[1]]);
      expect(mockRepository.findAndCount).toHaveBeenCalledWith({
        where: {
          name: expect.any(Object),
          email: expect.any(Object),
          role: UserRole.ADMIN,
        },
        skip: 0,
        take: 10,
        order: { created_at: 'DESC' },
      });
    });

    it('should handle empty result', async () => {
      mockRepository.findAndCount.mockResolvedValue([[], 0]);

      const result = await service.findAllPaginated({ page: 1, limit: 10 });

      expect(result).toEqual({
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      });
    });

    it('should calculate pagination values correctly for multiple pages', async () => {
      const mockManyUsers = Array(15).fill(null).map((_, i) => ({
        id: String(i + 1),
        name: `User ${i + 1}`,
        email: `user${i + 1}@example.com`,
        role: UserRole.USER,
      }));

      mockRepository.findAndCount.mockResolvedValue([mockManyUsers.slice(0, 10), 15]);

      const result = await service.findAllPaginated({ page: 1, limit: 10 });

      expect(result).toEqual({
        data: mockManyUsers.slice(0, 10),
        total: 15,
        page: 1,
        limit: 10,
        totalPages: 2,
        hasNextPage: true,
        hasPreviousPage: false,
      });
    });

    it('should handle last page correctly', async () => {
      const mockManyUsers = Array(15).fill(null).map((_, i) => ({
        id: String(i + 1),
        name: `User ${i + 1}`,
        email: `user${i + 1}@example.com`,
        role: UserRole.USER,
      }));

      mockRepository.findAndCount.mockResolvedValue([mockManyUsers.slice(10), 15]);

      const result = await service.findAllPaginated({ page: 2, limit: 10 });

      expect(result).toEqual({
        data: mockManyUsers.slice(10),
        total: 15,
        page: 2,
        limit: 10,
        totalPages: 2,
        hasNextPage: false,
        hasPreviousPage: true,
      });
    });
  });

  describe('update', () => {
    const userId = '1';
    const updateUserDto = {
      name: 'Updated Name',
      email: 'updated@example.com',
      password: 'newpassword',
    };

    it('should update user successfully', async () => {
      const hashedPassword = 'hashedNewPassword';
      const updatedUser = {
        id: userId,
        name: updateUserDto.name,
        email: updateUserDto.email,
        password: hashedPassword,
        role: UserRole.USER,
        access_token: undefined,
        created_at: mockUser.created_at,
        updated_at: mockUser.updated_at,
      };
      
      jest.spyOn(bcrypt, 'hash').mockResolvedValue(hashedPassword as never);
      mockRepository.findOne
        .mockResolvedValueOnce({ ...mockUser })
        .mockResolvedValueOnce({ ...mockUser })
        .mockResolvedValueOnce({ ...updatedUser });
      mockRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.update(userId, updateUserDto);

      expect(result).toEqual(updatedUser);
      expect(bcrypt.hash).toHaveBeenCalledWith('newpassword', 10);
      expect(mockRepository.update).toHaveBeenCalledWith(userId, {
        ...updateUserDto,
        password: hashedPassword,
      });
      expect(mockRepository.findOne).toHaveBeenCalledTimes(3);
    });

    it('should update user without password', async () => {
      const updateDto = { name: 'Updated Name' };
      const updatedUser = {
        ...mockUser,
        name: updateDto.name,
      };

      mockRepository.findOne
        .mockResolvedValueOnce({ ...mockUser })
        .mockResolvedValueOnce({ ...updatedUser });
      mockRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.update('1', updateDto);

      expect(result).toEqual(updatedUser);
      expect(bcrypt.hash).not.toHaveBeenCalled();
      expect(mockRepository.findOne).toHaveBeenCalledTimes(2);
    });

    it('should throw NotFoundException when user to update is not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.update('999', { name: 'New Name' })).rejects.toThrow(NotFoundException);
      expect(mockRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('updateAccessToken', () => {
    it('should update access token successfully', async () => {
      const userId = '1';
      const token = 'new-token';

      await service.updateAccessToken(userId, token);

      expect(mockRepository.query).toHaveBeenCalledWith(
        'UPDATE users SET access_token = ? WHERE id = ?',
        [token, userId]
      );
    });

    it('should set access token to null when token is undefined', async () => {
      const userId = '1';

      await service.updateAccessToken(userId, undefined);

      expect(mockRepository.query).toHaveBeenCalledWith(
        'UPDATE users SET access_token = ? WHERE id = ?',
        [null, userId]
      );
    });
  });

  describe('findByEmail', () => {
    it('should find a user by email', async () => {
      const email = 'test@example.com';
      const user = { ...mockUser };
      mockRepository.findOne.mockReset().mockResolvedValue(user);

      const result = await service.findByEmail(email);

      expect(result).toEqual(user);
      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { email } });
    });

    it('should return null when user not found', async () => {
      mockRepository.findOne.mockReset().mockResolvedValue(null);

      const result = await service.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('findOne', () => {
    it('should find a user by id', async () => {
      mockRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findOne('1');

      expect(result).toEqual(mockUser);
      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
    });

    it('should throw NotFoundException when user not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove user successfully', async () => {
      mockRepository.findOne.mockResolvedValue(mockUser);
      mockRepository.delete.mockResolvedValue({ affected: 1 });

      await service.remove('1');

      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(mockRepository.delete).toHaveBeenCalledWith('1');
    });

    it('should throw NotFoundException when user to delete is not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('999')).rejects.toThrow(NotFoundException);
      expect(mockRepository.delete).not.toHaveBeenCalled();
    });
  });
}); 