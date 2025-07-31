import { SetMetadata, Type } from '@nestjs/common';
import {
  OwnableService,
  OWNER_SERVICE_KEY,
} from 'src/_common/types/resource-owner.type';

/**
 * Decorator to specify the service responsible for finding the resource.
 * @param serviceType The class type of the service (e.g., AccountsService, UsersService).
 */
export const OwnershipService = (serviceType: Type<OwnableService>) =>
  SetMetadata(OWNER_SERVICE_KEY, serviceType);
