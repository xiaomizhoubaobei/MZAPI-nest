import { HttpModule } from '@nestjs/axios'
import { Module } from '@nestjs/common'
import { RequestLoggerUtil } from '../../common/utils/request-logger.util'
import { BaiduAddressRecognitionController } from '../controller/address-recognition.controller'
import { BaiduAddressRecognitionService } from '../service/address-recognition.service'
import { BaiduAuthConfigService } from '../uilts/auth.config'
import { BaiduAuthInterceptor } from '../uilts/auth.interceptor'
import { BaiduAuthService } from '../uilts/auth.service'

/**
 * 百度AI地址识别模块
 * 提供地址识别相关的服务和控制器
 */
@Module({
  imports: [
    HttpModule.register({
      timeout: 30000, // 30秒超时
      maxRedirects: 3,
      headers: {
        'User-Agent': 'MZAPI-BaiduAI-AddressRecognition/1.0.0',
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    }),
  ],
  controllers: [
    BaiduAddressRecognitionController,
  ],
  providers: [
    BaiduAddressRecognitionService,
    BaiduAuthService,
    BaiduAuthConfigService,
    BaiduAuthInterceptor,
    RequestLoggerUtil,
  ],
  exports: [
    BaiduAddressRecognitionService,
    BaiduAuthService,
    BaiduAuthConfigService,
  ],
})
export class BaiduAddressRecognitionModule {}
