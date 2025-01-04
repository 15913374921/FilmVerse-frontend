<template>
  <div class="register-container">
    <div class="register-box">
      <div class="register-left">
        <img src="../assets/imgs/电影.png" alt="logo" class="logo">
        <h1>FilmVerse</h1>
        <p class="slogan">发现精彩影视世界</p>
      </div>
      <div class="register-right">
        <el-form ref="ruleFormRef" :model="form" :rules="rules" status-icon class="register-form">
          <h2>创建账号</h2>
          <p class="subtitle">欢迎加入 FilmVerse</p>
          
          <el-form-item prop="username">
            <el-input 
              v-model="form.username" 
              :prefix-icon="User" 
              placeholder="请输入账号"
              class="custom-input"
            />
          </el-form-item>

          <el-form-item>
            <el-input 
              v-model="form.name" 
              :prefix-icon="UserFilled" 
              placeholder="请输入昵称"
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

          <el-form-item prop="confirm">
            <el-input 
              v-model="form.confirm" 
              show-password 
              :prefix-icon="Lock" 
              placeholder="请确认密码"
              autocomplete="new-password"
              class="custom-input"
            />
          </el-form-item>

          <el-form-item prop="email">
            <el-input 
              v-model="form.email" 
              :prefix-icon="Message" 
              placeholder="请输入邮箱"
              class="custom-input"
            />
          </el-form-item>

          <el-form-item prop="emailCode">
            <div class="verification-code">
              <el-input 
                v-model="form.emailCode" 
                placeholder="请输入验证码"
                class="custom-input"
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

          <div class="form-footer">
            <el-button class="register-button" type="primary" @click="register">立即注册</el-button>
            <div class="links">
              <el-button link class="login-link" @click="$router.push('login')">已有账号？立即登录</el-button>
            </div>
          </div>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script setup>
    import { reactive,ref } from 'vue'
    // import { FormRules } from 'element-plus'
    import { User,Lock,UserFilled,Message } from '@element-plus/icons-vue'
    import router from '@/router';
    import request from '@/utils/request'
    import { ElMessage } from 'element-plus'
    import { useUserStore } from "@/stores/user"

    const form = reactive({})

    const ruleFormRef = ref()

    const time = ref(0)
    const interval = ref(0)

    // 注册密码校验规则
    const confirmPassword = (rules,value,callback) => {
      if(value === '') {
        callback(new Error('请输入密码'))
      }
      if(form.password !== value) {
        callback(new Error('两次输入的密码不一样'))
      }
      callback()
    }

    // 邮箱校验规则
    const reg = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    const checkEmail = (rules,value,callback) => {
      if(!reg.test(value)) { // test可以检验输入的value值
        return callback(new Error('邮箱格式不合法'))
      }
      callback()
    }

    const rules = reactive({
        username: [
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

    // 通过后端验证邮箱
    const sendEmail = () => {
      if(!reg.test(form.email)){
          ElMessage.warning("请输入合法邮箱")
          return
        }
       
      request.get("/email", {
        params: {
          email: form.email,
          type: "REGISTER"
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


    const store = useUserStore()
    const register = () => {
        ruleFormRef.value.validate(valid => {
            // 当valid等于true调用登录接口
            if(valid){
              request.post("/register",form).then(res => {
                if (res.code === '200'){
                    ElMessage.success('注册成功')
                    router.push('/login')
                } else {
                    ElMessage.error(res.msg)
                }
            })
            }
        })
    }
</script>

<style scoped>
.register-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1a237e 0%, #0d47a1 100%);
  padding: 20px;
}

.register-box {
  width: 900px;
  height: 700px;
  background: white;
  border-radius: 20px;
  display: flex;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}

.register-left {
  flex: 1;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  text-align: center;
}

.register-left .logo {
  width: 120px;
  margin-bottom: 20px;
}

.register-left h1 {
  font-size: 36px;
  margin-bottom: 10px;
  font-weight: 600;
}

.register-left .slogan {
  font-size: 18px;
  opacity: 0.9;
}

.register-right {
  flex: 1;
  padding: 40px;
  display: flex;
  align-items: center;
}

.register-form {
  width: 100%;
  padding: 0 20px;
}

.register-form h2 {
  font-size: 28px;
  margin-bottom: 10px;
  color: #333;
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
}

.verification-code {
  display: flex;
  gap: 10px;
}

.send-code-btn {
  min-width: 120px;
  height: 45px;
  background: #f5f7fa;
  border-radius: 8px;
  transition: all 0.3s;
}

.send-code-btn:not(:disabled):hover {
  background: #e4e7ed;
}

.form-footer {
  margin-top: 30px;
}

.register-button {
  width: 100%;
  height: 45px;
  border-radius: 8px;
  font-size: 16px;
  margin-bottom: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  transition: all 0.3s;
}

.register-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.links {
  display: flex;
  justify-content: center;
  align-items: center;
}

.login-link {
  font-size: 14px;
  color: #667eea;
}

@media (max-width: 768px) {
  .register-box {
    width: 100%;
    max-width: 400px;
    height: auto;
    flex-direction: column;
  }

  .register-left {
    padding: 30px;
  }

  .register-right {
    padding: 30px;
  }
}
</style>