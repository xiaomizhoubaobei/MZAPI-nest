/**
 * 百度AI鉴权模块导出文件
 * 提供百度AI平台的完整鉴权解决方案
 */

// 核心服务
export { BaiduAuthService, BaiduAuthConfig, BaiduTokenResponse } from './auth.service';
export { BaiduAuthConfigService, BAIDU_SERVICE_NAMES, BaiduServiceName } from './auth.config';

// 装饰器和拦截器
export { BaiduAuth, BaiduToken, BaiduConfig, BAIDU_AUTH_SERVICE_KEY } from './auth.decorator';
export { BaiduAuthInterceptor } from './auth.interceptor';

// 模块
export { BaiduAuthModule } from './auth.module';
