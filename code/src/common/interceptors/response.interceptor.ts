import { Injectable, NestInterceptor, ExecutionContext, CallHandler, HttpStatus } from '@nestjs/common'
import * as crypto from 'crypto'
import { Request, Response } from 'express'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import { ApiResponse } from '../dto/response.dto'
import { HashSigner } from '../utils/hash-signer'

const ONE_DAY_IN_MILLISECONDS = 86400000
const COMMON_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: 'lax' as const,
  domain: '.mizhoubaobei.top',
  maxAge: ONE_DAY_IN_MILLISECONDS,
  path: '/',
}

/**
 * 统一响应格式拦截器
 * 自动将所有控制器返回的数据包装为统一的响应格式
 */
@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    const ctx = context.switchToHttp()
    const request = ctx.getRequest<Request>()
    const response = ctx.getResponse<Response>()

    // 获取请求ID（如果有的话）
    const requestId = request.headers['x-fc-request-id'] as string

    // 获取服务端IP（从x-forwarded-for头部）
    const forwardedFor = request.headers['x-forwarded-for'] as string
    const serverIp = this.extractServerIp(forwardedFor)

    // eo-client-ip头部获取
    const clientIp = request.headers['eo-client-ip'] as string

    return next.handle().pipe(
      map(data => {
        // 设置禁止缓存的头部
        response.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
        response.setHeader('Pragma', 'no-cache')
        response.setHeader('Expires', new Date(0).toUTCString())

        // 设置Content-Language头部表示中文
        response.setHeader('Content-Language', 'zh-CN')

        // 设置Accept-CH头部请求设备内存和用户代理信息
        response.setHeader(
          'Accept-CH',
          [
            'Device-Memory',
            'Sec-CH-UA',
            'Sec-CH-UA-Arch',
            'Sec-CH-UA-Full-Version-List',
            'Sec-CH-UA-Model',
            'Sec-CH-UA-Platform',
            'Sec-CH-UA-Platform-Version',
            'Sec-CH-UA-WoW64',
          ].join(', '),
        )

        // 设置用户IP到cookies
        if (clientIp) {
          response.setHeader('X-Client-IP', clientIp)
          response.cookie('clientIp', clientIp, COMMON_COOKIE_OPTIONS)
        }

        // 设置服务端IP到cookies
        if (serverIp) {
          response.cookie('serverIp', serverIp, COMMON_COOKIE_OPTIONS)
        }

        // 计算并设置Content-Digest头部
        const responseData = data ? JSON.stringify(data) : ''
        const sha512Hash = crypto.createHash('sha512').update(responseData).digest('base64')
        response.setHeader('Content-Digest', `sha-512=:${sha512Hash}:`)

        // 使用HashSigner生成随机哈希签名并添加到响应头部
        const randomSignatures = HashSigner.signDataWithRandomHashes(responseData, 6)
        for (const algorithm in randomSignatures) {
          response.setHeader(`X-Hash-${algorithm.toUpperCase()}`, randomSignatures[algorithm])
        }

        // 使用HashSigner生成随机哈希签名并添加到cookies
        for (const algorithm in randomSignatures) {
          response.cookie(`X-Hash-${algorithm.toUpperCase()}`, randomSignatures[algorithm], COMMON_COOKIE_OPTIONS)
        }

        //添加requestId，如果不存在则生成一个
        const finalRequestId = requestId || crypto.randomUUID()
        response.setHeader('X-Request-Id', finalRequestId)

        //服务端IP到响应头部
        if (serverIp) {
          response.setHeader('X-Server-IP', serverIp)
        }

        // 客户端IP到响应头部
        if (clientIp) {
          response.setHeader('X-Client-IP', clientIp)
        }

        // 如果返回的数据已经是ApiResponse格式，直接返回
        if (
          data && typeof data === 'object' && 'requestId' in data && 'timestamp' in data && 'service' in data &&
          'code' in data && 'body' in data
        ) {
          return data as ApiResponse<T>
        }

        // 获取HTTP状态码
        const statusCode = response.statusCode || HttpStatus.OK

        // 根据状态码判断是否成功
        const isSuccess = statusCode >= 200 && statusCode < 300

        // 设置响应消息
        let message = '操作成功'
        if (!isSuccess) {
          message = this.getErrorMessage(statusCode)
        }

        // 包装为统一响应格式
        return ApiResponse.success(data, message, statusCode, requestId)
      }),
    )
  }

  /**
   * 从x-forwarded-for头部提取服务端IP
   */
  private extractServerIp(forwardedFor?: string): string | undefined {
    if (!forwardedFor) {
      return undefined
    }

    // x-forwarded-for格式: client, proxy1, proxy2, ..., server
    // 最后一个IP通常是服务端IP
    const ips = forwardedFor.split(',').map(ip => ip.trim())
    return ips.length > 0 ? ips[ips.length - 1] : undefined
  }

  /**
   * 根据状态码获取错误消息
   */
  private getErrorMessage(statusCode: number): string {
    switch (statusCode) {
      case HttpStatus.BAD_REQUEST:
        return '请求参数错误'
      case HttpStatus.UNAUTHORIZED:
        return '未授权访问'
      case HttpStatus.FORBIDDEN:
        return '禁止访问'
      case HttpStatus.NOT_FOUND:
        return '资源未找到'
      case HttpStatus.INTERNAL_SERVER_ERROR:
        return '服务器内部错误'
      default:
        return '操作失败'
    }
  }
}
