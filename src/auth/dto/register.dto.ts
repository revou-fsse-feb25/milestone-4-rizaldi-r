import { UserRole } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty({ message: 'Username is required' })
  @MinLength(3, { message: 'Username must be at least 3 characters long' })
  @MaxLength(50, { message: 'Username cannot be longer than 50 characters' })
  username: string;

  @IsEmail({}, { message: 'Please enter a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  @MaxLength(100, { message: 'Email cannot be longer than 100 characters' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(255, { message: 'Password cannot be longer than 255 characters' })
  password: string;

  @IsString()
  @IsNotEmpty({ message: 'First name is required' })
  @MaxLength(50, { message: 'First name cannot be longer than 50 characters' })
  firstName: string;

  @IsString()
  @IsNotEmpty({ message: 'Last name is required' })
  @MaxLength(50, { message: 'Last name cannot be longer than 50 characters' })
  lastName: string;

  @IsEnum(UserRole, { message: 'Invalid user type' })
  @IsNotEmpty({ message: 'User type is required' })
  userType: UserRole;
}
