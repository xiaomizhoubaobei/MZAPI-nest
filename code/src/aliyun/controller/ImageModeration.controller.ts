import { Controller, Post, Body, Headers } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { ImageModerationService } from '../service';
import { ImageModerationDto } from '../DTO';

@Controller('aliyun')
/**
 * 阿里云图片内容审核控制器
 */
export class ImageModerationController {
    private readonly logger = new Logger(ImageModerationController.name);
    
    /**
     * 构造函数
     * @param imageModerationService - 图片审核服务实例
     */
    constructor(private readonly imageModerationService: ImageModerationService) {}

    /**
     * 处理图片内容审核请求
     * @param imageModerationDto - 包含图片审核参数的数据传输对象
     * @param headers - 请求头信息
     * @returns 返回图片审核结果
     */
    @Post('image-moderation')
    async imageModeration(@Body() imageModerationDto: ImageModerationDto, @Headers() headers: Record<string, string>) {
        this.logger.log(`收到图片审核请求，服务类型: ${imageModerationDto.service}`);
        this.logger.debug(`请求头信息: ${JSON.stringify(headers)}`);
        try {
            const result = await this.imageModerationService.imageModeration(imageModerationDto);
            this.logger.debug(`图片审核完成，服务类型: ${imageModerationDto.service}`);
            return result;
        } catch (error) {
            this.logger.error(`图片审核失败: ${error.message}`, error.stack);
            throw error;
        }
    }
}