import { NotFoundException } from '@nestjs/common';

type Subject = 'User' | 'Account' | 'Transaction';
type IndentifierType = 'id' | 'email';

export class CustomNotFoundException extends NotFoundException {
  constructor(
    subject: Subject,
    indentifierType: IndentifierType,
    indentifier: number | string,
    message: string = `${subject} with ${indentifierType} ${indentifier} not found`,
  ) {
    super(message);
    this.name = CustomNotFoundException.name;
    Error.captureStackTrace(this, this.constructor);
  }
}
