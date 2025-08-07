import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AliyunModule } from './aliyun';
import {
    CdnEdgeoneProxyInterceptor,
    PostOnlyInterceptor,
    NoCacheInterceptor,
    ContentDigestInterceptor,
    ContentLanguageInterceptor,
    ServerTimingInterceptor,
    GzipInterceptor
} from './interceptors';

@Module({
    imports: [AliyunModule],
    providers: [
        {
            provide: APP_INTERCEPTOR,
            useClass: CdnEdgeoneProxyInterceptor,
        },
        {
            provide: APP_INTERCEPTOR,
            useClass: PostOnlyInterceptor,
        },
        {
            provide: APP_INTERCEPTOR,
            useClass: NoCacheInterceptor,
        },
        {
            provide: APP_INTERCEPTOR,
            useClass: ContentDigestInterceptor,
        },
        {
            provide: APP_INTERCEPTOR,
            useClass: ContentLanguageInterceptor,
        },
        {
            provide: APP_INTERCEPTOR,
            useClass: ServerTimingInterceptor,
        },
        {
            provide: APP_INTERCEPTOR,
            useClass: GzipInterceptor,
        },
    ],
})
export class AppModule {}