import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom, timeout, catchError } from 'rxjs';
import { throwError } from 'rxjs';

/**
 * 地址识别请求参数接口
 */
export interface AddressRecognitionRequest {
  /** 待识别的地址文本，最大长度1000字节 */
  text: string;
  /** 百度AI API Key */
  apiKey: string;
  /** 可选的配置参数 */
  options?: {
    /** 是否返回详细的地址组件信息 */
    detail?: boolean;
    /** 超时时间（毫秒），默认10000 */
    timeout?: number;
  };
}

/**
 * 地址识别响应接口
 */
export interface AddressRecognitionResponse {
  /** 错误码，0表示成功 */
  error_code: number;
  /** 错误信息 */
  error_msg?: string;
  /** 识别结果 */
  result?: AddressRecognitionResult;
  /** 请求日志ID */
  log_id?: number;
}

/**
 * 地址识别结果接口
 */
export interface AddressRecognitionResult {
  /** 请求唯一标识码 */
  log_id?: number;
  /** 原始输入的文本内容 */
  text?: string;
  /** 省（直辖市/自治区） */
  province?: string;
  /** 省国标code */
  province_code?: string;
  /** 市 */
  city?: string;
  /** 城市国标code */
  city_code?: string;
  /** 区（县） */
  county?: string;
  /** 区县国标code */
  county_code?: string;
  /** 街道（乡/镇） */
  town?: string;
  /** 街道/乡镇国标code */
  town_code?: string;
  /** 姓名 */
  person?: string;
  /** 详细地址 */
  detail?: string;
  /** 电话号码 */
  phonenum?: string;
  /** 纬度（百度坐标，仅供参考） */
  lat?: number;
  /** 经度（百度坐标，仅供参考） */
  lng?: number;
}



/**
 * 百度AI地址识别服务
 * 提供地址文本的智能识别和解析功能
 */
@Injectable()
export class BaiduAddressRecognitionService {
  private readonly logger = new Logger(BaiduAddressRecognitionService.name);
  private readonly baseUrl = 'https://aip.baidubce.com/rpc/2.0/nlp/v1';
  private readonly defaultTimeout = 30000; // 增加到30秒
  private readonly maxTextLength = 1000; // 最大字节数
  private readonly textEncoder = new TextEncoder(); // 复用TextEncoder实例

  constructor(
    private readonly httpService: HttpService,
  ) {}

  /**
   * 识别单个地址文本
   * @param request 地址识别请求参数
   * @returns 地址识别结果
   */
  async recognizeAddress(
    request: AddressRecognitionRequest,
  ): Promise<AddressRecognitionResult> {
    try {
      // 验证输入参数
      this.validateAddressText(request.text);

      // 验证API Key格式（支持bce-v3/ALTAK格式）
      if (!request.apiKey || typeof request.apiKey !== 'string') {
        throw new HttpException(
          'API Key格式无效',
          HttpStatus.BAD_REQUEST,
        );
      }
      
      // 验证API Key是否符合bce-v3/ALTAK格式
      const apiKeyPattern = /^bce-v3\/ALTAK[a-zA-Z0-9\-_]+\/[a-zA-Z0-9\-_]+$/;
      if (!apiKeyPattern.test(request.apiKey)) {
        throw new HttpException(
          'API Key格式无效,应为bce-v3/ALTAK-xxx/xxx格式',
          HttpStatus.BAD_REQUEST,
        );
      }
      
      // 构建请求URL（移除access_token参数）
      const url = `${this.baseUrl}/address`;
      
      // 构建请求体
      const requestBody = {
        text: request.text.trim(),
      };

      // 设置超时时间
      const timeoutMs = request.options?.timeout || this.defaultTimeout;

      this.logger.debug(`开始识别地址: ${request.text.substring(0, 50)}...`);

      // 发送HTTP请求，使用Bearer API Key认证
      const response = await firstValueFrom(
        this.httpService.post<AddressRecognitionResponse>(url, requestBody, {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${request.apiKey}`,
          },
          timeout: timeoutMs,
        }).pipe(
          timeout(timeoutMs),
          catchError((error) => {
            this.logger.error(`地址识别请求失败: ${error.message}`, error.stack);
            return throwError(() => new HttpException(
              `地址识别服务请求失败: ${error.message}`,
              HttpStatus.BAD_GATEWAY,
            ));
          }),
        ),
      );

      // 检查响应数据是否存在
      if (!response.data) {
        this.logger.error('百度API返回空响应');
        throw new HttpException(
          '地址识别服务返回空响应',
          HttpStatus.BAD_GATEWAY,
        );
      }

      // 检查响应状态 - 百度API成功时没有error_code字段，失败时才有
      if (response.data.error_code !== undefined && response.data.error_code !== 0) {
        const errorCode = response.data.error_code;
        const errorMsg = response.data.error_msg || '未知错误';
        this.logger.error(`百度API返回错误: ${errorCode} - ${errorMsg}`);
        this.logger.error(`完整错误响应: ${JSON.stringify(response.data)}`);
        throw new HttpException(
          `地址识别失败: ${errorMsg} (错误码: ${errorCode})`,
          HttpStatus.BAD_REQUEST,
        );
      }

      // 成功响应直接返回数据（百度地址识别API成功时直接返回解析结果，不包装在result字段中）
      this.logger.debug(`地址识别成功: ${JSON.stringify(response.data)}`);
      
      return response.data;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      this.logger.error(`地址识别服务异常: ${error.message}`, error.stack);
      throw new HttpException(
        '地址识别服务内部错误',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 验证地址文本格式
   * @param text 待验证的地址文本
   * @returns 是否有效
   */
  validateAddressText(text: string): boolean {
    if (!text || typeof text !== 'string') {
      return false;
    }

    // 检查字节长度（UTF-8编码）- 使用复用的TextEncoder实例
    const byteLength = this.textEncoder.encode(text).length;
    if (byteLength > this.maxTextLength) {
      return false;
    }

    // 检查是否包含中文字符（地址识别通常需要中文）
    const chineseRegex = /[\u4e00-\u9fa5]/;
    if (!chineseRegex.test(text)) {
      return false;
    }

    // 检查文本长度不能太短
    if (text.trim().length < 2) {
      return false;
    }

    return true;
  }
}