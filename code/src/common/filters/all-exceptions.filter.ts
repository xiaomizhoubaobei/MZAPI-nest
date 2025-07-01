import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiResponse } from '../dto/response.dto';

/**
 * 全局异常过滤器
 * 捕获所有未处理的异常并返回统一格式的错误响应
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    
    // 获取请求ID
    const requestId = request.headers['x-request-id'] as string || 
                     request.headers['request-id'] as string;

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = '服务器内部错误';
    let errorCode = 'INTERNAL_SERVER_ERROR';
    let errorDetails: any;

    // 处理HTTP异常
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = exception.message;
      errorCode = 'HTTP_EXCEPTION';
      
      const exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === 'object') {
        const responseObj = exceptionResponse as any;
        if (responseObj.message) {
          message = Array.isArray(responseObj.message) 
            ? responseObj.message.join(', ') 
            : responseObj.message;
        }
        if (responseObj.error) {
          errorCode = responseObj.error;
        }
        errorDetails = responseObj;
      }
    } 
    // 处理其他类型的异常
    else if (exception instanceof Error) {
      message = exception.message || '未知错误';
      errorCode = exception.name || 'UNKNOWN_ERROR';
      errorDetails = {
        stack: exception.stack,
      };
    }
    // 处理非Error类型的异常
    else {
      message = '未知异常';
      errorCode = 'UNKNOWN_EXCEPTION';
      errorDetails = {
        exception: String(exception),
      };
    }

    // 记录错误日志
    this.logger.error(
      `Unhandled Exception: ${status} - ${message}`,
      {
        requestId,
        url: request.url,
        method: request.method,
        userAgent: request.headers['user-agent'],
        ip: request.ip,
        exception: exception instanceof Error ? exception.stack : String(exception),
      }
    );

    // 创建统一错误响应
    const errorResponse = ApiResponse.error(
      message,
      status,
      errorCode,
      errorDetails,
      requestId
    );

    response.status(status).json(errorResponse);
  }
}