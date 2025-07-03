import { ApiProperty } from '@nestjs/swagger';

/**
 * 统一响应格式接口
 */
export interface IApiResponse<T = any> {
  /** 请求ID，用于追踪请求 */
  requestId: string;
  /** 响应时间戳 */
  timestamp: number;
  /** 服务名称 */
  service: string;
  /** 响应码 */
  code: number;
  /** 响应体 */
  body: ResponseBody<T>;
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
  @ApiProperty({ description: '请求ID，用于追踪请求', example: 'req_1234567890' })
  requestId: string;

  @ApiProperty({ description: '响应时间戳', example: 1640995200000 })
  timestamp: number;

  @ApiProperty({ description: '服务名称', example: 'mzapi' })
  service: string;

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
    service = 'mzapi'
  ) {
    this.requestId = requestId || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.timestamp = Date.now();
    this.service = service;
    this.code = code;
    this.body = new ResponseBody(success, message, data, error);
  }

  /**
   * 创建成功响应
   */
  static success<T>(data?: T, message = '操作成功', code = 200, requestId?: string, service = 'mzapi'): ApiResponse<T> {
    return new ApiResponse(code, true, message, data, undefined, requestId, service);
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
    service = 'mzapi'
  ): ApiResponse<T> {
    const error = errorCode ? { code: errorCode, details: errorDetails } : undefined;
    return new ApiResponse(code, false, message, undefined, error, requestId, service);
  }

  /**
   * 创建业务错误响应
   */
  static businessError<T>(
    message: string,
    errorCode: string,
    errorDetails?: any,
    requestId?: string,
    service = 'mzapi'
  ): ApiResponse<T> {
    return new ApiResponse(400, false, message, undefined, { code: errorCode, details: errorDetails }, requestId, service);
  }

  /**
   * 创建验证错误响应
   */
  static validationError<T>(
    message: string,
    validationDetails?: any,
    requestId?: string,
    service = 'mzapi'
  ): ApiResponse<T> {
    return new ApiResponse(400, false, message, undefined, { code: 'VALIDATION_ERROR', details: validationDetails }, requestId, service);
  }

  /**
   * 创建未授权响应
   */
  static unauthorized<T>(message = '未授权访问', requestId?: string, service = 'mzapi'): ApiResponse<T> {
    return new ApiResponse(401, false, message, undefined, { code: 'UNAUTHORIZED' }, requestId, service);
  }

  /**
   * 创建禁止访问响应
   */
  static forbidden<T>(message = '禁止访问', requestId?: string, service = 'mzapi'): ApiResponse<T> {
    return new ApiResponse(403, false, message, undefined, { code: 'FORBIDDEN' }, requestId, service);
  }

  /**
   * 创建资源未找到响应
   */
  static notFound<T>(message = '资源未找到', requestId?: string, service = 'mzapi'): ApiResponse<T> {
    return new ApiResponse(404, false, message, undefined, { code: 'NOT_FOUND' }, requestId, service);
  }
}