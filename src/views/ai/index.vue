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
                  <el-checkbox-group v-model="selectedFields[tableName]" @change="handleFieldChange">
                    <el-checkbox 
                      v-for="column in getTableColumns(tableName)" 
                      :key="column" 
                      :label="column">
                      {{ column }}
                    </el-checkbox>
                  </el-checkbox-group>
                </el-form-item>
              </el-form>
            </div>
            
            <el-button type="primary" @click="saveConfig" :loading="loading" :disabled="loading">
              保存配置并初始化
            </el-button>
          </div>
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

export default {
  name: 'AiIndex',
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
      configForm: {}
    }
  },
  mounted() {
    this.getStatus()
    this.getAvailableTables()
    this.getConfig()
    this.addLog('页面加载完成，获取AI系统状态')
  },
  methods: {
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
        }
      } catch (error) {
        this.$message.error('获取可用表失败')
        this.addLog('获取可用表信息失败')
      }
    },
    
    async getConfig() {
      try {
        const res = await aiApi.getConfig()
        if (res.vector_tables) {
          this.selectedTables = res.vector_tables
          this.selectedFields = {}
          if (res.vector_table_config) {
            for (const [table, fields] of Object.entries(res.vector_table_config)) {
              this.selectedFields[table] = fields
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
          vector_table_config: {}
        }
        
        // 添加选中的字段
        for (const tableName of this.selectedTables) {
          if (this.selectedFields[tableName] && this.selectedFields[tableName].length > 0) {
            config.vector_table_config[tableName] = this.selectedFields[tableName]
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
      // 确保每个选中的表都有字段数组
      for (const tableName of val) {
        if (!this.selectedFields[tableName]) {
          this.selectedFields[tableName] = []
        }
      }
    },
    
    handleFieldChange(val, tableName) {
      // 字段变化处理
    },
    
    getTableColumns(tableName) {
      const table = this.availableTables.find(t => t.name === tableName)
      return table ? table.text_columns : []
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
