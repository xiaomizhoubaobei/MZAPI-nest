import { SetMetadata, createParamDecorator, ExecutionContext } from '@nestjs/common'
import { BaiduServiceName } from './auth.config'

/**
 * 百度AI鉴权元数据键
 */
export const BAIDU_AUTH_SERVICE_KEY = 'baidu_auth_service'

/**
 * 百度AI鉴权装饰器
 * 用于标记需要百度AI鉴权的控制器或方法
 * @param serviceName 百度AI服务名称
 */
export const BaiduAuth = (serviceName: BaiduServiceName) => SetMetadata(BAIDU_AUTH_SERVICE_KEY, serviceName)

/**
 * 百度AI访问令牌参数装饰器
 * 用于在控制器方法中注入当前的访问令牌
 */
export const BaiduToken = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest()
    return request.baiduAccessToken
  },
)

/**
 * 百度AI配置参数装饰器
 * 用于在控制器方法中注入当前的配置信息
 */
export const BaiduConfig = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest()
    return request.baiduConfig
  },
)
