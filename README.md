# Nest API 项目

这是一个基于NestJS框架构建的API服务项目。

## 项目结构

- `code/` - 主项目代码目录
  - `src/` - 源代码目录
    - `aliyun/` - 阿里云相关模块
    - `interceptors/` - 拦截器实现
    - `utils/` - 工具类
  - `test/` - 测试代码

## 快速开始

1.安装依赖:
```bash
cd code
npm install
```

2.运行开发服务器:
```bash
npm run start:dev
```

3.生产环境构建:
```bash
npm run build
npm run start:prod
```

## 环境配置

复制`.env.example`为`.env`并配置相关环境变量。

## 项目特性

- 阿里云服务集成
- 多种HTTP拦截器实现
- 类型安全的DTO验证