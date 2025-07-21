import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { AccountNotFoundRepositoryException } from 'src/accounts/exceptions/account-not-found.exception.repository';
import { RepositoryException } from 'src/accounts/exceptions/exception.repository';
import { ErrorBody } from '../res/error.body.dto';

@Catch(RepositoryException)
export class RepositoryExceptionFilter implements ExceptionFilter {
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: RepositoryException, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;

    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();

    let responseBody: ErrorBody = {
      message: 'something wrong on our side',
      error: 'internal server error',
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
    };

    if (exception instanceof AccountNotFoundRepositoryException) {
      responseBody = {
        message: exception.message,
        error: exception.name,
        statusCode: HttpStatus.NOT_FOUND,
      };
    }

    httpAdapter.reply(res, responseBody, responseBody.statusCode);
  }
}
