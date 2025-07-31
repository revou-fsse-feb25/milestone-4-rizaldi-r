import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RequestItf } from '../types/request.type';

/**
 * Custom decorator to extract the current user from the request object.
 * This decorator should be used in conjunction with the JwtAuthGuard.
 *
 * Example usage:
 * ```
 * @Get('profile')
 * @UseGuards(JwtAuthGuard)
 * getProfile(@CurrentUser() user: User) {
 *   return user;
 * }
 * ```
 */
export const currentUserFactory = (data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<RequestItf>();
  return request.user;
};

export const CurrentUser = createParamDecorator(currentUserFactory);
