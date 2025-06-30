import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

/**
 * 百度AI鉴权配置接口
 */
export interface BaiduAuthConfig {
  /** 应用的API Key */
  apiKey: string;
  /** 应用的Secret Key */
  secretKey: string;
  /** 应用的App ID */
  appId?: string;
}

/**
 * 百度AI Access Token响应接口
 */
export interface BaiduTokenResponse {
  /** 访问令牌 */
  access_token: string;
  /** 令牌类型，固定为Bearer */
  token_type: string;
  /** 令牌有效期，单位秒 */
  expires_in: number;
  /** 权限范围 */
  scope: string;
  /** 刷新令牌 */
  refresh_token?: string;
  /** 会话密钥 */
  session_key?: string;
  /** 会话密钥有效期 */
  session_secret?: string;
}

/**
 * 百度AI鉴权服务
 * 负责管理百度AI平台的访问令牌获取和刷新
 */
@Injectable()
export class BaiduAuthService {
  private readonly TOKEN_URL = 'https://aip.baidubce.com/oauth/2.0/token';
  private tokenCache: Map<string, { token: string; expiresAt: number }> = new Map();

  constructor(private readonly httpService: HttpService) {}

  /**
   * 获取访问令牌
   * @param config 百度AI鉴权配置
   * @param forceRefresh 是否强制刷新令牌
   * @returns Promise<string> 访问令牌
   */
  async getAccessToken(config: BaiduAuthConfig, forceRefresh = false): Promise<string> {
    const cacheKey = `${config.apiKey}_${config.secretKey}`;
    const cached = this.tokenCache.get(cacheKey);

    // 检查缓存是否有效（提前5分钟过期）
    if (!forceRefresh && cached && cached.expiresAt > Date.now() + 5 * 60 * 1000) {
      return cached.token;
    }

    try {
      const response = await firstValueFrom(
        this.httpService.post<BaiduTokenResponse>(
          this.TOKEN_URL,
          null,
          {
            params: {
              grant_type: 'client_credentials',
              client_id: config.apiKey,
              client_secret: config.secretKey,
            },
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
          }
        )
      );

      const tokenData = response.data;
      
      if (!tokenData.access_token) {
        throw new HttpException(
          '获取百度AI访问令牌失败：响应中缺少access_token',
          HttpStatus.UNAUTHORIZED
        );
      }

      // 缓存令牌
      const expiresAt = Date.now() + (tokenData.expires_in * 1000);
      this.tokenCache.set(cacheKey, {
        token: tokenData.access_token,
        expiresAt,
      });

      return tokenData.access_token;
    } catch (error) {
      if (error.response) {
        const errorData = error.response.data;
        throw new HttpException(
          `百度AI鉴权失败: ${errorData.error_description || errorData.error || '未知错误'}`,
          HttpStatus.UNAUTHORIZED
        );
      }
      throw new HttpException(
        `百度AI鉴权请求失败: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}