import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { mapEntityToDto } from '../utils/mapper.util';
import { AccountBody } from 'src/accounts/dto/res/account-body.dto';

@Injectable()
export class BodyTransformerInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request: Request = context.switchToHttp().getRequest();

    let dtoClass: any;
    if (request.url.includes('/accounts')) {
      dtoClass = AccountBody;
    }

    return next.handle().pipe(
      map((data) => {
        if (!dtoClass || !data) return data as unknown;

        if (Array.isArray(data)) {
          console.log(' data', data);
          return data.map((item) => mapEntityToDto(dtoClass, item));
        } else {
          console.log(' data', data);
          return mapEntityToDto(dtoClass, data);
        }
      }),
    );
  }
}
