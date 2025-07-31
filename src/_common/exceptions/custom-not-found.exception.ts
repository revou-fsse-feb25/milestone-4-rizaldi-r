import { NotFoundException } from '@nestjs/common';

type Subject = 'User' | 'Account' | 'Transaction';
type IndentifierType = 'id' | 'email';

export class ResourceNotFoundException extends NotFoundException {
  // public status: HttpStatus;
  constructor(
    subject: Subject,
    indentifierType: IndentifierType,
    indentifier: number | string,
    message: string = `${subject} with ${indentifierType} ${indentifier} not found.`,
    // status: HttpStatus = HttpStatus.NOT_FOUND,
  ) {
    super(message);
    this.name = ResourceNotFoundException.name;
    // this.status = status;
    Error.captureStackTrace(this, this.constructor);
  }
}
