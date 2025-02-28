import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { BaseService } from '../../common/services/base.service';
import { UsersQueryDto } from './dto/users-query.dto';

@Injectable()
export class UsersService extends BaseService<User> {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {
    super(usersRepository);
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const user = this.usersRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });

    return this.usersRepository.save(user);
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    if (updateUserDto.email) {
      const existingUser = await this.findByEmail(updateUserDto.email);
      if (existingUser && existingUser.id !== id) {
        throw new ConflictException('Email already exists');
      }
    }

    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    return super.update(id, updateUserDto);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async updateAccessToken(
    id: string,
    token: string | undefined,
  ): Promise<void> {
    await this.usersRepository.query(
      'UPDATE users SET access_token = ? WHERE id = ?',
      [token ?? null, id],
    );
  }

  async findAllPaginated(
    query: UsersQueryDto,
  ): Promise<{
    data: User[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  }> {
    const { page = 1, limit = 10, name, email, role } = query;
    const skip = (page - 1) * limit;

    const whereClause: any = {};
    if (name) {
      whereClause.name = Like(`%${name}%`);
    }
    if (email) {
      whereClause.email = Like(`%${email}%`);
    }
    if (role) {
      whereClause.role = role;
    }

    const [users, total] = await this.usersRepository.findAndCount({
      where: whereClause,
      skip,
      take: limit,
      order: { created_at: 'DESC' },
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data: users,
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }
}
