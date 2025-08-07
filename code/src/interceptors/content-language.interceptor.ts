import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class ContentLanguageInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const response = context.switchToHttp().getResponse();

        // 设置Content-Language为zh-CN
        response.setHeader('Content-Language', 'zh-CN');

        return next.handle().pipe(
            map(data => data)
        );
    }
}