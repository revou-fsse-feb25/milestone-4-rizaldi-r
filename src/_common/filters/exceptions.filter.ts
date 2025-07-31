import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ResourceNotFoundException } from 'src/_common/exceptions/custom-not-found.exception';

/**
 * Catches all exceptions thrown in the application and formats the response.
 * Specifically handles UserNotFoundException and general HttpExceptions.
 */
@Catch()
export class ExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status: HttpStatus;
    let message: string;
    let errorName: string;

    if (exception instanceof ResourceNotFoundException) {
      // Handle ResourceNotFoundException
      status = HttpStatus.NOT_FOUND;
      message = exception.message || 'not found.';
      errorName = exception.name;
    } else if (exception instanceof HttpException) {
      // Handle built-in NestJS HttpExceptions
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null &&
        'message' in exceptionResponse
      ) {
        message = exceptionResponse.message as string;
      } else {
        message = 'An unexpected HTTP error occurred.';
      }
      errorName = exception.name;
    } else if (exception instanceof Error) {
      // Handle any other generic JavaScript Error objects
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Internal server error.';
      errorName = exception.name || 'Error';

      // Log the original error for debugging on the server side
      console.error(
        `Unhandled error: ${exception.name} - ${exception.message}`,
        exception.stack,
      );
    } else {
      // Fallback for unknown exception types
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'An unknown error occurred.';
      errorName = 'UnknownError';
      console.error('An unknown exception type was caught:', exception);
    }

    response.status(status).json({
      statusCode: status,
      message,
      error: errorName,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
