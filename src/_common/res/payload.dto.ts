import { UserRole } from '@prisma/client';

export class PayloadDto {
  id: number;
  email: string;
  userRole: UserRole;
}
