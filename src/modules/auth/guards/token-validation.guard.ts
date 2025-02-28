import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../../users/users.service';

@Injectable()
export class TokenValidationGuard implements CanActivate {
  constructor(private readonly usersService: UsersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('No authorization header');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    const user = request.user;
    if (!user) {
      throw new UnauthorizedException('User not found in request');
    }

    const dbUser = await this.usersService.findOne(user.id);
    if (!dbUser) {
      throw new UnauthorizedException('User not found in database');
    }

    if (!dbUser.access_token) {
      throw new UnauthorizedException('User has been logged out');
    }

    if (dbUser.access_token !== token) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    request.user = dbUser;
    return true;
  }
} 