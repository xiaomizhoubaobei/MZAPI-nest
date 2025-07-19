import { Controller, Post, Body, HttpCode, HttpStatus, UseInterceptors } from '@nestjs/common'
import { BaiduAccurateOcrService } from '../service/accurate-ocr.service'
import { AccurateOcrRequest, AccurateOcrResponse } from '../service/accurate-ocr.service'
import { ResponseInterceptor } from '../../common/interceptors/response.interceptor'
import { ApiOperation, ApiResponse, ApiTags, ApiBody } from '@nestjs/swagger'

@ApiTags('百度OCR')
@Controller('baidu/accurate-ocr')
@UseInterceptors(ResponseInterceptor)
export class AccurateOcrController {
  constructor(private readonly accurateOcrService: BaiduAccurateOcrService) {}

  @Post('recognize')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '高精度文字识别', description: '使用百度AI高精度OCR接口识别文字' })
  @ApiBody({ type: AccurateOcrRequest })
  @ApiResponse({ status: 200, type: AccurateOcrResponse })
  async recognizeText(
    @Body() body: any,
  ): Promise<AccurateOcrResponse> {
    const request = new AccurateOcrRequest()
    Object.assign(request, body)
    return this.accurateOcrService.recognizeText(request)
  }
}