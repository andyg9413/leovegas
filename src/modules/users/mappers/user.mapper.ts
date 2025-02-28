import { Injectable } from '@nestjs/common';
import { User } from '../entities/user.entity';
import { UserResponseDto } from '../dto/user-response.dto';

@Injectable()
export class UserMapper {
  toResponseDto(user: User): UserResponseDto {
    const responseDto = new UserResponseDto();
    responseDto.id = user.id;
    responseDto.name = user.name;
    responseDto.email = user.email;
    responseDto.role = user.role;
    responseDto.created_at = user.created_at;
    responseDto.updated_at = user.updated_at;
    return responseDto;
  }

  toResponseDtoArray(users: User[]): UserResponseDto[] {
    return users.map((user) => this.toResponseDto(user));
  }
}
