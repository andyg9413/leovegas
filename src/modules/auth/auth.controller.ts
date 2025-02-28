import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { User } from '../users/entities/user.entity';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { TokenValidationGuard } from './guards/token-validation.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { UserMapper } from '../users/mappers/user.mapper';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userMapper: UserMapper,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User logged in successfully',
    type: AuthResponseDto,
  })
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    const { access_token, user } = await this.authService.login(loginDto);
    return {
      access_token,
      user: this.userMapper.toResponseDto(user),
    };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard, TokenValidationGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'User logged out successfully',
  })
  @ApiBearerAuth()
  async logout(@CurrentUser() user: User) {
    await this.authService.logout(user.id);
  }
}
