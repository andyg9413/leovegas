import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class UserRepository extends Repository<User> {
  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>,
  ) {
    super(repository.target, repository.manager, repository.queryRunner);
  }

  async updateAccessToken(id: string, token: string | undefined): Promise<void> {
    await this.query(
      'UPDATE users SET access_token = ? WHERE id = ?',
      [token ?? null, id],
    );
  }
} 