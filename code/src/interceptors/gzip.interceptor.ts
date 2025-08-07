import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import * as zlib from 'zlib';

@Injectable()
export class GzipInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();
        const response = context.switchToHttp().getResponse();

        // 检查客户端是否接受gzip编码
        const acceptEncoding = request.headers['accept-encoding'] || '';
        if (!acceptEncoding.includes('gzip')) {
            return next.handle();
        }

        response.setHeader('Content-Encoding', 'gzip');

        return next.handle().pipe(
            map(data => {
                if (typeof data === 'string' || Buffer.isBuffer(data)) {
                    return zlib.gzipSync(data);
                }
                return zlib.gzipSync(JSON.stringify(data));
            })
        );
    }
}