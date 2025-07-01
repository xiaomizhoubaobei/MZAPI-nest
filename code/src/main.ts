import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { ResponseInterceptor, HttpExceptionFilter, AllExceptionsFilter } from './common';
import * as compression from 'compression';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 启用gzip压缩
  app.use(compression({
    filter: () => true, // 对所有响应启用压缩
    threshold: 0, // 压缩所有大小的响应
  }));

  // 启用全局验证管道
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }));

  // 注册全局响应拦截器
  app.useGlobalInterceptors(new ResponseInterceptor());

  // 注册全局异常过滤器
  app.useGlobalFilters(new AllExceptionsFilter(), new HttpExceptionFilter());

  // 启用CORS
  app.enableCors({
    origin: '*',
    methods: 'GET,PUT,POST',
    credentials: true,
    allowedHeaders: '*', // 允许所有自定义头部穿透
    exposedHeaders: '*', // 暴露所有响应头部给客户端
    maxAge: 600, // 预检请求缓存时间（秒）
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