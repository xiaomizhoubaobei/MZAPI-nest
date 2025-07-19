import { HttpService } from '@nestjs/axios'
import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common'
import { firstValueFrom, timeout, catchError } from 'rxjs'
import { throwError } from 'rxjs'
import { RequestLoggerUtil } from '../../common/utils/request-logger.util'

/**
 * 高精度OCR请求参数类
 */
export class AccurateOcrRequest {
  /** 图像数据，base64编码后进行urlencode */
  image?: string
  /** 图片完整URL */
  url?: string
  /** PDF文件，base64编码后进行urlencode */
  pdfFile?: string
  /** OFD文件，base64编码后进行urlencode */
  ofdFile?: string
  /** 需要识别的页码 */
  fileNum?: string
  /** 百度AI API Key */
  apiKey: string
  /** 识别语言类型 */
  languageType?: string
  /** 是否检测图像朝向 */
  detectDirection?: boolean
  /** 是否输出段落信息 */
  paragraph?: boolean
  /** 是否返回置信度 */
  probability?: boolean
  /** 是否开启多方向文字识别 */
  multidirectionalRecognize?: boolean
  /** 超时时间（毫秒），默认30000 */
  timeout?: number
}

/**
 * 高精度OCR响应类
 */
export class AccurateOcrResponse {
  /** 错误码，0表示成功 */
  error_code?: number
  /** 错误信息 */
  error_msg?: string
  /** 识别结果 */
  words_result?: Array<{
    words: string
    probability?: {
      average: number
      variance: number
      min: number
    }
  }>
  /** 段落检测结果 */
  paragraphs_result?: Array<{
    words_result_idx: number[]
  }>
  /** 图像方向 */
  direction?: number
  /** 识别结果数 */
  words_result_num?: number
  /** 段落结果数 */
  paragraphs_result_num?: number
  /** PDF总页数 */
  pdf_file_size?: string
  /** OFD总页数 */
  ofd_file_size?: string
  /** 请求日志ID */
  log_id?: number
}

/**
 * 百度AI高精度OCR服务
 * 提供更高精度的文字识别服务，支持更多语种识别
 */
@Injectable()
export class BaiduAccurateOcrService {
  private readonly logger = new Logger(BaiduAccurateOcrService.name)
  private readonly baseUrl = 'https://aip.baidubce.com/rest/2.0/ocr/v1'
  private readonly defaultTimeout = 30000
  private readonly maxFileSize = 10 * 1024 * 1024 // 10MB

  constructor(
    private readonly httpService: HttpService,
    private readonly requestLogger: RequestLoggerUtil,
  ) {}

  /**
   * 高精度文字识别
   * @param request 识别请求参数
   * @param requestId 请求ID
   * @returns 识别结果
   */
  async recognizeText(
    request: AccurateOcrRequest,
    requestId?: string,
  ): Promise<AccurateOcrResponse> {
    try {
      // 验证API Key
      this.validateApiKey(request.apiKey)

      // 验证输入参数
      this.validateInput(request)

      // 构建请求URL
      const url = `${this.baseUrl}/accurate_basic`

      // 构建请求体
      const requestBody = this.buildRequestBody(request)

      // 设置超时时间
      const timeoutMs = request.timeout || this.defaultTimeout

      this.logger.debug('开始高精度文字识别请求', {
        request: {
          inputType: request.image ? 'image' : 
                    request.url ? 'url' : 
                    request.pdfFile ? 'pdf' : 
                    request.ofdFile ? 'ofd' : 'unknown',
          languageType: request.languageType || '默认(中英混合)',
          detectDirection: request.detectDirection || false,
          paragraph: request.paragraph || false,
          probability: request.probability || false,
          multidirectional: request.multidirectionalRecognize || false,
          timeout: request.timeout || this.defaultTimeout,
          fileSize: request.image?.length || 
                   request.url?.length || 
                   request.pdfFile?.length || 
                   request.ofdFile?.length || 0
        }
      })
      const startTime = Date.now()

      // 发送HTTP请求
      const response = await firstValueFrom(
        this.httpService.post<AccurateOcrResponse>(url, requestBody, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Bearer ${request.apiKey}`,
          },
          timeout: timeoutMs,
        }).pipe(
          timeout(timeoutMs),
          catchError(error => {
            this.logger.error(`高精度OCR请求失败`, {
        error: {
          message: error.message,
          code: error.code,
          stack: error.stack
        },
        request: {
          inputType: request.image ? 'image' : 
                    request.url ? 'url' : 
                    request.pdfFile ? 'pdf' : 
                    request.ofdFile ? 'ofd' : 'unknown',
          timeout: request.timeout || this.defaultTimeout
        }
      })
            return throwError(() =>
              new HttpException(
                `高精度OCR服务请求失败: ${error.message}`,
                HttpStatus.BAD_GATEWAY,
              )
            )
          }),
        ),
      )

      // 检查响应数据
      if (!response.data) {
        this.logger.error('百度API返回空响应')
        throw new HttpException(
          '高精度OCR服务返回空响应',
          HttpStatus.BAD_GATEWAY,
        )
      }

      // 检查错误码
      if (response.data.error_code !== undefined && response.data.error_code !== 0) {
        const errorCode = response.data.error_code
        const errorMsg = response.data.error_msg || '未知错误'
        this.logger.error(`百度API返回错误: ${errorCode} - ${errorMsg}`)
        throw new HttpException(
          `高精度OCR失败: ${errorMsg} (错误码: ${errorCode})`,
          HttpStatus.BAD_REQUEST,
        )
      }

      const duration = Date.now() - startTime
      this.logger.debug('高精度OCR识别成功', {
        performance: {
          totalTime: `${duration}ms`,
          processingRate: response.data.words_result_num ? 
            `${Math.round(duration/response.data.words_result_num)}ms/字` : 'N/A'
        },
        result: {
          wordsCount: response.data.words_result_num,
          paragraphsCount: response.data.paragraphs_result_num,
          direction: response.data.direction,
          logId: response.data.log_id,
          firstWords: response.data.words_result?.slice(0, 3).map(w => w.words)
        }
      })

      // 记录请求日志
      if (requestId) {
        await this.requestLogger.saveRequestLog(
          requestId,
          { ...requestBody, image: '[REDACTED]' }, // 屏蔽敏感数据
          response.data,
          'baidu-accurate-ocr',
          {
            method: 'POST',
            url: url,
            statusCode: 200,
          },
        )
      }

      return response.data
    } catch (error) {
      if (error instanceof HttpException) {
        throw error
      }

      this.logger.error(`高精度OCR服务异常: ${error.message}`, error.stack)
      throw new HttpException(
        '高精度OCR服务内部错误',
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

  /**
   * 验证API Key格式
   * @param apiKey 百度API Key
   */
  private validateApiKey(apiKey: string): void {
    if (!apiKey || typeof apiKey !== 'string') {
      throw new HttpException(
        'API Key格式无效',
        HttpStatus.BAD_REQUEST,
      )
    }

    const apiKeyPattern = /^bce-v3\/ALTAK[a-zA-Z0-9\-_]+\/[a-zA-Z0-9\-_]+$/
    if (!apiKeyPattern.test(apiKey)) {
      throw new HttpException(
        'API Key格式无效,应为bce-v3/ALTAK-xxx/xxx格式',
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  /**
   * 验证输入参数
   * @param request 识别请求
   */
  private validateInput(request: AccurateOcrRequest): void {
    if (!request.image && !request.url && !request.pdfFile && !request.ofdFile) {
      throw new HttpException(
        '必须提供image、url、pdf_file或ofd_file中的一个',
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  /**
   * 构建请求体
   * @param request 识别请求
   * @returns 请求体
   */
  private buildRequestBody(request: AccurateOcrRequest): any {
    const body: any = {}

    if (request.image) {
      body.image = request.image
    } else if (request.url) {
      body.url = request.url
    } else if (request.pdfFile) {
      body.pdf_file = request.pdfFile
      if (request.fileNum) {
        body.pdf_file_num = request.fileNum
      }
    } else if (request.ofdFile) {
      body.ofd_file = request.ofdFile
      if (request.fileNum) {
        body.ofd_file_num = request.fileNum
      }
    }

    // 可选参数
    if (request.languageType) {
      body.language_type = request.languageType
    }
    if (request.detectDirection !== undefined) {
      body.detect_direction = request.detectDirection.toString()
    }
    if (request.paragraph !== undefined) {
      body.paragraph = request.paragraph.toString()
    }
    if (request.probability !== undefined) {
      body.probability = request.probability.toString()
    }
    if (request.multidirectionalRecognize !== undefined) {
      body.multidirectional_recognize = request.multidirectionalRecognize.toString()
    }

    return body
  }
}