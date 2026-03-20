import request from '@/utils/request'

// 客服会话相关API
const customerApi = {
  // 获取会话列表
  getSessionList: () => request({
    url: '/customer/session/list',
    method: 'get'
  }),
  
  // 获取消息列表
  getMessageList: (sessionId) => request({
    url: `/customer/message/list/${sessionId}`,
    method: 'get'
  }),
  
  // 发送消息
  sendMessage: (message) => request({
    url: '/customer/message/send',
    method: 'post',
    data: message
  }),
  
  // 标记消息为已读
  markAsRead: (sessionId, receiverId) => request({
    url: `/customer/message/markAsRead/${sessionId}/${receiverId}`,
    method: 'put'
  }),
  
  // 结束会话
  endSession: (sessionId) => request({
    url: `/customer/session/end/${sessionId}`,
    method: 'put'
  })
}

export default customerApi
