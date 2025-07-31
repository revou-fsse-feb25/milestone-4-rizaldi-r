import { ForbiddenException } from '@nestjs/common';
import { User, UserRole } from '@prisma/client';

interface OwnableResource {
  userId?: number;
}

/**
 * Checks if a user has access to a specific resource (account, transaction, etc.).
 * Access is granted if the user is the resource's owner.
 * Optionally, access can also be granted if the user has the 'ADMIN' role.
 * Throws a ForbiddenException if access is denied.
 *
 * @template TResource The type of the resource being checked, must extend OwnableResource.
 * @param resource The resource object to check access for (e.g., Account, Transaction).
 * @param user The authenticated user object.
 * @param message Optional custom forbidden message.
 * @param isAdminAllowed Optional boolean to control if ADMIN role can bypass the check. Defaults to true.
 */
export function checkResourceAccess<TResource extends OwnableResource>(
  resource: TResource,
  user: User,
  isAdminAllowed: boolean = true,
  message: string = 'You do not have permission to access this resource.',
): void {
  const resourceOwnerId = resource.userId;

  // check to ensure the owner ID is a number
  if (typeof resourceOwnerId !== 'number')
    throw new Error(`Owner user ID on resource is not a number`);

  // throw error if the user is not the resource owner
  if (
    resourceOwnerId !== user.id &&
    !(isAdminAllowed && user.userRole === UserRole.ADMIN)
  ) {
    throw new ForbiddenException(message);
  }
}
