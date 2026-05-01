import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { Roles } from 'src/decorators/roles.decorator';
import { UserService } from 'src/user/user.service';

@Injectable()
export class TokenGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly userRepository: UserService,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const roles = await this.reflector.getAllAndOverride(Roles, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!roles) {
      return true;
    }

    try {
      const request = context.switchToHttp().getRequest();
      const token = this.extractToken(request);

      if (!token) {
        throw new UnauthorizedException();
      }

      const payload = await this.jwtService.verifyAsync(token);

      const user = await this.userRepository.findOne(payload.sub);

      if (!user || user.isActive === false) {
        throw new UnauthorizedException();
      }

      if (payload.tokenType !== 'access') {
        throw new UnauthorizedException();
      }

      if ((payload.tokenVersion ?? 0) !== (user.tokenVersion ?? 0)) {
        throw new UnauthorizedException();
      }

      request.user = user;

      const rolePass = user.role.some((role) => roles.includes(role));

      if (!rolePass) {
        return false;
      }
    } catch {
      throw new UnauthorizedException();
    }

    return true;
  }

  private extractToken(request: Request) {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.split(' ')[1];
  }
}
