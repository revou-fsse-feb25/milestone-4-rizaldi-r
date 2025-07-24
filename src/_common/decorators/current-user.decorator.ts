import { createParamDecorator, ExecutionContext } from '@nestjs/common';

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
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx
      .switchToHttp()
      .getRequest<Request & { user?: object }>().user;
    return request;
  },
);
