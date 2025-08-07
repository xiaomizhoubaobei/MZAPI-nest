import { Injectable, NestInterceptor, ExecutionContext, CallHandler, HttpException, HttpStatus } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class PostOnlyInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();

        if (request.method !== 'POST') {
            throw new HttpException('Method Not Allowed', HttpStatus.METHOD_NOT_ALLOWED);
        }

        return next.handle();
    }
}