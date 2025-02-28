import { Repository, DeepPartial } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { BaseEntity } from '../entities/base.entity';

export abstract class BaseService<T extends BaseEntity> {
  constructor(protected readonly repository: Repository<T>) {}

  async findAll(): Promise<T[]> {
    return this.repository.find();
  }

  async findOne(id: string): Promise<T> {
    const entity = await this.repository.findOne({ where: { id } as any });
    if (!entity) {
      throw new NotFoundException(`Entity with ID "${id}" not found`);
    }
    return entity;
  }

  async create(createDto: DeepPartial<T>): Promise<T> {
    const entity = this.repository.create(createDto);
    return this.repository.save(entity);
  }

  async update(id: string, updateDto: DeepPartial<T>): Promise<T> {
    await this.findOne(id);
    await this.repository.update(id, updateDto as any);
    const updated = await this.repository.findOne({ where: { id } as any });
    if (!updated) {
      throw new NotFoundException(`Entity with ID "${id}" not found after update`);
    }
    return updated;
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.repository.delete(id);
  }
} 