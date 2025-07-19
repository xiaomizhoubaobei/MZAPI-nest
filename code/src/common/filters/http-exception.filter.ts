import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common'
import { Request, Response } from 'express'
import { ApiResponse } from '../dto/response.dto'

/**
 * HTTP异常过滤器
 * 统一处理HTTP异常并返回标准格式的错误响应
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name)

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<Request>()
    const status = exception.getStatus()

    // 获取请求ID
    const requestId = request.headers['x-request-id'] as string ||
      request.headers['request-id'] as string

    // 获取异常响应内容
    const exceptionResponse = exception.getResponse()
    let message = exception.message
    let errorCode = 'HTTP_EXCEPTION'
    let errorDetails: any

    // 处理不同类型的异常响应
    if (typeof exceptionResponse === 'object') {
      const responseObj = exceptionResponse as any

      // 处理验证错误
      if (responseObj.message && Array.isArray(responseObj.message)) {
        message = '请求参数验证失败'
        errorCode = 'VALIDATION_ERROR'
        errorDetails = {
          validationErrors: responseObj.message,
          error: responseObj.error,
        }
      } else if (responseObj.message) {
        message = Array.isArray(responseObj.message) ? responseObj.message.join(', ') : responseObj.message
      }

      if (responseObj.error) {
        errorCode = responseObj.error
      }
    }

    // 记录错误日志
    this.logger.error(
      `HTTP Exception: ${status} - ${message}`,
      {
        requestId,
        url: request.url,
        method: request.method,
        userAgent: request.headers['user-agent'],
        ip: request.ip,
        exception: exception.stack,
      },
    )

    // 处理405 Method Not Allowed错误，添加Allow头部
    if (status === HttpStatus.METHOD_NOT_ALLOWED) {
      response.setHeader('Allow', 'GET, PUT, POST')
    }

    // 创建统一错误响应
    const errorResponse = this.createErrorResponse(status, message, errorCode, errorDetails, requestId)

    response.status(status).json(errorResponse)
  }

  /**
   * 创建错误响应
   */
  private createErrorResponse(
    status: number,
    message: string,
    errorCode: string,
    errorDetails?: any,
    requestId?: string,
  ): ApiResponse<null> {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return ApiResponse.businessError(message, errorCode, errorDetails, requestId)
      case HttpStatus.UNAUTHORIZED:
        return ApiResponse.unauthorized(message, requestId)
      case HttpStatus.FORBIDDEN:
        return ApiResponse.forbidden(message, requestId)
      case HttpStatus.NOT_FOUND:
        return ApiResponse.notFound(message, requestId)
      case HttpStatus.METHOD_NOT_ALLOWED:
        return ApiResponse.error('方法不被允许', status, 'METHOD_NOT_ALLOWED', errorDetails, requestId)
      default:
        return ApiResponse.error(message, status, errorCode, errorDetails, requestId)
    }
  }
}
