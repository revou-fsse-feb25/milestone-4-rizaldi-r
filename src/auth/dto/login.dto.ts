import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class LoginDto {
  @IsString()
  @MinLength(3, { message: 'Username must be at least 3 characters long' })
  @MaxLength(50, { message: 'Username cannot be longer than 50 characters' })
  username?: string;

  @IsEmail({}, { message: 'Please enter a valid email address' })
  @MaxLength(100, { message: 'Email cannot be longer than 100 characters' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(255, { message: 'Password cannot be longer than 255 characters' })
  password: string;
}
