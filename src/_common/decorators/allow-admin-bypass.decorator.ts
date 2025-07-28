import { SetMetadata } from '@nestjs/common';

export const AllowAdminBypass = () => SetMetadata('isAdminBypassEnabled', true);
