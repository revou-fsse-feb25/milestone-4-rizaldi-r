import { UserRole } from '@prisma/client';
import { Expose, Transform } from 'class-transformer';

export class UserResponseBodyDto {
  @Expose()
  id: number;

  @Expose()
  @Transform(
    ({ value }: { value: string | null }) =>
      typeof value === 'string' ? new Date(value) : value,
    { toClassOnly: true },
  )
  createdAt: string;

  @Expose()
  @Transform(
    ({ value }: { value: string | null }) =>
      typeof value === 'string' ? new Date(value) : value,
    { toClassOnly: true },
  )
  updatedAt: string;

  @Expose()
  username: string;

  @Expose()
  email: string;

  @Expose()
  firstName: string;

  @Expose()
  lastName: string;

  @Expose()
  userRole: UserRole;

  @Expose()
  @Transform(
    ({ value }: { value: string | null }) =>
      typeof value === 'string' ? new Date(value) : value,
    { toClassOnly: true },
  )
  lastLogin: string;
}
