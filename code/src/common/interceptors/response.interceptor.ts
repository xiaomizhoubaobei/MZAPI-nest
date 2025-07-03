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

const ONE_DAY_IN_MILLISECONDS = 86400000;
const HMAC_SECRET_KEY = '9ff5fcf40eff8af3cfa0a53dc8f4dc7dad8f9af9520c24d4330cfa0bce00c267'; // 请替换为您的实际密钥

const COMMON_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: 'lax' as const,
  domain: '.mizhoubaobei.top',
  maxAge: ONE_DAY_IN_MILLISECONDS,
  path: '/',
};


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
    const requestId = request.headers['x-fc-request-id'] as string 
    
    // 获取服务端IP（从x-forwarded-for头部）
    const forwardedFor = request.headers['x-forwarded-for'] as string;
    const serverIp = this.extractServerIp(forwardedFor);
    
    // eo-client-ip头部获取
    const clientIp = request.headers['eo-client-ip'] as string;

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
        
        // 设置用户IP到cookies
        if (clientIp) {
          response.setHeader('X-Client-IP', clientIp);
          response.cookie('clientIp', clientIp, COMMON_COOKIE_OPTIONS);
        }

        // 设置服务端IP到cookies
        if (serverIp) {
          response.cookie('serverIp', serverIp, COMMON_COOKIE_OPTIONS);
        }

        // 计算并设置Content-Digest头部
        const responseData = data ? JSON.stringify(data) : '';
        const sha512Hash = crypto.createHash('sha512').update(responseData).digest('base64');
        response.setHeader('Content-Digest', `sha-512=:${sha512Hash}:`);

        // 计算并设置Content-SHA256头部
        const sha256Hash = crypto.createHash('sha256').update(responseData).digest('base64');
        response.setHeader('Content-SHA256', sha256Hash);

        // 计算并设置Content-SHA384头部
        const sha384Hash = crypto.createHash('sha384').update(responseData).digest('base64');
        response.setHeader('Content-SHA384', sha384Hash);

        // 计算并设置Content-MD5头部  
    const md5Hash = crypto.createHash('md5').update(responseData).digest('base64');
    response.setHeader('Content-MD5', md5Hash);
    
    // 计算并设置Content-SHA3-256头部
    const sha3_256Hash = crypto.createHash('sha3-256').update(responseData).digest('base64');
    response.setHeader('Content-SHA3-256', sha3_256Hash);
    
    // 计算并设置Content-SHA3-384头部
    const sha3_384Hash = crypto.createHash('sha3-384').update(responseData).digest('base64');
    response.setHeader('Content-SHA3-384', sha3_384Hash);
    
    // 计算并设置Content-SHA3-512头部
    const sha3_512Hash = crypto.createHash('sha3-512').update(responseData).digest('base64');
    response.setHeader('Content-SHA3-512', sha3_512Hash);

    // 计算并设置Content-RIPEMD128头部
    const ripemd128Hash = crypto.createHash('ripemd128').update(responseData).digest('base64');
    response.setHeader('Content-RIPEMD128', ripemd128Hash);

    // 计算并设置Content-RIPEMD160头部
    const ripemd160Hash = crypto.createHash('ripemd160').update(responseData).digest('base64');
    response.setHeader('Content-RIPEMD160', ripemd160Hash);

    // 计算并设置Content-HMAC-SHA256头部
    const hmacSha256 = crypto.createHmac('sha256', HMAC_SECRET_KEY).update(responseData).digest('base64');
    response.setHeader('Content-HMAC-SHA256', hmacSha256);

        //添加requestId
        response.setHeader('X-Request-Id', requestId);

        //服务端IP到响应头部
        if (serverIp) {
          response.setHeader('X-Server-IP', serverIp);
        }
        
        // 客户端IP到响应头部
        if (clientIp) {
          response.setHeader('X-Client-IP', clientIp);
        }
        
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
   * 从x-forwarded-for头部提取服务端IP
   */
  private extractServerIp(forwardedFor?: string): string | undefined {
    if (!forwardedFor) {
      return undefined;
    }
    
    // x-forwarded-for格式: client, proxy1, proxy2, ..., server
    // 最后一个IP通常是服务端IP
    const ips = forwardedFor.split(',').map(ip => ip.trim());
    return ips.length > 0 ? ips[ips.length - 1] : undefined;
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