import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 启用全局验证管道
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }));

  // 启用CORS
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Swagger API文档配置
  const config = new DocumentBuilder()
    .setTitle('MZAPI - 百度AI服务接口')
    .setDescription('提供百度AI平台的完整解决方案，包括地址识别等服务')
    .setVersion('1.0.0')
    .addTag('baidu', '百度AI服务')
    .addTag('address-recognition', '地址识别服务')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  console.log(`🚀 应用已启动在端口 ${port}`);
  console.log(`📚 API文档地址: http://localhost:${port}/api`);
}

bootstrap();