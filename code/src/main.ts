import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
    const app = await NestFactory.create(AppModule, {
        logger: ['log', 'error', 'warn', 'debug', 'verbose']
    });
    
    const port = 3000;
    await app.listen(port);
    console.log(`应用程序正在运行: http://localhost:${port}`);
}

bootstrap().catch(error => {
    const logger = new Logger('Bootstrap');
    logger.error('启动应用程序失败', error.stack);
    process.exit(1);
});