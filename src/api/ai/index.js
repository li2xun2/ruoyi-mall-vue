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
  }),
  
  // 获取FAQ列表
  getFaqs: (params) => request({
    url: '/api/ai/faqs/list',
    method: 'post',
    data: {
      keyword: params.keyword
    },
    params: {
      page: params.page,
      size: params.size
    }
  }),
  
  // 获取单个FAQ
  getFaq: (id) => request({
    url: `/api/ai/faqs/${id}`,
    method: 'get'
  }),
  
  // 创建FAQ
  createFaq: (faq) => request({
    url: '/api/ai/faqs',
    method: 'post',
    data: faq
  }),
  
  // 更新FAQ
  updateFaq: (id, faq) => request({
    url: `/api/ai/faqs/${id}`,
    method: 'put',
    data: faq
  }),
  
  // 删除FAQ
  deleteFaq: (id) => request({
    url: `/api/ai/faqs/${id}`,
    method: 'delete'
  })
}

export default aiApi
