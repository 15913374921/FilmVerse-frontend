<template>
  <div class="points-mall">
    <div class="products-grid">
      <el-card class="product-card">
        <img src="https://via.placeholder.com/200x200?text=电影票" class="product-image">
        <div class="product-info">
          <h3>电影票</h3>
          <div class="product-points">
            <span class="points">50</span>
            <span class="points-text">积分</span>
          </div>
          <el-button 
            type="primary" 
            @click="handleExchange"
          >
            立即兑换
          </el-button>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import request from '@/utils/request'
import { ElMessageBox, ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const user = userStore.getUser

const REQUIRED_POINTS = 50

const handleExchange = async () => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    return
  }

  if (user.scope < REQUIRED_POINTS) {
    ElMessage.warning('积分不足')
    return
  }
  
  try {
    // 弹出确认框
    await ElMessageBox.confirm(
      '确定要兑换电影票吗？将消耗50积分',
      '兑换确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 调用后端接口扣除积分
    const res = await request.post('/comments/exchange', {
      userId: user.id,
      points: REQUIRED_POINTS
    })
    
    if (res.code === '200') {
      ElMessage.success('兑换成功')
      // 更新store中的用户信息
      user.scope -= REQUIRED_POINTS
    } else {
      ElMessage.error(res.msg || '兑换失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('兑换失败：' + error.message)
    }
  }
}
</script>

<style scoped>
.points-mall {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.products-grid {
  display: flex;
  justify-content: center;
  padding: 20px 0;
}

.product-card {
  width: 300px;
  transition: transform 0.3s;
}

.product-card:hover {
  transform: translateY(-5px);
}

.product-image {
  width: 100%;
  height: 200px;
  object-fit: cover;
}

.product-info {
  padding: 15px;
  text-align: center;
}

.product-info h3 {
  margin: 0 0 10px 0;
  font-size: 16px;
}

.product-points {
  margin: 10px 0;
}

.points {
  font-size: 24px;
  color: #f56c6c;
  font-weight: bold;
}

.points-text {
  margin-left: 5px;
  color: #909399;
}
</style> 