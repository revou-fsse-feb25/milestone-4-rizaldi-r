import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Type,
  UnauthorizedException,
} from '@nestjs/common';
import { ModuleRef, Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import {
  ID_SOURCE_KEY,
  IS_ADMIN_BYPASS_ENABLED_KEY,
  IdSourceType,
  OwnableResource,
  OwnableService,
  OWNER_SERVICE_KEY,
} from '../types/resource-owner.type';
import { PayloadDto } from '../res/payload.dto';
import { RequestItf } from '../types/request.type';

@Injectable()
export class ResourceOwnershipGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private moduleRef: ModuleRef,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const request = ctx.switchToHttp().getRequest<RequestItf>();
    if (!request.user || !request.user.id)
      throw new UnauthorizedException(
        'User ID not found in request.user. Ensure JWT payload includes userId.',
      );
    const user: PayloadDto = request.user;

    // get metadata that allow bypass
    const idSourceConfig = this.reflector.getAllAndOverride<{
      source: IdSourceType;
      queryParamName?: string;
    }>(ID_SOURCE_KEY, [ctx.getHandler(), ctx.getClass()]);
    const isAllowAdminBypass = this.reflector.getAllAndOverride<boolean>(
      IS_ADMIN_BYPASS_ENABLED_KEY,
      [ctx.getHandler(), ctx.getClass()],
    );

    // allow bypass
    if (
      (isAllowAdminBypass && user.userRole === UserRole.ADMIN) ||
      !idSourceConfig
    ) {
      return true;
    }

    // Get individual metadata from decorators
    const serviceType = this.reflector.getAllAndOverride<Type<OwnableService>>(
      OWNER_SERVICE_KEY,
      [ctx.getHandler(), ctx.getClass()],
    );
    if (!serviceType) {
      throw new Error('OwnerService decorator not applied to this route.');
    }

    // Extract Resource ID
    const { source: idSource, queryParamName } = idSourceConfig;
    let resourceId: number;
    if (idSource === 'param') {
      // use params
      const paramId = parseInt(request.params.id, 10);
      if (isNaN(paramId)) {
        throw new BadRequestException(
          'Invalid resource ID format from URL parameter.',
        );
      }
      resourceId = paramId;
    } else if (idSource === 'query') {
      // use query
      if (!queryParamName) {
        throw new Error(
          'IdSource configured as "query" but no queryParamName provided.',
        );
      }
      const queryId = parseInt(request.query[queryParamName] as string, 10);
      // allow bypass if query not valid
      if (isNaN(queryId)) {
        return true;
      }
      resourceId = queryId;
    } else {
      // use body
      if (!queryParamName) {
        throw new Error(
          'IdSource configured as "body" but no queryParamName provided.',
        );
      }
      const bodyParamId = parseInt(
        (request.body as Record<string, any>)[queryParamName] as string,
        10,
      );
      if (isNaN(bodyParamId)) {
        throw new BadRequestException(
          'Invalid resource ID format from body parameter.',
        );
      }
      resourceId = bodyParamId;
    }

    // Get the Service
    let resourceService: OwnableService;
    try {
      resourceService = this.moduleRef.get(serviceType, { strict: false });
    } catch (error) {
      console.error(`Failed to resolve service ${serviceType.name}:`, error);
      throw new Error(
        `Internal server error: Could not resolve service for resource ownership check.`,
      );
    }

    // Ensure the service has a findById method
    if (typeof resourceService.findById !== 'function') {
      throw new Error(
        `Service ${serviceType.name} must have a 'findById' method.`,
      );
    }

    // Fetch the resource
    const resource: OwnableResource =
      await resourceService.findById(resourceId);

    // Check Ownership
    if (user.id === resource.userId) {
      return true;
    }

    // If not owner and not an admin, throw forbidden
    throw new ForbiddenException(
      `You do not have permission to access this resource.`,
    );
  }
}
