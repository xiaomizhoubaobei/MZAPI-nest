import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
  Get,
  Query
} from '@nestjs/common';
import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

import { BaiduAddressRecognitionService, AddressRecognitionResult } from './address-recognition.service';

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
export class AddressRecognitionResponseDto {
  /** 是否成功 */
  success: boolean;
  /** 响应消息 */
  message: string;
  /** 识别结果 */
  data?: AddressRecognitionResult | AddressRecognitionResult[];
  /** 请求时间戳 */
  timestamp: number;
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
  async recognizeAddress(
    @Body() request: SingleAddressRecognitionDto
  ): Promise<AddressRecognitionResponseDto> {
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

      return {
        success: true,
        message: '地址识别成功',
        data: result,
        timestamp: Date.now()
      };
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

  /**
   * 验证地址文本格式
   */
  @Get('validate')
  async validateAddressText(
    @Query('text') text: string
  ): Promise<{
    success: boolean;
    message: string;
    isValid: boolean;
    timestamp: number;
  }> {
    try {
      if (!text) {
        throw new HttpException(
          '地址文本参数不能为空',
          HttpStatus.BAD_REQUEST
        );
      }

      const isValid = this.addressRecognitionService.validateAddressText(text);

      return {
        success: true,
        message: isValid ? '地址文本格式有效' : '地址文本格式无效',
        isValid,
        timestamp: Date.now()
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        `地址文本验证失败: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}