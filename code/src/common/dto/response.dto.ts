import { ApiProperty } from '@nestjs/swagger';

/**
 * 统一响应格式接口
 */
export interface IApiResponse<T = any> {
  /** 响应头部信息 */
  header: ResponseHeader;
  /** 响应码 */
  code: number;
  /** 响应体 */
  body: ResponseBody<T>;
}

/**
 * 响应头部信息
 */
export class ResponseHeader {
  @ApiProperty({ description: '请求ID，用于追踪请求', example: 'req_1234567890' })
  requestId: string;

  @ApiProperty({ description: '响应时间戳', example: 1640995200000 })
  timestamp: number;

  @ApiProperty({ description: '服务名称', example: 'mzapi' })
  service: string;

  @ApiProperty({ description: 'SHA256哈希值，用于数据完整性验证', example: 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', required: false })
  sha256?: string;

  @ApiProperty({ description: 'SHA512哈希值，用于数据完整性验证', example: 'b109f3bbbc244eb82441917ed06d618b9008dd09b3befd1b5e07394c706a8bb980b1d7785e5976ec049b46df5f1326af5a2ea6d103fd07c95385ffab0cacbc86', required: false })
  sha512?: string;

  @ApiProperty({ description: 'MD5哈希值，用于数据完整性验证', example: '5d41402abc4b2a76b9719d911017c592', required: false })
  md5?: string;

  constructor(requestId?: string, service = 'mzapi', sha256?: string, sha512?: string, md5?: string) {
    this.requestId = requestId || this.generateRequestId();
    this.timestamp = Date.now();
    this.service = service;
    this.sha256 = sha256;
    this.sha512 = sha512;
    this.md5 = md5;
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * 响应体
 */
export class ResponseBody<T = any> {
  @ApiProperty({ description: '是否成功', example: true })
  success: boolean;

  @ApiProperty({ description: '响应消息', example: '操作成功' })
  message: string;

  @ApiProperty({ description: '响应数据' })
  data?: T;

  @ApiProperty({ description: '错误详情（仅在失败时返回）' })
  error?: {
    code: string;
    details?: any;
  };

  constructor(success: boolean, message: string, data?: T, error?: { code: string; details?: any }) {
    this.success = success;
    this.message = message;
    this.data = data;
    this.error = error;
  }
}

/**
 * 统一API响应类
 */
export class ApiResponse<T = any> implements IApiResponse<T> {
  @ApiProperty({ description: '响应头部信息' })
  header: ResponseHeader;

  @ApiProperty({ description: '响应码', example: 200 })
  code: number;

  @ApiProperty({ description: '响应体' })
  body: ResponseBody<T>;

  constructor(
    code: number,
    success: boolean,
    message: string,
    data?: T,
    error?: { code: string; details?: any },
    requestId?: string,
    sha256?: string,
    sha512?: string,
    md5?: string
  ) {
    this.header = new ResponseHeader(requestId, 'mzapi', sha256, sha512, md5);
    this.code = code;
    this.body = new ResponseBody(success, message, data, error);
  }

  /**
   * 创建成功响应
   */
  static success<T>(data?: T, message = '操作成功', code = 200, requestId?: string, sha256?: string, sha512?: string, md5?: string): ApiResponse<T> {
    return new ApiResponse(code, true, message, data, undefined, requestId, sha256, sha512, md5);
  }

  /**
   * 创建失败响应
   */
  static error<T>(
    message: string,
    code = 500,
    errorCode?: string,
    errorDetails?: any,
    requestId?: string,
    sha256?: string,
    sha512?: string,
    md5?: string
  ): ApiResponse<T> {
    const error = errorCode ? { code: errorCode, details: errorDetails } : undefined;
    return new ApiResponse(code, false, message, undefined, error, requestId, sha256, sha512, md5);
  }

  /**
   * 创建业务错误响应
   */
  static businessError<T>(
    message: string,
    errorCode: string,
    errorDetails?: any,
    requestId?: string,
    sha256?: string,
    sha512?: string,
    md5?: string
  ): ApiResponse<T> {
    return new ApiResponse(400, false, message, undefined, { code: errorCode, details: errorDetails }, requestId, sha256, sha512, md5);
  }

  /**
   * 创建验证错误响应
   */
  static validationError<T>(
    message: string,
    validationDetails?: any,
    requestId?: string,
    sha256?: string,
    sha512?: string,
    md5?: string
  ): ApiResponse<T> {
    return new ApiResponse(400, false, message, undefined, { code: 'VALIDATION_ERROR', details: validationDetails }, requestId, sha256, sha512, md5);
  }

  /**
   * 创建未授权响应
   */
  static unauthorized<T>(message = '未授权访问', requestId?: string, sha256?: string, sha512?: string, md5?: string): ApiResponse<T> {
    return new ApiResponse(401, false, message, undefined, { code: 'UNAUTHORIZED' }, requestId, sha256, sha512, md5);
  }

  /**
   * 创建禁止访问响应
   */
  static forbidden<T>(message = '禁止访问', requestId?: string, sha256?: string, sha512?: string, md5?: string): ApiResponse<T> {
    return new ApiResponse(403, false, message, undefined, { code: 'FORBIDDEN' }, requestId, sha256, sha512, md5);
  }

  /**
   * 创建资源未找到响应
   */
  static notFound<T>(message = '资源未找到', requestId?: string, sha256?: string, sha512?: string, md5?: string): ApiResponse<T> {
    return new ApiResponse(404, false, message, undefined, { code: 'NOT_FOUND' }, requestId, sha256, sha512, md5);
  }
}