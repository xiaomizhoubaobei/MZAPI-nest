import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { BaiduAuthService } from './auth.service';
import { BaiduAuthConfigService } from './auth.config';
import { BaiduAuthInterceptor } from './auth.interceptor';

/**
 * 百度AI鉴权模块
 * 提供百度AI平台的访问令牌管理功能
 */
@Module({
  imports: [
    HttpModule.register({
      timeout: 10000, // 10秒超时
      maxRedirects: 3,
    }),
  ],
  providers: [BaiduAuthService, BaiduAuthConfigService, BaiduAuthInterceptor],
  exports: [BaiduAuthService, BaiduAuthConfigService, BaiduAuthInterceptor],
})
export class BaiduAuthModule {}