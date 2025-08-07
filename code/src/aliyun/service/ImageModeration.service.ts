import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
const RPCClient = require("@alicloud/pop-core");
import { ImageModerationDto } from '../DTO';
import {AliyunValidationUtils} from "../../utils/validation.utils";

@Injectable()
/**
 * 阿里云图片内容审核服务
 */
export class ImageModerationService {
    private readonly logger = new Logger(ImageModerationService.name);
    /**
     * 执行图片内容审核
     * @param params - 包含阿里云认证信息和图片URL的数据传输对象
     * @returns 返回阿里云内容安全API的审核结果
     * @throws {Error} 当API调用失败时抛出错误
     */
    async imageModeration(params: ImageModerationDto) {
        // 每次请求时创建新的客户端实例
        const client = new RPCClient({
            accessKeyId: params.accessKeyId,
            accessKeySecret: params.accessKeySecret,
            endpoint: params.endpoint,
            apiVersion: '2022-03-02',
        });

        // 验证service类型
        AliyunValidationUtils.validateServiceType(params.service);

        // 验证必传参数
        AliyunValidationUtils.validateRequiredParams({
            accessKeyId: params.accessKeyId,
            accessKeySecret: params.accessKeySecret,
            endpoint: params.endpoint
        });
        
        // 检查imageUrl是否存在
        AliyunValidationUtils.validateImageUrl(params.imageUrl);

        const requestParams = {
            Service: params.service || 'baselineCheck',
            ServiceParameters: JSON.stringify({
                dataId: uuidv4(),
                imageUrl: params.imageUrl
            })
        };

        const requestOption = {
            method: 'POST',
            formatParams: false,
        };

        try {
            this.logger.debug(`开始调用阿里云内容安全API，服务类型: ${params.service}`);
            this.logger.verbose(`请求参数: ${JSON.stringify(requestParams)}`);
            
            const result = await client.request('ImageModeration', requestParams, requestOption);
            
            this.logger.debug(`阿里云API调用成功，服务类型: ${params.service}`);
            this.logger.verbose(`返回结果: ${JSON.stringify(result)}`);
            
            return result;
        } catch (error) {
            this.logger.error(`阿里云内容安全API调用失败: ${error.message}`, error.stack);
            throw new Error('阿里云内容安全API调用失败: ' + error.message);
        }
    }
}