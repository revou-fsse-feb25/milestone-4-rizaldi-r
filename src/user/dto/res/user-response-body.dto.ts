import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Expose, Transform } from 'class-transformer';

export class UserResponseBodyDto {
  @ApiProperty()
  @Expose()
  id: number;

  @ApiProperty()
  @Expose()
  @Transform(
    ({ value }: { value: string | null }) =>
      typeof value === 'string' ? new Date(value) : value,
    { toClassOnly: true },
  )
  createdAt: string;

  @ApiProperty()
  @Expose()
  @Transform(
    ({ value }: { value: string | null }) =>
      typeof value === 'string' ? new Date(value) : value,
    { toClassOnly: true },
  )
  updatedAt: string;

  @ApiProperty()
  @Expose()
  username: string;

  @ApiProperty()
  @Expose()
  email: string;

  @ApiProperty()
  @Expose()
  firstName: string;

  @ApiProperty()
  @Expose()
  lastName: string;

  @ApiProperty()
  @Expose()
  userRole: UserRole;

  @ApiProperty()
  @Expose()
  @Transform(
    ({ value }: { value: string | null }) =>
      typeof value === 'string' ? new Date(value) : value,
    { toClassOnly: true },
  )
  lastLogin: string;
}
