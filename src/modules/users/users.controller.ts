import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ForbiddenException,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiExtraModels,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { User, UserRole } from './entities/user.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TokenValidationGuard } from '../auth/guards/token-validation.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserMapper } from './mappers/user.mapper';
import { UsersQueryDto } from './dto/users-query.dto';
import { PaginatedUsersResponseDto } from './dto/paginated-users-response.dto';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard, TokenValidationGuard, RolesGuard)
@ApiBearerAuth()
@ApiExtraModels(UsersQueryDto)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly userMapper: UserMapper,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({
    status: 201,
    description: 'The user has been successfully created',
    type: UserResponseDto,
  })
  @Roles(UserRole.ADMIN)
  async create(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    const user = await this.usersService.create(createUserDto);
    return this.userMapper.toResponseDto(user);
  }

  @Get()
  @ApiOperation({ summary: 'Get all users with pagination and filters' })
  @ApiResponse({
    status: 200,
    description: 'The paginated list of users has been successfully retrieved',
    type: PaginatedUsersResponseDto,
  })
  @ApiExtraModels(UsersQueryDto)
  @Roles(UserRole.ADMIN)
  async findAll(
    @Query() query: UsersQueryDto,
  ): Promise<PaginatedUsersResponseDto> {
    const paginatedResult = await this.usersService.findAllPaginated(query);
    const mappedUsers = this.userMapper.toResponseDtoArray(
      paginatedResult.data,
    );
    return { ...paginatedResult, data: mappedUsers };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a user by id' })
  @ApiResponse({
    status: 200,
    description: 'The user has been successfully retrieved',
    type: UserResponseDto,
  })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() currentUser: User,
  ): Promise<UserResponseDto> {
    if (currentUser.role !== UserRole.ADMIN && currentUser.id !== id) {
      throw new ForbiddenException('Only admins can access other user details');
    }
    const user = await this.usersService.findOne(id);
    return this.userMapper.toResponseDto(user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a user' })
  @ApiResponse({
    status: 200,
    description: 'The user has been successfully updated',
    type: UserResponseDto,
  })
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() currentUser: User,
  ): Promise<UserResponseDto> {
    if (currentUser.role !== UserRole.ADMIN && currentUser.id !== id) {
      throw new ForbiddenException('Only admins can update other user details');
    }

    if (currentUser.role !== UserRole.ADMIN && updateUserDto.role) {
      throw new ForbiddenException('Only admins can update user roles');
    }

    // Get the user being updated
    const targetUser = await this.usersService.findOne(id);

    // Check if trying to demote an admin
    if (
      targetUser.role === UserRole.ADMIN &&
      updateUserDto.role === UserRole.USER
    ) {
      throw new ForbiddenException(
        'Cannot demote an admin user to regular user',
      );
    }

    const updatedUser = await this.usersService.update(id, updateUserDto);
    return this.userMapper.toResponseDto(updatedUser);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a user' })
  @ApiResponse({
    status: 200,
    description: 'The user has been successfully deleted',
  })
  @Roles(UserRole.ADMIN)
  async remove(
    @Param('id') id: string,
    @CurrentUser() currentUser: User,
  ): Promise<void> {
    if (currentUser.id === id) {
      throw new ForbiddenException('Cannot delete your own account');
    }

    // Get the user being deleted
    const targetUser = await this.usersService.findOne(id);

    // Check if trying to delete an admin
    if (targetUser.role === UserRole.ADMIN) {
      throw new ForbiddenException('Cannot delete an admin user');
    }

    return this.usersService.remove(id);
  }
}
