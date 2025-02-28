import { Test, TestingModule } from '@nestjs/testing';
import { UserMapper } from '../../../../src/modules/users/mappers/user.mapper';
import { User, UserRole } from '../../../../src/modules/users/entities/user.entity';

describe('UserMapper', () => {
  let mapper: UserMapper;

  const mockUser: User = {
    id: '1',
    name: 'Test User',
    email: 'test@example.com',
    password: 'hashedPassword',
    role: UserRole.USER,
    access_token: undefined,
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserMapper],
    }).compile();

    mapper = module.get<UserMapper>(UserMapper);
  });

  describe('toResponseDto', () => {
    it('should map User entity to UserResponseDto', () => {
      const result = mapper.toResponseDto(mockUser);

      expect(result).toEqual({
        id: mockUser.id,
        name: mockUser.name,
        email: mockUser.email,
        role: mockUser.role,
        created_at: mockUser.created_at,
        updated_at: mockUser.updated_at,
      });

      // Ensure sensitive fields are not included
      expect(result).not.toHaveProperty('password');
      expect(result).not.toHaveProperty('access_token');
    });

    it('should handle null dates', () => {
      const userWithNullDates = {
        ...mockUser,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const result = mapper.toResponseDto(userWithNullDates);

      expect(result.created_at).toBeDefined();
      expect(result.updated_at).toBeDefined();
    });

    it('should handle all user roles', () => {
      const adminUser = { ...mockUser, role: UserRole.ADMIN };
      const result = mapper.toResponseDto(adminUser);

      expect(result.role).toBe(UserRole.ADMIN);
    });

    it('should handle all required fields', () => {
      const minimalUser: User = {
        id: '1',
        name: 'Minimal User',
        email: 'minimal@example.com',
        password: 'password',
        role: UserRole.USER,
        access_token: undefined,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const result = mapper.toResponseDto(minimalUser);

      expect(result.id).toBe(minimalUser.id);
      expect(result.name).toBe(minimalUser.name);
      expect(result.email).toBe(minimalUser.email);
      expect(result.role).toBe(minimalUser.role);
    });

    it('should handle access_token field', () => {
      const userWithToken = { ...mockUser, access_token: 'some-token' };
      const result = mapper.toResponseDto(userWithToken);

      expect(result).not.toHaveProperty('access_token');
    });
  });

  describe('toResponseDtoArray', () => {
    it('should map array of User entities to UserResponseDto array', () => {
      const mockUsers = [
        mockUser,
        {
          ...mockUser,
          id: '2',
          email: 'test2@example.com',
          role: UserRole.ADMIN,
        },
      ];

      const result = mapper.toResponseDtoArray(mockUsers);

      expect(result).toHaveLength(2);
      result.forEach((dto, index) => {
        expect(dto).toEqual({
          id: mockUsers[index].id,
          name: mockUsers[index].name,
          email: mockUsers[index].email,
          role: mockUsers[index].role,
          created_at: mockUsers[index].created_at,
          updated_at: mockUsers[index].updated_at,
        });
        expect(dto).not.toHaveProperty('password');
        expect(dto).not.toHaveProperty('access_token');
      });
    });

    it('should return empty array when input is empty', () => {
      const result = mapper.toResponseDtoArray([]);
      expect(result).toEqual([]);
    });

    it('should preserve order of users', () => {
      const mockUsers = [
        { ...mockUser, id: '1', email: 'user1@example.com' },
        { ...mockUser, id: '2', email: 'user2@example.com' },
        { ...mockUser, id: '3', email: 'user3@example.com' },
      ];

      const result = mapper.toResponseDtoArray(mockUsers);

      expect(result.map(user => user.id)).toEqual(['1', '2', '3']);
      expect(result.map(user => user.email)).toEqual([
        'user1@example.com',
        'user2@example.com',
        'user3@example.com',
      ]);
    });

    it('should handle array with null values', () => {
      const mockUsers = [mockUser, null, mockUser];

      expect(() => mapper.toResponseDtoArray(mockUsers as User[])).toThrow();
    });
  });
}); 