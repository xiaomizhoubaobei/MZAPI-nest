import { BadRequestException } from '@nestjs/common';

/**
 * 阿里云服务参数验证工具类
 */
export class AliyunValidationUtils {
    /**
     * 支持的阿里云服务类型列表
     */
    private static readonly VALID_SERVICES = [
        'baselineCheck',
        'baselineCheck_pro',
        'baselineCheck_cb',
        'tonalityImprove',
        'tonalityImprove_cb',
        'aigcCheck',
        'aigcCheck_cb',
        'profilePhotoCheck',
        'postImageCheck',
        'advertisingCheck',
        'liveStreamCheck',
        'riskDetection',
        'riskDetection_cb'
    ];

    /**
     * 验证必填参数是否存在
     * @param params - 包含阿里云认证参数的对象
     * @param params.accessKeyId - 阿里云访问密钥ID
     * @param params.accessKeySecret - 阿里云访问密钥
     * @param params.endpoint - 阿里云服务端点
     * @throws {Error} 当缺少必填参数时抛出错误
     */
    static validateRequiredParams(params: {
        accessKeyId?: string;
        accessKeySecret?: string;
        endpoint?: string;
    }) {
        const missingParams = [
            !params.accessKeyId && 'accessKeyId',
            !params.accessKeySecret && 'accessKeySecret',
            !params.endpoint && 'endpoint'
        ].filter(Boolean);

        if (missingParams.length > 0) {
            throw new BadRequestException(`缺少必填参数: ${missingParams.join(', ')}`);
        }
    }

    /**
     * 验证服务类型是否在支持列表中
     * @param service - 要验证的服务类型名称
     * @throws {BadRequestException} 当服务类型不支持时抛出异常
     */
    static validateServiceType(service: string) {
        if (!this.VALID_SERVICES.includes(service)) {
            throw new BadRequestException(`不支持的service类型: ${service}`);
        }
    }

    /**
     * 验证图片URL参数是否存在
     * @param imageUrl - 要验证的图片URL
     * @throws {Error} 当图片URL不存在时抛出错误
     */
    static validateImageUrl(imageUrl?: string) {
        if (!imageUrl) {
            throw new Error('参数中必须包含imageUrl');
        }
    }
}