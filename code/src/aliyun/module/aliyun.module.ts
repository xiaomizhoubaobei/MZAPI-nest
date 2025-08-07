import { Module } from '@nestjs/common';
import { ImageModerationController } from '../controller';
import { ImageModerationService } from '../service';

@Module({
    controllers: [ImageModerationController],
    providers: [ImageModerationService],
})
export class AliyunModule {}