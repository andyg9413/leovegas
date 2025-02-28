import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../entities/user.entity';

export class UserResponseDto {
  @ApiProperty({ description: 'The unique identifier of the user' })
  id: string;

  @ApiProperty({ description: 'The name of the user' })
  name: string;

  @ApiProperty({ description: 'The email of the user' })
  email: string;

  @ApiProperty({ description: 'The role of the user', enum: UserRole })
  role: UserRole;

  @ApiProperty({ description: 'When the user was created' })
  created_at: Date;

  @ApiProperty({ description: 'When the user was last updated' })
  updated_at: Date;
}
