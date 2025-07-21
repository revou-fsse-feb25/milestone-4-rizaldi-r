import { RepositoryException } from './exception.repository';

export class AccountNotFoundRepositoryException extends RepositoryException {
  constructor(message: string = 'account not found') {
    super(message);
    this.name = AccountNotFoundRepositoryException.name;
    Error.captureStackTrace(this, this.constructor);
  }
}
