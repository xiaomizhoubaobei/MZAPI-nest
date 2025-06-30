import { Injectable } from '@nestjs/common';
import { BaiduAuthConfig } from './auth.service';

/**
 * 百度AI鉴权配置管理类
 * 用于管理不同百度AI服务的配置信息
 */
@Injectable()
export class BaiduAuthConfigService {
  private configs: Map<string, BaiduAuthConfig> = new Map();

  /**
   * 注册百度AI服务配置
   * @param serviceName 服务名称（如：ocr, nlp, speech等）
   * @param config 鉴权配置
   */
  registerConfig(serviceName: string, config: BaiduAuthConfig): void {
    this.configs.set(serviceName, config);
  }

  /**
   * 获取指定服务的配置
   * @param serviceName 服务名称
   * @returns 鉴权配置或undefined
   */
  getConfig(serviceName: string): BaiduAuthConfig | undefined {
    return this.configs.get(serviceName);
  }

  /**
   * 获取所有已注册的服务名称
   * @returns 服务名称数组
   */
  getRegisteredServices(): string[] {
    return Array.from(this.configs.keys());
  }

  /**
   * 移除指定服务的配置
   * @param serviceName 服务名称
   * @returns 是否成功移除
   */
  removeConfig(serviceName: string): boolean {
    return this.configs.delete(serviceName);
  }

  /**
   * 清除所有配置
   */
  clearAllConfigs(): void {
    this.configs.clear();
  }

  /**
   * 从环境变量创建配置
   * @param serviceName 服务名称
   * @param apiKeyEnv API Key环境变量名
   * @param secretKeyEnv Secret Key环境变量名
   * @param appIdEnv App ID环境变量名（可选）
   */
  createConfigFromEnv(
    serviceName: string,
    apiKeyEnv: string,
    secretKeyEnv: string,
    appIdEnv?: string
  ): void {
    const apiKey = process.env[apiKeyEnv];
    const secretKey = process.env[secretKeyEnv];
    const appId = appIdEnv ? process.env[appIdEnv] : undefined;

    if (!apiKey || !secretKey) {
      throw new Error(
        `百度AI配置错误: 环境变量 ${apiKeyEnv} 和 ${secretKeyEnv} 必须设置`
      );
    }

    this.registerConfig(serviceName, {
      apiKey,
      secretKey,
      appId,
    });
  }
}

/**
 * 百度AI服务配置常量
 */
export const BAIDU_SERVICE_NAMES = {
  /** 文字识别OCR */
  OCR: 'ocr',
  /** 自然语言处理NLP */
  NLP: 'nlp',
  /** 语音技术 */
  SPEECH: 'speech',
  /** 图像技术 */
  IMAGE: 'image',
  /** 人脸识别 */
  FACE: 'face',
  /** 人体分析 */
  BODY: 'body',
  /** 视频技术 */
  VIDEO: 'video',
  /** 增强现实AR */
  AR: 'ar',
  /** 知识图谱 */
  KG: 'kg',
  /** 机器翻译 */
  MT: 'mt',
} as const;

export type BaiduServiceName = typeof BAIDU_SERVICE_NAMES[keyof typeof BAIDU_SERVICE_NAMES];