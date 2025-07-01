import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

/**
 * 请求日志数据接口
 */
export interface RequestLogData {
  /** 请求ID */
  requestId: string;
  /** 请求体 */
  requestBody: any;
  /** 响应体 */
  responseBody: any;
  /** API名称 */
  apiName: string;
  /** 请求时间戳 */
  timestamp: string;
  /** 请求方法 */
  method?: string;
  /** 请求URL */
  url?: string;
  /** 状态码 */
  statusCode?: number;
}

/**
 * 请求日志工具类
 * 用于保存请求日志到指定目录
 */
@Injectable()
export class RequestLoggerUtil {
  private readonly baseLogPath = '/data/oss';

  /**
   * 保存请求日志
   * @param requestId 请求ID
   * @param requestBody 请求体
   * @param responseBody 响应体
   * @param apiName API名称
   * @param additionalData 额外数据（可选）
   */
  async saveRequestLog(
    requestId: string,
    requestBody: any,
    responseBody: any,
    apiName: string,
    additionalData?: Partial<RequestLogData>
  ): Promise<void> {
    try {
      // 构建日志数据
      const logData: RequestLogData = {
        requestId,
        requestBody,
        responseBody,
        apiName,
        timestamp: new Date().toISOString(),
        ...additionalData
      };

      // 构建文件路径
      const logDir = path.join(this.baseLogPath, apiName);
      const logFilePath = path.join(logDir, `${requestId}.json`);

      // 确保目录存在
      await this.ensureDirectoryExists(logDir);

      // 写入日志文件
      await fs.promises.writeFile(
        logFilePath,
        JSON.stringify(logData, null, 2),
        'utf8'
      );

      console.log(`Request log saved: ${logFilePath}`);
    } catch (error) {
      console.error('Failed to save request log:', error);
      // 不抛出错误，避免影响主业务流程
    }
  }

  /**
   * 确保目录存在，如果不存在则创建
   * @param dirPath 目录路径
   */
  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await fs.promises.access(dirPath);
    } catch {
      await fs.promises.mkdir(dirPath, { recursive: true });
    }
  }
}