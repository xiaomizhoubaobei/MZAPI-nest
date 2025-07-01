import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus
} from '@nestjs/common';
import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiResponse as SwaggerApiResponse } from '@nestjs/swagger';

import { BaiduAddressRecognitionService, AddressRecognitionResult } from './service/address-recognition.service';
import { ApiResponse } from '../common';

/**
 * 单个地址识别请求DTO
 */
export class SingleAddressRecognitionDto {
  /** 待识别的地址文本 */
  @ApiProperty({ description: '待识别的地址文本', example: '上海市浦东新区纳贤路701号百度上海研发中心' })
  @IsString({ message: '地址文本必须是字符串' })
  @IsNotEmpty({ message: '地址文本不能为空' })
  text: string;

  /** 百度AI API Key */
  @ApiProperty({ description: '百度AI API Key', example: 'your-api-key-here' })
  @IsString({ message: 'API Key必须是字符串' })
  @IsNotEmpty({ message: 'API Key不能为空' })
  apiKey: string;
}

/**
 * 地址识别响应DTO
 */
export class AddressRecognitionResponseDto extends ApiResponse<AddressRecognitionResult> {
  @ApiProperty({ description: '识别结果数据' })
  declare body: {
    success: boolean;
    message: string;
    data?: AddressRecognitionResult;
    error?: {
      code: string;
      details?: any;
    };
  };
}

/**
 * 百度AI地址识别控制器
 * 提供地址识别相关的REST API接口
 */
@Controller('baidu/address-recognition')
export class BaiduAddressRecognitionController {
  constructor(
    private readonly addressRecognitionService: BaiduAddressRecognitionService
  ) {}

  /**
   * 单个地址识别
   */
  @Post('recognize')
  @SwaggerApiResponse({
    status: 200,
    description: '地址识别成功',
    type: AddressRecognitionResponseDto,
  })
  @SwaggerApiResponse({
    status: 400,
    description: '请求参数错误',
  })
  @SwaggerApiResponse({
    status: 500,
    description: '服务器内部错误',
  })
  async recognizeAddress(
    @Body() request: SingleAddressRecognitionDto
  ): Promise<AddressRecognitionResult> {
    try {
      // 验证输入参数
      if (!request.text) {
        throw new HttpException(
          '地址文本不能为空',
          HttpStatus.BAD_REQUEST
        );
      }

      if (!request.apiKey) {
         throw new HttpException(
           'API Key不能为空',
           HttpStatus.BAD_REQUEST
         );
       }

      if (!this.addressRecognitionService.validateAddressText(request.text)) {
        throw new HttpException(
          '地址文本格式无效，请提供包含中文的有效地址信息',
          HttpStatus.BAD_REQUEST
        );
      }

      const result = await this.addressRecognitionService.recognizeAddress({
         text: request.text,
         apiKey: request.apiKey
       });

      // 直接返回数据，响应拦截器会自动包装为统一格式
      return result;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        `地址识别失败: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }


}