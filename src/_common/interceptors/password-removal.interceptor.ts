import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class PasswordRemovalInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        // If the data is an array, iterate
        if (Array.isArray(data)) {
          return data.map((item) => {
            if (
              typeof item === 'object' &&
              item !== null &&
              'password' in item
            ) {
              const { password, ...rest } = item;
              return rest;
            }
            return item;
          });
        }
        // If the data is a single object
        else if (
          typeof data === 'object' &&
          data !== null &&
          'password' in data
        ) {
          const { password, ...rest } = data;
          return rest;
        }
        return data;
      }),
    );
  }
}
