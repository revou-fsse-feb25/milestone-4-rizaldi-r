import { SetMetadata, Type } from '@nestjs/common';

export const ResourceOwnerParams = (
  serviceType: Type<any>,
  isAllowAdminBypass: boolean = true,
) => SetMetadata('resourceConfig', { serviceType, isAllowAdminBypass });
