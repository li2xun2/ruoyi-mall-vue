<template>
  <div class="ai-faq">
    <el-alert
      title="FAQ管理" 
      type="info"
      :closable="false"
      style="margin-bottom: 20px;">
      管理常见问题，提高AI客服回答的准确性和一致性。
    </el-alert>
    
    <div class="faq-actions" style="margin-bottom: 20px;">
      <el-button type="primary" @click="openFaqDialog()">
        添加FAQ
      </el-button>
      <el-input
        v-model="faqSearchKeyword"
        placeholder="搜索问题或答案"
        style="width: 300px; margin-left: 20px;"
        @keyup.enter="searchFaqs()"
      >
        <template #append>
          <el-button @click="searchFaqs()"><i class="el-icon-search"></i></el-button>
        </template>
      </el-input>
    </div>
    
    <el-table :data="faqs" style="width: 100%" stripe>
      <el-table-column prop="id" label="ID" width="80"></el-table-column>
      <el-table-column prop="question" label="问题" min-width="200"></el-table-column>
      <el-table-column prop="answer" label="答案" min-width="300">
        <template #default="scope">
          {{ scope.row.answer.length > 100 ? scope.row.answer.substring(0, 100) + '...' : scope.row.answer }}
        </template>
      </el-table-column>
      <el-table-column prop="category" label="分类" width="120"></el-table-column>
      <el-table-column prop="sort" label="排序" width="80"></el-table-column>
      <el-table-column prop="createTime" label="创建时间" width="180"></el-table-column>
      <el-table-column label="操作" width="150" fixed="right">
        <template #default="scope">
          <el-button size="small" @click="editFaq(scope.row)">
            编辑
          </el-button>
          <el-button size="small" type="danger" @click="deleteFaq(scope.row.id)">
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    
    <div class="pagination" style="margin-top: 20px;">
      <el-pagination
        v-model:current-page="faqCurrentPage"
        v-model:page-size="faqPageSize"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="faqTotal"
        @size-change="handleFaqSizeChange"
        @current-change="handleFaqCurrentChange"
      />
    </div>
    
    <!-- FAQ对话框 -->
    <el-dialog
      :title="faqDialogTitle"
      :visible.sync="faqDialogVisible"
      width="600px"
    >
      <el-form :model="faqForm" label-width="80px">
        <el-form-item label="问题">
          <el-input
            v-model="faqForm.question"
            type="textarea"
            :rows="3"
            placeholder="请输入问题"
          ></el-input>
        </el-form-item>
        <el-form-item label="答案">
          <el-input
            v-model="faqForm.answer"
            type="textarea"
            :rows="6"
            placeholder="请输入答案"
          ></el-input>
        </el-form-item>
        <el-form-item label="分类">
          <el-input
            v-model="faqForm.category"
            placeholder="请输入分类（可选）"
          ></el-input>
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number
            v-model="faqForm.sort"
            :min="0"
            :max="999"
            :step="1"
            placeholder="排序值"
          ></el-input-number>
        </el-form-item>
        <el-form-item label="状态">
          <el-switch
            v-model="faqForm.status"
            active-value="1"
            inactive-value="0"
          ></el-switch>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="faqDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveFaq">保存</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import aiApi from '@/api/ai'

export default {
  name: 'FaqComponent',
  data() {
    return {
      faqs: [],
      faqTotal: 0,
      faqCurrentPage: 1,
      faqPageSize: 10,
      faqSearchKeyword: '',
      faqDialogVisible: false,
      faqDialogTitle: '添加FAQ',
      faqForm: {
        id: null,
        question: '',
        answer: '',
        category: '',
        sort: 0,
        status: 1
      },
      loading: false
    }
  },
  mounted() {
    this.getFaqs()
  },
  methods: {
    async getFaqs() {
      // 获取FAQ列表
      this.loading = true
      try {
        console.log('开始获取FAQ列表，参数:', {
          keyword: this.faqSearchKeyword,
          page: this.faqCurrentPage - 1, // 后端使用从0开始的页码
          size: this.faqPageSize
        })
        const res = await aiApi.getFaqs({
          keyword: this.faqSearchKeyword,
          page: this.faqCurrentPage - 1, // 后端使用从0开始的页码
          size: this.faqPageSize
        })
        console.log('获取FAQ列表成功，返回数据:', res)
        if (res && res.content) {
          this.faqs = res.content
          this.faqTotal = res.totalElements
          console.log('更新FAQ数据:', this.faqs.length, '条记录，总记录数:', this.faqTotal)
        } else {
          console.error('获取FAQ列表失败，返回数据格式不正确:', res)
          this.$message.error('获取FAQ列表失败，返回数据格式不正确')
        }
      } catch (error) {
        console.error('获取FAQ列表失败:', error)
        this.$message.error('获取FAQ列表失败')
      } finally {
        this.loading = false
      }
    },
    
    openFaqDialog() {
      // 打开添加FAQ对话框
      console.log('打开添加FAQ对话框')
      this.faqDialogTitle = '添加FAQ'
      this.faqForm = {
        id: null,
        question: '',
        answer: '',
        category: '',
        sort: 0,
        status: 1
      }
      this.faqDialogVisible = true
      console.log('添加FAQ对话框已打开')
    },
    
    editFaq(faq) {
      // 编辑FAQ
      console.log('编辑FAQ:', faq)
      this.faqDialogTitle = '编辑FAQ'
      this.faqForm = {
        id: faq.id,
        question: faq.question,
        answer: faq.answer,
        category: faq.category,
        sort: faq.sort,
        status: faq.status
      }
      this.faqDialogVisible = true
      console.log('编辑FAQ对话框已打开')
    },
    
    async saveFaq() {
      // 保存FAQ
      console.log('保存FAQ:', this.faqForm)
      if (!this.faqForm.question || !this.faqForm.answer) {
        this.$message.error('问题和答案不能为空')
        return
      }
      
      this.loading = true
      try {
        if (this.faqForm.id) {
          // 更新FAQ
          console.log('更新FAQ:', this.faqForm.id, this.faqForm)
          await aiApi.updateFaq(this.faqForm.id, this.faqForm)
          console.log('更新FAQ成功')
        } else {
          // 创建FAQ
          console.log('创建FAQ:', this.faqForm)
          await aiApi.createFaq(this.faqForm)
          console.log('创建FAQ成功')
        }
        
        this.$message.success('操作成功')
        this.faqDialogVisible = false
        await this.getFaqs()
      } catch (error) {
        console.error('保存FAQ失败:', error)
        this.$message.error('保存失败')
      } finally {
        this.loading = false
      }
    },
    
    deleteFaq(id) {
      // 删除FAQ
      console.log('删除FAQ:', id)
      this.$confirm('确定要删除这个FAQ吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        this.loading = true
        try {
          console.log('执行删除FAQ:', id)
          await aiApi.deleteFaq(id)
          console.log('删除FAQ成功')
          this.$message.success('删除成功')
          await this.getFaqs()
        } catch (error) {
          console.error('删除FAQ失败:', error)
          this.$message.error('删除失败')
        } finally {
          this.loading = false
        }
      }).catch(() => {
        // 取消删除
        console.log('取消删除FAQ')
      })
    },
    
    searchFaqs() {
      // 搜索FAQ，重置分页到第一页
      this.faqCurrentPage = 1
      this.getFaqs()
    },
    
    handleFaqSizeChange(size) {
      // 处理FAQ分页大小变化
      this.faqPageSize = size
      this.getFaqs()
    },
    
    handleFaqCurrentChange(current) {
      // 处理FAQ当前页码变化
      this.faqCurrentPage = current
      this.getFaqs()
    }
  }
}
</script>

<style scoped>
.ai-faq {
  padding: 10px;
}

.faq-actions {
  display: flex;
  align-items: center;
}

.pagination {
  display: flex;
  justify-content: flex-end;
}
</style>
