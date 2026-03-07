<template>
  <div class="app-container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>AI客服</span>
        </div>
      </template>
      
      <div class="ai-chat-container">
        <!-- 聊天记录 -->
        <div class="chat-messages">
          <div v-for="(message, index) in messages" :key="index" class="message-item" :class="message.role === 'user' ? 'user-message' : 'ai-message'">
            <div class="message-avatar">
              <el-avatar v-if="message.role === 'user'" size="small" :icon="'el-icon-user'"></el-avatar>
              <el-avatar v-else size="small" :icon="'el-icon-robot'"></el-avatar>
            </div>
            <div class="message-content">
              <div class="message-text">{{ message.content }}</div>
              <div class="message-time">{{ message.timestamp }}</div>
            </div>
          </div>
          <div v-if="loading" class="loading-message">
            <el-icon class="is-loading"><i class="el-icon-loading"></i></el-icon>
            <span>AI正在思考...</span>
          </div>
        </div>
        
        <!-- 输入区域 -->
        <div class="chat-input-area">
          <el-input
            v-model="inputMessage"
            type="textarea"
            :rows="2"
            placeholder="请输入您的问题..."
            @keyup.enter.exact="sendMessage"
          ></el-input>
          <div class="input-actions">
            <el-button type="default" @click="clearMessages">清空记录</el-button>
            <el-button type="primary" @click="sendMessage" :loading="loading" :disabled="loading || !inputMessage.trim()">
              发送
            </el-button>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script>
import request from '@/utils/request'

export default {
  name: 'AiChat',
  data() {
    return {
      messages: [],
      inputMessage: '',
      loading: false
    }
  },
  mounted() {
    // 从localStorage加载对话记录
    this.loadMessages()
  },
  watch: {
    // 监听messages变化，自动保存到localStorage
    messages: {
      handler(newMessages) {
        this.saveMessages(newMessages)
      },
      deep: true
    }
  },
  methods: {
    // 获取用户特定的存储键
    getUserStorageKey() {
      const userId = this.$store.state.user.userId || 'anonymous'
      return `aiChatMessages_${userId}`
    },
    // 加载对话记录
    loadMessages() {
      const storageKey = this.getUserStorageKey()
      const savedMessages = localStorage.getItem(storageKey)
      if (savedMessages) {
        try {
          this.messages = JSON.parse(savedMessages)
        } catch (error) {
          console.error('加载对话记录失败:', error)
          this.addSystemMessage('您好！我是AI客服助手，可以回答您关于系统的问题。请问有什么可以帮助您的？')
        }
      } else {
        this.addSystemMessage('您好！我是AI客服助手，可以回答您关于系统的问题。请问有什么可以帮助您的？')
      }
    },
    // 保存对话记录
    saveMessages(messages) {
      try {
        const storageKey = this.getUserStorageKey()
        localStorage.setItem(storageKey, JSON.stringify(messages))
      } catch (error) {
        console.error('保存对话记录失败:', error)
      }
    },

    async sendMessage() {
      if (!this.inputMessage.trim() || this.loading) return
      
      const message = this.inputMessage.trim()
      this.inputMessage = ''
      
      // 添加用户消息
      this.addMessage('user', message)
      this.loading = true
      
      try {
        // 发送请求到AI服务
        const response = await request({
          url: '/pyapi/ai/ask',
          method: 'post',
          data: {
            question: message
          },
          baseURL: '', // 直接使用绝对路径，绕过baseURL
          timeout: 60000 // 超时时间设置为60秒
        })
        
        // 添加AI回答
        this.addMessage('ai', response.answer)
      } catch (error) {
        console.error('AI请求失败:', error)
        this.addMessage('ai', '抱歉，系统暂时无法处理您的问题，请稍后再试。')
      } finally {
        this.loading = false
      }
    },
    
    addMessage(role, content) {
      this.messages.push({
        role,
        content,
        timestamp: new Date().toLocaleString()
      })
      this.scrollToBottom()
    },
    
    addSystemMessage(content) {
      this.messages.push({
        role: 'system',
        content,
        timestamp: new Date().toLocaleString()
      })
      this.scrollToBottom()
    },
    
    clearMessages() {
      this.messages = []
      // 清空localStorage中的记录
      const storageKey = this.getUserStorageKey()
      localStorage.removeItem(storageKey)
      this.addSystemMessage('您好！我是AI客服助手，可以回答您关于系统的问题。请问有什么可以帮助您的？')
    },
    
    scrollToBottom() {
      this.$nextTick(() => {
        const chatContainer = document.querySelector('.chat-messages')
        if (chatContainer) {
          chatContainer.scrollTop = chatContainer.scrollHeight
        }
      })
    }
  }
}
</script>

<style scoped>
.ai-chat-container {
  display: flex;
  flex-direction: column;
  height: 600px;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background-color: #f9f9f9;
  border-radius: 4px;
  margin-bottom: 20px;
}

.message-item {
  display: flex;
  margin-bottom: 15px;
  max-width: 80%;
}

.user-message {
  margin-left: auto;
  flex-direction: row-reverse;
}

.ai-message {
  margin-right: auto;
}

.message-avatar {
  margin: 0 10px;
}

.message-content {
  flex: 1;
}

.message-text {
  padding: 10px 15px;
  border-radius: 18px;
  line-height: 1.5;
}

.user-message .message-text {
  background-color: #409EFF;
  color: white;
  border-bottom-right-radius: 4px;
}

.ai-message .message-text {
  background-color: white;
  color: #303133;
  border-bottom-left-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.message-time {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
  text-align: right;
}

.user-message .message-time {
  text-align: left;
}

.loading-message {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px;
  color: #909399;
}

.chat-input-area {
  margin-top: auto;
}

.input-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
}

.input-actions button {
  margin-left: 10px;
}
</style>