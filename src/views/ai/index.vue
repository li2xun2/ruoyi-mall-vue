<template>
  <div class="app-container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>AI索引管理</span>
        </div>
      </template>
      
      <el-tabs v-model="activeTab" type="border-card">
        <!-- 系统状态标签页 -->
        <el-tab-pane label="系统状态" name="status">
          <div class="ai-status">
            <el-descriptions :column="2" border>
              <el-descriptions-item label="RAG引擎状态">
                <el-tag :type="(status.rag_engine && status.rag_engine.initialized) ? 'success' : 'danger'">
                  {{ (status.rag_engine && status.rag_engine.initialized) ? '已初始化' : '未初始化' }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="总记录数">
                {{ (status.rag_engine && status.rag_engine.total_records) || 0 }}
              </el-descriptions-item>
              <el-descriptions-item label="表数量">
                {{ Object.keys((status.rag_engine && status.rag_engine.tables) || {}).length }}
              </el-descriptions-item>
              <el-descriptions-item label="置信度阈值">
                {{ (status.rag_engine && status.rag_engine.confidence_threshold) || 0 }}
              </el-descriptions-item>
            </el-descriptions>
            
            <h4 style="margin-top: 20px;">表状态</h4>
            <el-table :data="tableStats" style="width: 100%; margin-top: 10px;">
              <el-table-column prop="table" label="表名" width="180"></el-table-column>
              <el-table-column prop="size" label="记录数" width="120"></el-table-column>
              <el-table-column prop="columns" label="文本列">
                <template #default="scope">
                  {{ scope.row.columns.join(', ') }}
                </template>
              </el-table-column>
            </el-table>
          </div>
          
          <div class="ai-actions" style="margin-top: 30px;">
            <el-button type="primary" @click="refreshIndex" :loading="loading" :disabled="loading">
              刷新AI索引
            </el-button>
            <el-button @click="getStatus" :loading="loading" :disabled="loading">
              刷新状态
            </el-button>
          </div>
        </el-tab-pane>
        
        <!-- 表管理标签页 -->
        <el-tab-pane label="表管理" name="tables">
          <div class="ai-config">
            <el-alert
              title="配置说明"
              type="info"
              :closable="false"
              style="margin-bottom: 20px;">
              选择要进行向量化的表和字段，系统会根据配置重新初始化AI索引。
            </el-alert>
            
            <el-form :model="configForm" label-width="80px" style="margin-bottom: 20px;">
              <el-form-item label="可用表">
                <el-checkbox-group v-model="selectedTables" @change="handleTableChange">
                  <el-checkbox v-for="table in availableTables" :key="table.name" :label="table.name">
                    {{ table.name }}
                  </el-checkbox>
                </el-checkbox-group>
              </el-form-item>
            </el-form>
            
            <div v-for="tableName in selectedTables" :key="tableName" class="table-fields-config" style="margin-bottom: 20px;">
              <h4>{{ tableName }} 字段配置</h4>
              <el-form :model="configForm" label-width="80px">
                <el-form-item label="文本字段">
                  <el-checkbox-group v-model="selectedFields[tableName]" @change="(val) => handleFieldChange(val, tableName)">
                    <el-checkbox 
                      v-for="column in getTableColumns(tableName)"
                      :key="column" 
                      :label="column">
                      {{ column }}
                    </el-checkbox>
                  </el-checkbox-group>
                </el-form-item>
                <el-form-item label="关键词">
                  <el-input
                    v-model="selectedKeywords[tableName]"
                    placeholder="请输入关键词，用逗号分隔"
                    @input="handleKeywordChange"
                  ></el-input>
                  <div class="form-tip">示例：用户,会员,个人信息</div>
                </el-form-item>
              </el-form>
            </div>
            
            <el-button type="primary" @click="saveConfig" :loading="loading" :disabled="loading">
              保存配置并初始化
            </el-button>
          </div>
        </el-tab-pane>
        
        <!-- FAQ管理标签页 -->
        <el-tab-pane label="FAQ管理" name="faq">
          <FaqComponent />
        </el-tab-pane>
        
        <!-- 操作日志标签页 -->
        <el-tab-pane label="操作日志" name="logs">
          <div class="ai-log">
            <el-scrollbar style="height: 400px; border: 1px solid #ebeef5; padding: 10px;">
              <div v-for="(log, index) in logs" :key="index" class="log-item">
                <span class="log-time">{{ log.time }}</span>
                <span class="log-content">{{ log.content }}</span>
              </div>
            </el-scrollbar>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script>
import aiApi from '@/api/ai'
import FaqComponent from './components/FaqComponent.vue'

export default {
  name: 'AiIndex',
  components: {
    FaqComponent
  },
  data() {
    return {
      activeTab: 'status', // 默认选中系统状态标签页
      status: {
        rag_engine: {
          initialized: false,
          total_records: 0,
          tables: {}
        }
      },
      tableStats: [],
      loading: false,
      logs: [],
      availableTables: [],
      selectedTables: [],
      selectedFields: {},
      selectedKeywords: {},
      configForm: {}
    }
  },
  mounted() {
    this.initData()
  },
  methods: {
    async initData() {
      this.loading = true
      try {
        this.addLog('开始加载AI系统数据...')
        // 按顺序加载数据，避免并发请求导致的卡顿
        await this.getAvailableTables()
        await this.getConfig()
        await this.getStatus()
        this.addLog('页面加载完成，获取AI系统状态')
      } catch (error) {
        this.addLog('加载数据失败')
      } finally {
        this.loading = false
      }
    },
    async getStatus() {
      this.loading = true
      try {
        const res = await aiApi.getStatus()
        this.status = res
        this.updateTableStats()
        this.addLog('获取AI系统状态成功')
      } catch (error) {
        this.$message.error('获取状态失败')
        this.addLog('获取AI系统状态失败')
      } finally {
        this.loading = false
      }
    },
    
    async refreshIndex() {
      this.loading = true
      try {
        this.addLog('开始刷新AI索引...')
        const res = await aiApi.refreshIndex()
        if (res.status === 'success') {
          this.$message.success('索引刷新成功')
          this.addLog('AI索引刷新成功')
          // 刷新状态
          await this.getStatus()
        } else {
          this.$message.error(res.message || '刷新失败')
          this.addLog(`AI索引刷新失败: ${res.message}`)
        }
      } catch (error) {
        this.$message.error('刷新失败')
        this.addLog('AI索引刷新失败')
      } finally {
        this.loading = false
      }
    },
    
    async getAvailableTables() {
      try {
        const res = await aiApi.getTables()
        if (res.tables) {
          this.availableTables = res.tables
          this.addLog('获取可用表信息成功')
          // 打印表信息以便调试
          console.log('Available tables:', this.availableTables)
        }
      } catch (error) {
        this.$message.error('获取可用表失败')
        this.addLog('获取可用表信息失败')
        console.error('Error getting tables:', error)
      }
    },
    
    async getConfig() {
      try {
        const res = await aiApi.getConfig()
        if (res.vector_tables) {
          this.selectedTables = res.vector_tables
          this.selectedFields = {}
          this.selectedKeywords = {}
          
          // 确保每个表都有字段数组和关键词
          for (const tableName of this.selectedTables) {
            // 自动全选该表的所有字段
            const allColumns = this.getTableColumns(tableName)
            this.$set(this.selectedFields, tableName, allColumns)
            this.$set(this.selectedKeywords, tableName, '')
          }
          
          if (res.vector_table_config) {
            for (const [table, fields] of Object.entries(res.vector_table_config)) {
              if (this.selectedTables.includes(table)) {
                this.$set(this.selectedFields, table, fields)
              }
            }
          }
          
          if (res.vector_table_keywords) {
            for (const [table, keywords] of Object.entries(res.vector_table_keywords)) {
              if (this.selectedTables.includes(table)) {
                this.$set(this.selectedKeywords, table, keywords.join(', '))
              }
            }
          }
          
          this.addLog('获取AI配置成功')
        }
      } catch (error) {
        this.$message.error('获取配置失败')
        this.addLog('获取AI配置失败')
      }
    },
    
    async saveConfig() {
      this.loading = true
      try {
        this.addLog('开始保存AI配置...')
        
        // 构建配置对象
        const config = {
          vector_tables: this.selectedTables,
          vector_table_config: {},
          vector_table_keywords: {}
        }
        
        // 添加选中的字段
        for (const tableName of this.selectedTables) {
          if (this.selectedFields[tableName] && this.selectedFields[tableName].length > 0) {
            config.vector_table_config[tableName] = this.selectedFields[tableName]
          }
          
          // 添加关键词
          if (this.selectedKeywords[tableName]) {
            // 将逗号分隔的关键词转换为数组
            const keywords = this.selectedKeywords[tableName]
              .split(',')
              .map(keyword => keyword.trim())
              .filter(keyword => keyword)
            config.vector_table_keywords[tableName] = keywords
          }
        }
        
        const res = await aiApi.saveConfig(config)
        if (res.status === 'success') {
          this.$message.success('配置保存成功，AI索引已初始化')
          this.addLog('AI配置保存成功，索引已初始化')
          // 刷新状态
          await this.getStatus()
        } else {
          this.$message.error(res.message || '保存失败')
          this.addLog(`AI配置保存失败: ${res.message}`)
        }
      } catch (error) {
        this.$message.error('保存失败')
        this.addLog('AI配置保存失败')
      } finally {
        this.loading = false
      }
    },
    
    handleTableChange(val) {
      // 确保每个选中的表都有字段数组和关键词
      for (const tableName of val) {
        if (!this.selectedFields[tableName]) {
          // 自动全选该表的所有字段
          const allColumns = this.getTableColumns(tableName)
          this.$set(this.selectedFields, tableName, allColumns)
        }
        if (!this.selectedKeywords[tableName]) {
          this.$set(this.selectedKeywords, tableName, '')
        }
      }
      // 移除已取消选中的表
      for (const tableName in this.selectedFields) {
        if (!val.includes(tableName)) {
          this.$delete(this.selectedFields, tableName)
          this.$delete(this.selectedKeywords, tableName)
        }
      }
    },
    
    handleFieldChange(val, tableName) {
      // 字段变化处理
      this.$set(this.selectedFields, tableName, val || [])
    },
    
    handleKeywordChange() {
      // 关键词变化处理
    },
    
    getTableColumns(tableName) {
      const table = this.availableTables.find(t => t.name === tableName)
      if (table && table.columns) {
        // 确保columns是数组且每个元素都有column_name属性
        return table.columns
          .filter(col => col && col.column_name)
          .map(col => col.column_name)
      }
      return []
    },
    
    updateTableStats() {
      const tables = this.status.rag_engine?.tables || {}
      this.tableStats = Object.entries(tables).map(([table, stats]) => ({
        table,
        size: stats.size,
        columns: stats.columns
      }))
    },
    
    addLog(content) {
      const time = new Date().toLocaleString()
      this.logs.unshift({ time, content })
      // 限制日志数量
      if (this.logs.length > 50) {
        this.logs = this.logs.slice(0, 50)
      }
    }
  }
}
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.ai-status {
  margin-bottom: 20px;
}

.ai-actions {
  margin-bottom: 20px;
}

.log-item {
  margin-bottom: 8px;
  font-size: 14px;
}

.log-time {
  color: #909399;
  margin-right: 10px;
  font-size: 12px;
}

.log-content {
  color: #303133;
}
</style>
