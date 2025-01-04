<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-left">
        <img src="../assets/imgs/电影.png" alt="logo" class="logo">
        <h1>FilmVerse</h1>
        <p class="slogan">发现精彩影视世界</p>
      </div>
      <div class="login-right">
        <el-form ref="ruleFormRef" :model="form" :rules="rules" status-icon class="login-form">
          <h2>欢迎回来</h2>
          <p class="subtitle">请登录您的账号</p>
          
          <el-form-item prop="username">
            <el-input 
              v-model="form.username" 
              :prefix-icon="User" 
              placeholder="请输入账号或邮箱"
              class="custom-input"
            />
          </el-form-item>
          
          <el-form-item prop="password">
            <el-input 
              v-model="form.password" 
              show-password 
              :prefix-icon="Lock" 
              placeholder="请输入密码"
              autocomplete="new-password"
              class="custom-input"
            />
          </el-form-item>

          <div class="form-footer">
            <el-button class="login-button" type="primary" @click="login">登录</el-button>
            <div class="links">
              <el-button link class="forgot-password" @click="handleResetPassword">忘记密码？</el-button>
              <el-button link class="register" @click="router.push('/register')">没有账号？立即注册</el-button>
            </div>
          </div>
        </el-form>
      </div>
    </div>

    <!-- 忘记密码对话框 -->
    <el-dialog v-model="passwordVis" title="重置密码" width="500" :close-on-click-modal="false" class="reset-dialog">
      <el-form :model="passwordForm" label-width="100px" ref="rulePasswordFormRef" :rules="passwordRules" status-icon>
        <el-form-item label="新密码" prop="password">
          <el-input 
            v-model="passwordForm.password" 
            show-password 
            :prefix-icon="Lock" 
            placeholder="请输入新密码"
            autocomplete="new-password"
          />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirm">
          <el-input 
            v-model="passwordForm.confirm" 
            show-password 
            :prefix-icon="Lock" 
            placeholder="请确认新密码"
            autocomplete="new-password"
          />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input 
            v-model="passwordForm.email" 
            :prefix-icon="Message" 
            placeholder="请输入邮箱" 
          />
        </el-form-item>
        <el-form-item label="验证码" prop="emailCode">
          <div class="verification-code">
            <el-input 
              v-model="passwordForm.emailCode" 
              placeholder="请输入验证码" 
              clearable
            />
            <el-button 
              class="send-code-btn" 
              :disabled="time > 0" 
              @click="sendEmail"
            >
              {{ time > 0 ? `重新发送(${time}s)` : '发送验证码' }}
            </el-button>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="passwordVis = false">取消</el-button>
          <el-button type="primary" @click="resetPassword">确认</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
    import { nextTick, reactive,ref } from 'vue'
    // import { FormRules } from 'element-plus'
    import { User,Lock,Message } from '@element-plus/icons-vue'
    import router from '@/router';
    import request from '@/utils/request'
    import { ElMessage } from 'element-plus'
    import { useUserStore } from "@/stores/user"

    const passwordVis = ref(false);
    const ruleFormRef = ref()
    const rulePasswordFormRef = ref()
    const passwordForm = reactive({})
    const rules = reactive({
        username: [
            {required: true, message: '请输入账号', trigger: 'blur'}
        ],
        password: [
            {required: true, message: '请输入密码', trigger: 'blur'}
        ]
    })

    // 忘记密码校验规则
    const confirmPassword = (passwordRules,value,callback) => {
      if(value === '') {
        callback(new Error('请输入密码'))
      }
      if(passwordForm.password !== value) {
        callback(new Error('两次输入的密码不一样'))
      }
      callback()
    }

    // 邮箱校验规则
    const reg = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    const checkEmail = (passwordRules,value,callback) => {
      if(!reg.test(value)) { // test可以检验输入的value值
        return callback(new Error('邮箱格式不合法'))
      }
      callback()
    }

    const passwordRules = reactive({
        email: [
            {required: true, message: '请输入账号', trigger: 'blur'}
        ],
        password: [
            {required: true, message: '请输入密码', trigger: 'blur'}
        ],
        confirm: [
            {validator: confirmPassword, trigger: 'blur'}
        ],
        email: [
            {validator: checkEmail, trigger: 'blur'}
        ],
        emailCode: [
            {required: true, message: '请输入验证码', trigger: 'blur'}
        ],
    })

    const form = reactive({})

    const store = useUserStore()
    const login = () => {
        ruleFormRef.value.validate(valid => {
            if(valid){
                request.post("/login",form).then(res => {
                    if (res.code === '200'){
                        store.updateUserInfo(res.data)
                        ElMessage.success('登录成功')
                        router.push('/')
                    } else {
                        ElMessage.error(res.msg)
                    }
                })
            }
        })
    }
    
    // 通过后端验证邮箱
    const interval = ref(0)
    const time = ref(0)
    const sendEmail = () => {
      if(!reg.test(passwordForm.email)){
          ElMessage.warning("请输入合法邮箱")
          return
        }
        
      request.get("/email", {
        params: {
          email: passwordForm.email,
          type: "RESETPASSWORD"
        }
      }).then(res => {
        if (res.code === '200'){
            ElMessage.success('发送成功，有效期5分钟')
            // 清空定时器
          if(interval.value >= 0){
            clearInterval(interval.value)
          }
          time.value = 60
          interval.value = setInterval(() => {
            if(time.value > 0){
              time.value--
            }
          },1000)
        } else {
            ElMessage.error(res.msg)
        }
      })
    }

    const handleResetPassword = () => {
      passwordVis.value = true
      nextTick(() => { // 下个时钟
        rulePasswordFormRef.value.resetFields()
      })
    }
    // 修改密码
    const resetPassword = () => {
      rulePasswordFormRef.value.validate(valid => {
            // 当valid等于true调用登录接口
            if(valid){
              request.post("/password/reset",passwordForm).then(res => {
                if (res.code === '200'){
                    ElMessage.success('修改成功')
                    passwordVis.value = false
                } else {
                    ElMessage.error(res.msg)
                }
            })
            }
        })
    }
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #141e30 0%, #243b55 100%);
  padding: 20px;
}

.login-box {
  width: 900px;
  height: 600px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  display: flex;
  overflow: hidden;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

.login-left {
  flex: 1;
  background: linear-gradient(135deg, #434343 0%, #000000 100%);
  padding: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  text-align: center;
  position: relative;
  overflow: hidden;
}

.login-left::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(67, 67, 67, 0.9) 0%, rgba(0, 0, 0, 0.9) 100%);
  z-index: 1;
}

.login-left .logo,
.login-left h1,
.login-left .slogan {
  position: relative;
  z-index: 2;
}

.login-left .logo {
  width: 120px;
  margin-bottom: 20px;
  filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1));
}

.login-left h1 {
  font-size: 36px;
  margin-bottom: 10px;
  font-weight: 600;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.login-left .slogan {
  font-size: 18px;
  opacity: 0.9;
}

.login-right {
  flex: 1;
  padding: 40px;
  display: flex;
  align-items: center;
  background: white;
}

.login-form {
  width: 100%;
  padding: 0 20px;
}

.login-form h2 {
  font-size: 28px;
  margin-bottom: 10px;
  color: #1a1a1a;
  text-align: center;
}

.subtitle {
  text-align: center;
  color: #666;
  margin-bottom: 30px;
}

.custom-input :deep(.el-input__wrapper) {
  border-radius: 8px;
  height: 45px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  border: 1px solid #e0e0e0;
}

.custom-input :deep(.el-input__wrapper:hover) {
  border-color: #c0c4cc;
}

.custom-input :deep(.el-input__wrapper.is-focus) {
  border-color: #434343;
  box-shadow: 0 0 0 1px #434343;
}

.form-footer {
  margin-top: 30px;
}

.login-button {
  width: 100%;
  height: 45px;
  border-radius: 8px;
  font-size: 16px;
  margin-bottom: 20px;
  background: linear-gradient(135deg, #434343 0%, #000000 100%);
  border: none;
  transition: all 0.3s;
}

.login-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  opacity: 0.9;
}

.links {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.forgot-password, .register {
  font-size: 14px;
}

.forgot-password {
  color: #666;
}

.register {
  color: #434343;
  font-weight: 500;
}

.reset-dialog :deep(.el-dialog__body) {
  padding: 30px;
}

.verification-code {
  display: flex;
  gap: 10px;
}

.send-code-btn {
  width: 120px;
  background: #f5f7fa;
}

@media (max-width: 768px) {
  .login-box {
    width: 100%;
    max-width: 400px;
    height: auto;
    flex-direction: column;
  }

  .login-left {
    padding: 30px;
  }

  .login-right {
    padding: 30px;
  }
}
</style>