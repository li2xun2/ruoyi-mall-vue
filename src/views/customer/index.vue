<template>
  <div class="customer-service">
    <el-container style="height: 100vh;">
      <!-- 左侧会话列表 -->
      <el-aside width="300px" class="session-list">
        <div class="session-header">
          <div style="display: flex; align-items: center; gap: 10px;">
            <el-button type="info" size="small" @click="goBack">返回</el-button>
            <h3>客服会话</h3>
          </div>
          <el-button type="primary" size="small" @click="refreshList">刷新</el-button>
        </div>
        <div class="session-tabs">
          <el-tabs v-model="activeTab" @tab-click="handleTabClick">
            <el-tab-pane label="进行中" name="active"></el-tab-pane>
            <el-tab-pane label="历史会话" name="history"></el-tab-pane>
          </el-tabs>
        </div>
        <el-scrollbar style="height: calc(100% - 120px);">
          <div 
            v-for="session in filteredSessions" 
            :key="session.id"
            class="session-item"
            :class="{ active: activeSessionId === session.id }"
            @click="selectSession(session)"
          >
            <div class="session-info">
              <div class="session-user">
                <span class="user-name">{{ session.userName }}</span>
                <span class="session-time">{{ formatTime(session.lastMessageTime) }}</span>
              </div>
              <div class="session-last-message">{{ session.lastMessage }}</div>
              <div v-if="session.unreadCount > 0" class="unread-count">{{ session.unreadCount }}</div>
              <div v-if="session.status === 1" class="session-status">已结束</div>
            </div>
          </div>
        </el-scrollbar>
      </el-aside>

      <!-- 右侧消息聊天 -->
      <el-main class="message-container" v-if="activeSessionId">
        <div class="message-header">
          <h3>{{ activeSession ? activeSession.userName : '' }}</h3>
          <el-button type="danger" size="small" @click="endSession">结束会话</el-button>
        </div>
        <el-scrollbar ref="messageScroll" class="message-list">
          <div 
            v-for="message in messageList" 
            :key="message.id"
            class="message-item"
            :class="{ 'message-sent': message.senderType === 1, 'message-received': message.senderType === 0 }"
          >
            <div class="message-content">
              <div class="message-sender">{{ message.senderName }}</div>
              <div class="message-text">{{ message.content }}</div>
              <div class="message-time">{{ formatTime(message.createTime) }}</div>
            </div>
          </div>
        </el-scrollbar>
        <div class="message-input">
          <el-input
            v-model="inputMessage"
            type="textarea"
            :rows="3"
            placeholder="请输入消息"
            @keyup.enter.ctrl="sendMessage"
          ></el-input>
          <el-button type="primary" @click="sendMessage">发送</el-button>
        </div>
      </el-main>
      <el-main class="empty-container" v-else>
        <div class="empty-tip">请选择一个会话开始聊天</div>
      </el-main>
    </el-container>
  </div>
</template>

<script>
import customerApi from '@/api/customer'

export default {
  name: 'CustomerService',
  data() {
    return {
      sessionList: [],
      messageList: [],
      activeSessionId: '',
      activeSession: null,
      inputMessage: '',
      messagePolling: null,
      activeTab: 'active'
    }
  },
  computed: {
    // 根据当前标签过滤会话
    filteredSessions() {
      if (this.activeTab === 'active') {
        return this.sessionList.filter(session => session.status === 0)
      } else {
        return this.sessionList.filter(session => session.status === 1)
      }
    }
  },
  mounted() {
    this.loadSessionList()
    // 启动消息轮询，每3秒检查一次新消息
    this.messagePolling = setInterval(() => {
      if (this.activeSessionId) {
        this.loadMessageList(this.activeSessionId)
      }
    }, 3000)
  },
  beforeDestroy() {
    // 组件销毁时清除轮询
    if (this.messagePolling) {
      clearInterval(this.messagePolling)
    }
  },
  methods: {
    // 加载会话列表
    loadSessionList() {
      customerApi.getSessionList().then(res => {
        if (res.code === 200) {
          this.sessionList = res.data
        }
      })
    },
    // 标签点击事件
    handleTabClick() {
      this.loadSessionList()
    },
    // 选择会话
    selectSession(session) {
      this.activeSessionId = session.id
      this.activeSession = session
      this.loadMessageList(session.id)
      // 标记消息为已读
      this.markAsRead(session.id)
    },
    // 加载消息列表
    loadMessageList(sessionId) {
      customerApi.getMessageList(sessionId).then(res => {
        if (res.code === 200) {
          this.messageList = res.data
          this.$nextTick(() => {
            this.scrollToBottom()
          })
        }
      })
    },
    // 发送消息
    sendMessage() {
      if (!this.inputMessage.trim()) return
      const message = {
        sessionId: this.activeSessionId,
        senderType: 1, // 1-客服
        senderId: 1, // 假设当前客服ID为1
        receiverId: this.activeSession.userId,
        content: this.inputMessage,
        messageType: 0 // 0-文本
      }
      customerApi.sendMessage(message).then(res => {
        if (res.code === 200) {
          this.inputMessage = ''
          this.loadMessageList(this.activeSessionId)
        }
      })
    },
    // 标记消息为已读
    markAsRead(sessionId) {
      customerApi.markAsRead(sessionId, 1).then(res => {
        if (res.code === 200) {
          // 更新会话列表中的未读数量
          this.loadSessionList()
        }
      })
    },
    // 结束会话
    endSession() {
      customerApi.endSession(this.activeSessionId).then(res => {
        if (res.code === 200) {
          this.$message.success('会话已结束')
          this.activeSessionId = ''
          this.activeSession = null
          this.messageList = []
          this.loadSessionList()
        }
      })
    },
    // 刷新会话列表
    refreshList() {
      this.loadSessionList()
    },
    // 滚动到底部
    scrollToBottom() {
      const scrollbar = this.$refs.messageScroll
      if (scrollbar) {
        scrollbar.$refs.wrap.scrollTop = scrollbar.$refs.wrap.scrollHeight
      }
    },
    // 格式化时间
    formatTime(time) {
      if (!time) return ''
      const date = new Date(time)
      return date.toLocaleString()
    },
    // 返回上一页
    goBack() {
      this.$router.back()
    }
  }
}
</script>

<style scoped>
.customer-service {
  height: 100%;
}

.session-list {
  background-color: #f5f7fa;
  border-right: 1px solid #e4e7ed;
}

.session-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  border-bottom: 1px solid #e4e7ed;
}

.session-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: bold;
}

.session-tabs {
  padding: 0 15px;
  border-bottom: 1px solid #e4e7ed;
}

.session-status {
  position: absolute;
  top: 15px;
  right: 40px;
  background-color: #909399;
  color: white;
  border-radius: 10px;
  padding: 2px 8px;
  font-size: 12px;
}

.session-item.active .session-status {
  background-color: rgba(255, 255, 255, 0.8);
  color: #409eff;
}

.session-item {
  padding: 15px;
  border-bottom: 1px solid #e4e7ed;
  cursor: pointer;
  position: relative;
}

.session-item:hover {
  background-color: #ecf5ff;
}

.session-item.active {
  background-color: #409eff;
  color: white;
}

.session-user {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
}

.user-name {
  font-weight: bold;
}

.session-time {
  font-size: 12px;
  color: #909399;
}

.session-last-message {
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 5px;
}

.unread-count {
  position: absolute;
  top: 15px;
  right: 15px;
  background-color: #f56c6c;
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  line-height: 20px;
  text-align: center;
  font-size: 12px;
  z-index: 10;
}

.message-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 0;
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  border-bottom: 1px solid #e4e7ed;
  background-color: #f5f7fa;
}

.message-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: bold;
}

.message-list {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.message-item {
  margin-bottom: 20px;
  display: flex;
}

.message-sent {
  justify-content: flex-end;
}

.message-received {
  justify-content: flex-start;
}

.message-content {
  max-width: 70%;
  padding: 10px 15px;
  border-radius: 10px;
}

.message-sent .message-content {
  background-color: #409eff;
  color: white;
  border-bottom-right-radius: 0;
}

.message-received .message-content {
  background-color: #f5f7fa;
  border-bottom-left-radius: 0;
}

.message-sender {
  font-size: 12px;
  margin-bottom: 5px;
  opacity: 0.8;
}

.message-text {
  font-size: 14px;
  line-height: 1.5;
  margin-bottom: 5px;
}

.message-time {
  font-size: 12px;
  text-align: right;
  opacity: 0.6;
}

.message-input {
  padding: 15px;
  border-top: 1px solid #e4e7ed;
  background-color: #f5f7fa;
}

.message-input textarea {
  margin-bottom: 10px;
}

.empty-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  background-color: #f5f7fa;
}

.empty-tip {
  font-size: 16px;
  color: #909399;
}
</style>
