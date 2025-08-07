import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import * as crypto from 'crypto';

@Injectable()
export class ContentDigestInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        return next.handle().pipe(
            map(data => {
                const response = context.switchToHttp().getResponse();
                const content = typeof data === 'string' ? data : JSON.stringify(data);
                
                // 生成SHA512摘要
                const digest = crypto.createHash('sha512')
                    .update(content)
                    .digest('base64');
                
                // 设置Content-Digest头部
                response.setHeader('Content-Digest', `sha-512=${digest}`);
                
                return data;
            })
        );
    }
}