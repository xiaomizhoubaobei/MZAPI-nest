import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { BaiduAddressRecognitionModule, AccurateOcrModule } from './baidu'

/**
 * 应用根模块
 * 整合所有功能模块
 */
@Module({
  imports: [
    // 配置模块
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    // 百度地址识别模块
    BaiduAddressRecognitionModule,
    // 百度高精度OCR模块
    AccurateOcrModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
