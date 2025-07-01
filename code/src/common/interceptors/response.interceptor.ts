import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpStatus,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Request, Response } from 'express';
import { ApiResponse } from '../dto/response.dto';
import * as crypto from 'crypto';

/**
 * 统一响应格式拦截器
 * 自动将所有控制器返回的数据包装为统一的响应格式
 */
@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    
    // 获取请求ID（如果有的话）
    const requestId = request.headers['x-request-id'] as string || 
                     request.headers['request-id'] as string;

    // 打印详细的请求头部信息
    console.log('=== 请求头部详情 ===');
    console.log(`请求方法: ${request.method}`);
    console.log(`请求路径: ${request.url}`);
    console.log(`请求ID: ${requestId || '无'}`);
    console.log('请求头部:');
    Object.entries(request.headers).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });
    console.log('==================');

    return next.handle().pipe(
      map((data) => {
        // 设置禁止缓存的头部
        response.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        response.setHeader('Pragma', 'no-cache');
        response.setHeader('Expires', new Date(0).toUTCString());
        
        // 设置Content-Language头部表示中文
        response.setHeader('Content-Language', 'zh-CN');
        
        // 设置Accept-CH头部请求设备内存和用户代理信息
        response.setHeader('Accept-CH', [
          'Device-Memory',
          'Sec-CH-UA',
          'Sec-CH-UA-Arch',
          'Sec-CH-UA-Full-Version-List',
          'Sec-CH-UA-Model',
          'Sec-CH-UA-Platform',
          'Sec-CH-UA-Platform-Version',
          'Sec-CH-UA-WoW64'
        ].join(', '));

        // 计算并设置Content-Digest头部
        const responseData = data ? JSON.stringify(data) : '';
        const hash = crypto.createHash('sha512').update(responseData).digest('base64');
        response.setHeader('Content-Digest', `sha-512=:${hash}:`);
        
        // 如果返回的数据已经是ApiResponse格式，直接返回
        if (data && typeof data === 'object' && 'header' in data && 'code' in data && 'body' in data) {
          return data as ApiResponse<T>;
        }

        // 获取HTTP状态码
        const statusCode = response.statusCode || HttpStatus.OK;
        
        // 根据状态码判断是否成功
        const isSuccess = statusCode >= 200 && statusCode < 300;
        
        // 设置响应消息
        let message = '操作成功';
        if (!isSuccess) {
          message = this.getErrorMessage(statusCode);
        }

        // 包装为统一响应格式
        return ApiResponse.success(data, message, statusCode, requestId);
      }),
    );
  }

  /**
   * 根据状态码获取错误消息
   */
  private getErrorMessage(statusCode: number): string {
    switch (statusCode) {
      case HttpStatus.BAD_REQUEST:
        return '请求参数错误';
      case HttpStatus.UNAUTHORIZED:
        return '未授权访问';
      case HttpStatus.FORBIDDEN:
        return '禁止访问';
      case HttpStatus.NOT_FOUND:
        return '资源未找到';
      case HttpStatus.INTERNAL_SERVER_ERROR:
        return '服务器内部错误';
      default:
        return '操作失败';
    }
  }
}