/**
 * 百度AI服务模块导出文件
 * 提供百度AI平台的完整解决方案，包括鉴权和各种AI服务
 */

// 鉴权相关
export * from './uilts';

// 地址识别服务
export {
  BaiduAddressRecognitionService,
  AddressRecognitionRequest,
  AddressRecognitionResponse,
  AddressRecognitionResult
} from './address-recognition.service';

export {
  BaiduAddressRecognitionController,
  SingleAddressRecognitionDto,
  AddressRecognitionResponseDto
} from './address-recognition.controller';

export { BaiduAddressRecognitionModule } from './address-recognition.module';