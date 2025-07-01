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
 * Cookie选项接口
 */
interface CookieOptions {
  /** Cookie值 */
  value: string;
  /** 过期时间（Date对象或UTC字符串） */
  expires?: Date | string;
  /** 最大存活时间（秒） */
  maxAge?: number;
  /** 域名 */
  domain?: string;
  /** 路径 */
  path?: string;
  /** 是否仅HTTPS传输 */
  secure?: boolean;
  /** 是否禁止JavaScript访问 */
  httpOnly?: boolean;
  /** SameSite策略 */
  sameSite?: 'Strict' | 'Lax' | 'None';
}

/**
 * Cookies设置对象
 */
type CookiesData = Record<string, string | CookieOptions>;

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
    
    // 处理cookies（包括从eo-client-ip头部获取）
    const cookies = request.headers.cookie || '';
    const clientIp = request.headers['eo-client-ip'] as string;
    const parsedCookies = this.parseCookies(cookies, clientIp, requestId); 

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
        
        // 设置用户IP到响应头部
        if (clientIp) {
          response.setHeader('X-Client-IP', clientIp);
        }

        // 设置cookies（如果数据中包含cookies信息）
        if (data && typeof data === 'object' && 'cookies' in data) {
          this.setCookies(response, data.cookies as any);
        }

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

        // 包装为统一响应格式，包含用户IP和cookies信息
        const responseWithMetadata = {
          ...data,
          _metadata: {
            clientIp,
            serverIp,
            cookies: parsedCookies,
            requestId
          }
        };
        
        return ApiResponse.success(responseWithMetadata, message, statusCode, requestId);
      }),
    );
  }

  /**
   * 解析cookies字符串为对象
   */
  private parseCookies(cookieString: string, eoclientIp?: string, requestId?: string): Record<string, string> {
    const cookies: Record<string, string> = {};
    
    // 解析标准cookies
    if (cookieString) {
      cookieString.split(';').forEach(cookie => {
        const [name, ...rest] = cookie.trim().split('=');
        if (name && rest.length > 0) {
          cookies[name] = decodeURIComponent(rest.join('='));
        }
      });
    }
    
    // 将eo-client-ip作为特殊cookie处理
    if (eoclientIp) {
      cookies['eo-client-ip'] = eoclientIp;
    }
    
    // 将requestId作为特殊cookie处理
    if (requestId) {
      cookies['request-id'] = requestId;
    }
    
    return cookies;
  }

  /**
   * 设置cookies到响应头部（使用最安全的默认配置）
   */
  private setCookies(response: Response, cookies: CookiesData): void {
    const cookieHeaders: string[] = [];
    
    for (const [name, cookieData] of Object.entries(cookies)) {
      let cookieString = `${name}=`;
      let options: CookieOptions;
      
      if (typeof cookieData === 'string') {
        // 简单字符串值，使用最安全的默认配置
        cookieString += encodeURIComponent(cookieData);
        options = { value: cookieData, ...this.getSecureDefaults() };
      } else {
        // 复杂cookie选项，合并用户配置和安全默认值
        cookieString += encodeURIComponent(cookieData.value);
        options = { ...this.getSecureDefaults(), ...cookieData };
      }
      
      // 添加各种属性
      if (options.expires) {
        const expiresDate = options.expires instanceof Date 
          ? options.expires 
          : new Date(options.expires);
        cookieString += `; Expires=${expiresDate.toUTCString()}`;
      }
      
      if (options.maxAge !== undefined) {
        cookieString += `; Max-Age=${options.maxAge}`;
      }
      
      if (options.domain) {
        cookieString += `; Domain=${options.domain}`;
      }
      
      if (options.path) {
        cookieString += `; Path=${options.path}`;
      }
      
      if (options.secure) {
        cookieString += '; Secure';
      }
      
      if (options.httpOnly) {
        cookieString += '; HttpOnly';
      }
      
      if (options.sameSite) {
        cookieString += `; SameSite=${options.sameSite}`;
      }
      
      cookieHeaders.push(cookieString);
    }
    
    // 设置Set-Cookie头部（支持多个cookie）
    if (cookieHeaders.length > 0) {
      response.setHeader('Set-Cookie', cookieHeaders);
    }
  }

  /**
   * 获取最安全的cookie默认配置
   */
  private getSecureDefaults(): Partial<CookieOptions> {
    return {
      path: '/',              // 限制路径为根路径
      httpOnly: true,         // 禁止JavaScript访问，防止XSS攻击
      secure: true,           // 仅HTTPS传输，防止中间人攻击
      sameSite: 'Strict',     // 最严格的跨站策略，防止CSRF攻击
      maxAge: 3600,           // 默认1小时过期，减少会话劫持风险
    };
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