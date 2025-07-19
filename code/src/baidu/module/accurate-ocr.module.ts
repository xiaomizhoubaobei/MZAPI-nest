import { Module } from '@nestjs/common'
import { HttpModule } from '@nestjs/axios'
import { BaiduAccurateOcrService } from '../service/accurate-ocr.service'
import { RequestLoggerUtil } from '../../common/utils/request-logger.util'
import { AccurateOcrController } from '../controller/accurate-ocr.controller'

@Module({
  imports: [HttpModule],
  controllers: [AccurateOcrController],
  providers: [BaiduAccurateOcrService, RequestLoggerUtil],
  exports: [BaiduAccurateOcrService],
})
export class AccurateOcrModule {}