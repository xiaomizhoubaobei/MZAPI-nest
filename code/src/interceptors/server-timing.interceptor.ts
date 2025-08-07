import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class ServerTimingInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const start = process.hrtime();
        
        return next.handle().pipe(
            map(data => {
                const response = context.switchToHttp().getResponse();
                const diff = process.hrtime(start);
                const duration = (diff[0] * 1e3 + diff[1] * 1e-6).toFixed(3); // 转换为毫秒
                
                // 设置Server-Timing头部
                response.setHeader('Server-Timing', `total;dur=${duration}`);
                
                return data;
            })
        );
    }
}