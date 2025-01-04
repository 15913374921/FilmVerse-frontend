<template>
  <div class="comments-section" style="max-width: 80%; margin: auto; padding: 20px; background-color: #121212; color: white;">
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <h2 style="color: #fff;">评论区</h2>
      <el-button @click="toggleSort" type="primary" size="small">
        {{ isSortByHot ? '最新排序' : '热度排序' }}
      </el-button>
    </div>
    
    <el-card class="comment-input" style="margin-bottom: 20px; background-color: #333; color: white;">
      <el-input
        type="textarea"
        v-model="newComment"
        placeholder="写下你的评论..."
        :rows="4"
        style="resize: none; background-color: #444; color: white; border: 1px solid #555;"
      ></el-input>
      <el-button type="primary" @click="sendComment" style="margin-top: 10px;">提交评论</el-button>
    </el-card>

    <div v-if="comments.length === 0" style="text-align: center; color: #777;">暂无评论</div>
    
    <div v-for="comment in comments" 
         :key="comment.id" 
         class="comment-thread">
      <!-- 主评论 -->
      <el-card class="comment-card" style="background-color: #222; color: white;">
        <div class="comment-header">
          <el-avatar :src="comment.avatar || '/default-avatar.png'" size="small"></el-avatar>
          <strong>{{ comment.username }}</strong>
        </div>
        <div class="comment-content">{{ comment.content }}</div>
        <div class="comment-footer">
          <span class="comment-time">{{ formatTime(comment.createTime) }}</span>
          <div style="margin-left: auto; display: flex; gap: 10px;">
            <el-button 
              @click="handleReply(comment)" 
              type="primary"
              size="small"
              style="color: #fff;"
            >
              回复
            </el-button>
            <el-button 
              @click="likeComment(comment.id)" 
              type="primary"
              size="small"
              style="color: #fff; background-color: #444; border: none; transition: background-color 0.3s, transform 0.3s; padding: 8px 20px; border-radius: 8px; font-size: 14px;"
              @mouseover="hoverLikeButton = true"
              @mouseleave="hoverLikeButton = false"
              :style="{ backgroundColor: hoverLikeButton ? '#666' : '#444', transform: hoverLikeButton ? 'scale(1.1)' : 'scale(1)' }"
            >
              点赞 {{ comment.likes || 0 }}
            </el-button>
          </div>
        </div>

        <!-- 回复输入框 -->
        <div v-if="comment.showReplyInput" class="reply-input" style="margin-top: 10px;">
          <el-input
            v-model="comment.replyContent"
            type="textarea"
            :rows="2"
            placeholder="写下你的回复..."
            style="margin-bottom: 10px;"
          ></el-input>
          <div style="display: flex; justify-content: flex-end; gap: 10px;">
            <el-button size="small" @click="comment.showReplyInput = false">取消</el-button>
            <el-button type="primary" size="small" @click="sendReply(comment)">回复</el-button>
          </div>
        </div>
      </el-card>

      <!-- 回复列表 -->
      <div v-if="comment.replies && comment.replies.length > 0" class="replies-section">
        <div v-for="reply in comment.replies" 
             :key="reply.id" 
             class="reply-card">
          <el-card style="background-color: #2a2a2a; margin-bottom: 8px;">
            <div class="reply-header">
              <el-avatar :src="reply.avatar || '/default-avatar.png'" size="small"></el-avatar>
              <div class="reply-user-info">
                <strong>{{ reply.username }}</strong>
                <span class="reply-to">回复</span>
                <strong>{{ reply.replyTo }}</strong>
              </div>
            </div>
            <div class="reply-content">{{ reply.content }}</div>
            <div class="reply-footer">
              <span class="reply-time">{{ formatTime(reply.createTime) }}</span>
              <el-button 
                @click="handleReply(comment, reply)" 
                type="primary"
                size="small"
                style="color: #fff;"
              >
                回复
              </el-button>
            </div>
          </el-card>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue';
import { useUserStore } from "@/stores/user"
import { ElMessage } from 'element-plus';
import request from '@/utils/request';
import { useRoute } from 'vue-router';
import { ArrowRight } from '@element-plus/icons-vue'

const route = useRoute();
const mediaId = route.params.id;
const mediaType = route.params.type;

const store = useUserStore();
const newComment = ref('');
const comments = ref([]);
let ws = null;
const isSortByHot = ref(false);
const hoverLikeButton = ref(false);

// 加载评论列表
const loadComments = async () => {
  try {
    const response = await request.get(`/comments/${mediaType}/${mediaId}`);
    comments.value = Array.isArray(response.data) ? response.data.filter(comment => 
      comment && comment.id && comment.content
    ).map(comment => {
      // 确保每个回复都包含必要的信息
      const replies = (comment.replies || []).map(reply => ({
        ...reply,
        replyTo: reply.replyTo || comment.username,  // 如果没有replyTo，默认是回复评论作者
        replyToUserId: reply.replyToUserId || comment.userId
      }));

      return {
        ...comment,
        showReplyInput: false,
        replyContent: '',
        replies: replies,
        currentReplyTo: null
      };
    }) : [];
    comments.value.sort((a, b) => new Date(b.createTime) - new Date(a.createTime));
  } catch (error) {
    console.error('加载评论失败:', error);
    ElMessage.error('加载评论失败');
    comments.value = [];
  }
};

// 初始化WebSocket连接
const initWebSocket = () => {
  if(!store.isLoggedIn){
    return;
  }
  const userId = store.loginInfo.user.id;
  ws = new WebSocket(`ws://localhost:9090/websocket/comment/${mediaType}/${mediaId}/${userId}`);
  
  ws.onmessage = (event) => {
  try {
    const message = JSON.parse(event.data);
    console.log('收到WebSocket消息:', message);
    
    switch(message.type) {
      case 'comment':
        // 处理新评论
        if (message.data && message.data.id) {
          const newComment = {
            ...message.data,
            showReplyInput: false,
            replyContent: '',
            replies: [],
            currentReplyTo: null
          };
          comments.value.unshift(newComment);
          
          // 如果是自己发的评论，显示成功提示
          if (message.data.userId === store.loginInfo.user.id) {
            ElMessage.success('评论成功');
          }
        }
        break;
        
      case 'reply':
        // 处理评论回复
        if (message.data && message.data.parentId) {
          const parentComment = comments.value.find(c => c.id === message.data.parentId);
          if (parentComment) {
            if (!parentComment.replies) {
              parentComment.replies = [];
            }
            
            // 确保回复数据包含完整的信息
            const replyWithInfo = {
              ...message.data,
              replyTo: message.data.replyTo || parentComment.username,
              replyToUserId: message.data.replyToUserId || parentComment.userId
            };
            
            // 添加到回复列表
            parentComment.replies.unshift(replyWithInfo);
            
            // 如果是自己发的回复，清理输入状态
            if (message.data.userId === store.loginInfo.user.id) {
              ElMessage.success('回复成功');
              parentComment.showReplyInput = false;
              parentComment.replyContent = '';
              parentComment.currentReplyTo = null;
            }
          }
        }
        break;
        
      case 'error':
        ElMessage.error(message.message || '操作失败');
        break;
    }
  } catch (error) {
    console.error('WebSocket消息处理错误:', error);
    }
  }
};

// 发送评论
const sendComment = async () => {
  if(!store.isLoggedIn){
    ElMessage.warning('请先登录');
    return;
  }
  if (!newComment.value.trim()) {
    return ElMessage.warning('请输入评论内容');
  }

  const comment = {
    userId: store.loginInfo.user.id,
    username: store.loginInfo.user.name,
    avatar: store.loginInfo.user.avatar,
    mediaId: mediaId,
    mediaType: mediaType,
    content: newComment.value.trim()
  };

  try {
    ws.send(JSON.stringify(comment));
    newComment.value = '';
    
  } catch (error) {
    ElMessage.error('发送评论失败');
  }
};

// 点赞评论
const likeComment = async (commentId) => {
  if(!store.isLoggedIn){
    ElMessage.warning('请先登录')
    return
  }
  try {
    await request.post(`/comments/${commentId}/like`, {
      userId: store.loginInfo.user.id
    }).then(res => {
      if(res.code === '200'){
        const comment = comments.value.find(c => c.id === commentId);
        if (comment) {
          ElMessage.success(res.data);
          comment.likes = (comment.likes || 0) + 1;
          // 更新store中的用户积分
          store.updateUserPoints(res.data.newPoints);
        }
      } else {
        ElMessage.error(res.msg);
      }
    })
  } catch (error) {
    ElMessage.error('点赞失败');
  }
}

// 格式化时间
const formatTime = (time) => {
  if (!time) return '';
  try {
    const date = new Date(time);
    if (isNaN(date.getTime())) return '';
    
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 7) {
      return date.toLocaleDateString('zh-CN', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } else if (days > 0) {
      return `${days}天前`;
    } else if (hours > 0) {
      return `${hours}小时前`;
    } else if (minutes > 0) {
      return `${minutes}分钟前`;
    } else {
      return '刚刚';
    }
  } catch (e) {
    console.error('时间格式化错误:', e);
    return '';
  }
};

const toggleSort = () => {
  isSortByHot.value = !isSortByHot.value;
  if (isSortByHot.value) {
    // Sort by likes (hot)
    comments.value.sort((a, b) => (b.likes || 0) - (a.likes || 0));
  } else {
    // Sort by time (latest)
    comments.value.sort((a, b) => new Date(b.createTime) - new Date(a.createTime));
  }
};

// 处理回复
const handleReply = (comment, replyTo = null) => {
  if(!store.isLoggedIn){
    ElMessage.warning('请先登录');
    return;
  }
  // 先关闭其他所有评论的回复框
  comments.value.forEach(c => {
    if (c.id !== comment.id) {
      c.showReplyInput = false;
    }
  });
  // 切换当前评论的回复框
  comment.showReplyInput = !comment.showReplyInput;
  if (comment.showReplyInput) {
    comment.replyContent = '';
    // 如果是回复子评论，保存被回复者信息
    if (replyTo) {
      comment.currentReplyTo = {
        username: replyTo.username,
        userId: replyTo.userId
      };
    } else {
      comment.currentReplyTo = {
        username: comment.username,
        userId: comment.userId
      };
    }
  }
};

// 发送回复
const sendReply = async (comment) => {
  if(!store.isLoggedIn){
    ElMessage.warning('请先登录');
    return;
  }
  if (!comment.replyContent || !comment.replyContent.trim()) {
    ElMessage.warning('请输入回复内容');
    return;
  }

  const replyData = {
    parentId: comment.id,
    userId: store.loginInfo.user.id,
    username: store.loginInfo.user.name,
    avatar: store.loginInfo.user.avatar,
    mediaId: mediaId,
    mediaType: mediaType,
    content: comment.replyContent.trim(),
    replyTo: comment.currentReplyTo.username,
    replyToUserId: comment.currentReplyTo.userId
  };

  try {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(replyData));
      // 不需要手动更新界面，等待 WebSocket 消息的回调处理
    } else {
      throw new Error('WebSocket 连接未建立');
    }
  } catch (error) {
    console.error('回复失败:', error);
    ElMessage.error('回复失败');
  }
};

// 生命周期钩子
onMounted(() => {
  initWebSocket();
  loadComments();
});

onBeforeUnmount(() => {
  if (ws) {
    ws.close();
  }
});
</script>

<style scoped>
.comment-thread {
  margin-bottom: 20px;
}

.comment-card {
  margin-bottom: 1px;
}

.replies-section {
  margin-left: 40px;
  margin-top: 1px;
}

.reply-card {
  position: relative;
}

.reply-card::before {
  content: '';
  position: absolute;
  left: -20px;
  top: 0;
  bottom: 0;
  width: 2px;
  background-color: #444;
}

.reply-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.reply-user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: white;
}

.reply-to {
  color: #666;
  font-size: 14px;
}

.reply-content {
  margin: 8px 0 8px 34px;
  color: #e0e0e0;
}

.reply-footer {
  margin-left: 34px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.reply-time {
  color: #666;
  font-size: 12px;
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.comment-content {
  margin: 10px 0;
  line-height: 1.5;
}

.comment-footer {
  display: flex;
  align-items: center;
  margin-top: 10px;
}

.comment-time {
  color: #666;
  font-size: 12px;
}
</style>