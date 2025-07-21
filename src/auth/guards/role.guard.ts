import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { IncomingHttpHeaders } from 'http';

interface JwtPayload {
  userRole: string;
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private jwtService: JwtService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    // get role from metadata
    const requiredRoles = this.reflector.get<string[]>(
      'roles',
      context.getHandler(),
    );
    if (!requiredRoles) {
      return true;
    }

    // get the authorization in req header
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = (request.headers as unknown as IncomingHttpHeaders)
      .authorization;
    if (!authHeader) return false;
    const token = authHeader.split(' ')[1];

    // decode the token from the header and compare it with the metadata
    try {
      const decoded: JwtPayload = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET,
      });
      return requiredRoles.includes(decoded.userRole);
    } catch {
      return false;
    }
  }
}
