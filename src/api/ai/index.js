import request from '@/utils/request'

// AI管理相关API
const aiApi = {
  // 获取AI状态
  getStatus: () => request({
    url: '/pyapi/ai/status',
    method: 'get',
    baseURL: '' // 直接使用绝对路径，绕过baseURL
  }),
  
  // 刷新AI索引
  refreshIndex: () => request({
    url: '/pyapi/ai/refresh',
    method: 'post',
    baseURL: '' // 直接使用绝对路径，绕过baseURL
  }),
  
  // 获取可用表
  getTables: () => request({
    url: '/pyapi/ai/tables',
    method: 'get',
    baseURL: '' // 直接使用绝对路径，绕过baseURL
  }),
  
  // 获取AI配置
  getConfig: () => request({
    url: '/pyapi/ai/config',
    method: 'get',
    baseURL: '' // 直接使用绝对路径，绕过baseURL
  }),
  
  // 保存AI配置
  saveConfig: (config) => request({
    url: '/pyapi/ai/config',
    method: 'post',
    data: config,
    baseURL: '' // 直接使用绝对路径，绕过baseURL
  })
}

export default aiApi
