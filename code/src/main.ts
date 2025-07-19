import { ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'

import * as compression from 'compression'
import { AppModule } from './app.module'
import { ResponseInterceptor, HttpExceptionFilter, AllExceptionsFilter } from './common'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  // 启用gzip压缩
  app.use(compression({
    filter: () => true, // 对所有响应启用压缩
    threshold: 0, // 压缩所有大小的响应
  }))

  // 启用全局验证管道
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  )

  // 注册全局响应拦截器
  app.useGlobalInterceptors(new ResponseInterceptor())

  // 注册全局异常过滤器
  app.useGlobalFilters(new AllExceptionsFilter(), new HttpExceptionFilter())

  // 启用CORS
  app.enableCors({
    origin: '*',
    methods: 'GET,PUT,POST',
    credentials: true,
    allowedHeaders: '*', // 允许所有自定义头部穿透
    exposedHeaders: '*', // 暴露所有响应头部给客户端
    maxAge: 600, // 预检请求缓存时间（秒）
  })



  const port = process.env.PORT || 3000
  await app.listen(port)

  console.log(`🚀 应用已启动在端口 ${port}`)

}

bootstrap()
