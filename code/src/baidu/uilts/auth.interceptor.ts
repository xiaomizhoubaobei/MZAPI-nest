import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { BaiduAuthService } from './auth.service';
import { BaiduAuthConfigService } from './auth.config';
import { BAIDU_AUTH_SERVICE_KEY } from './auth.decorator';

/**
 * 百度AI鉴权拦截器
 * 自动为标记了@BaiduAuth装饰器的路由获取访问令牌
 */
@Injectable()
export class BaiduAuthInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly authService: BaiduAuthService,
    private readonly configService: BaiduAuthConfigService,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const serviceName = this.reflector.getAllAndOverride<string>(
      BAIDU_AUTH_SERVICE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!serviceName) {
      // 如果没有标记@BaiduAuth装饰器，直接继续执行
      return next.handle();
    }

    const config = this.configService.getConfig(serviceName);
    if (!config) {
      throw new HttpException(
        `百度AI服务 "${serviceName}" 的配置未找到，请先注册配置`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    try {
      // 获取访问令牌
      const accessToken = await this.authService.getAccessToken(config);
      
      // 将令牌和配置注入到请求对象中
      const request = context.switchToHttp().getRequest();
      request.baiduAccessToken = accessToken;
      request.baiduConfig = config;
      request.baiduServiceName = serviceName;

      return next.handle();
    } catch (error) {
      throw new HttpException(
        `百度AI鉴权失败: ${error.message}`,
        HttpStatus.UNAUTHORIZED,
      );
    }
  }
}