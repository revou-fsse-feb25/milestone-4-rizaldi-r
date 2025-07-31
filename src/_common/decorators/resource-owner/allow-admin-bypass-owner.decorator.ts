import { SetMetadata } from '@nestjs/common';
import { IS_ADMIN_BYPASS_ENABLED_KEY } from '../../types/resource-owner.type';

export const AllowAdminBypassOwnership = () =>
  SetMetadata(IS_ADMIN_BYPASS_ENABLED_KEY, true);
