<template>
    <div class="common-layout">
        <el-header class="header-container">
            <div class="header">
                <!-- logo -->
                <div class="logo-container">
                    <img src="../assets/imgs/电影.png" alt="" class="logo-icon">
                    <img src="../assets/imgs/标题.png" alt="" class="logo-text">
                </div> 

                <!-- 导航菜单 -->
                <div class="nav-container">
                    <el-menu
                        :default-active="$route.path"
                        class="nav-menu"
                        mode="horizontal"
                        router
                        :ellipsis="false"
                        background-color="transparent"
                        text-color="#fff"
                        active-text-color="#409EFF"
                    >
                        <el-menu-item index="/home">
                            <el-icon><House /></el-icon>
                            首页
                        </el-menu-item>
                        <el-menu-item v-if="store.isLoggedIn" index="/recommend">
                            <el-icon><Star /></el-icon>
                            猜你想看
                        </el-menu-item>
                        <el-menu-item index="/pointsMall">
                            <el-icon><Present /></el-icon>
                            积分商城
                        </el-menu-item>
                    </el-menu>
                </div>

                <!-- 用户菜单 -->
                <div class="user-container">
                    <el-dropdown trigger="hover">
                        <div class="user-info">
                            <el-avatar 
                                :size="40" 
                                :src="store.isLoggedIn && store.loginInfo?.user?.avatar ? store.loginInfo.user.avatar : circleUrl"
                                class="user-avatar"
                            />
                            <span class="user-name">
                                {{ store.isLoggedIn && store.loginInfo?.user?.name ? store.loginInfo.user.name : '请登录' }}
                            </span>
                            <el-icon class="el-icon--right"><CaretBottom /></el-icon>
                        </div>
                        <template #dropdown>
                            <el-dropdown-menu class="user-dropdown">
                                <template v-if="store.isLoggedIn">
                                    <el-dropdown-item>
                                        <div class="dropdown-item" @click="goToPersonCenter">
                                            <el-icon><User /></el-icon>
                                            个人信息
                                        </div>
                                    </el-dropdown-item>
                                    <el-dropdown-item divided>
                                        <div class="dropdown-item danger" @click="logout">
                                            <el-icon><SwitchButton /></el-icon>
                                            退出登录
                                        </div>
                                    </el-dropdown-item>
                                </template>
                                <template v-else>
                                    <el-dropdown-item>
                                        <div class="dropdown-item" @click="$router.push('/login')">
                                            <el-icon><Key /></el-icon>
                                            登录
                                        </div>
                                    </el-dropdown-item>
                                    <el-dropdown-item>
                                        <div class="dropdown-item" @click="$router.push('/register')">
                                            <el-icon><Edit /></el-icon>
                                            注册
                                        </div>
                                    </el-dropdown-item>
                                </template>
                            </el-dropdown-menu>
                        </template>
                    </el-dropdown>
                </div>  
            </div>
        </el-header>
        <el-container>
            <el-main class="main-container">
                <div class="main-content">
                    <router-view></router-view>
                </div>
            </el-main>
        </el-container>
        <el-footer class="footer">
            <div class="footer-content">
                © 2024 FilmVerse. All rights reserved.
            </div>
        </el-footer>
    </div>
</template>

<script setup>
import { reactive, ref, toRefs } from "vue";
import { useUserStore } from "@/stores/user"
import router from "@/router"
import request from "@/utils/request";
import { ElMessage } from 'element-plus'
import { 
    House, 
    Star, 
    Present, 
    User, 
    Lock, 
    SwitchButton, 
    Key, 
    Edit,
    CaretBottom 
} from '@element-plus/icons-vue'

const state = reactive({
    circleUrl: 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'
})

const { circleUrl } = toRefs(state)

const store = useUserStore()

const goToPersonCenter = () => {
    if (!store.isLoggedIn) {
        ElMessage.warning('请先登录')
        router.push('/login')
        return
    }
    router.push('/personCenter')
}

const logout = () => {
    if (!store.isLoggedIn || !store.loginInfo?.user?.uid) {
        ElMessage.warning('您还未登录')
        return
    }
    
    request.get('/logout/' + store.loginInfo.user.uid).then(res => {   
        if(res.code === '200'){
            store.logout();
            localStorage.removeItem("user")
            router.push('/')
            ElMessage.success('退出成功')
        } else {
            ElMessage.error(res.msg)
        }
    })
}
</script>

<style scoped>
.header-container {
    padding: 0;
    background-color: #1a1a1a;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    position: fixed;
    width: 100%;
    z-index: 1000;
}

.header {
    max-width: 1400px;
    margin: 0 auto;
    height: 60px;
    display: flex;
    align-items: center;
    padding: 0 20px;
}

.logo-container {
    display: flex;
    align-items: center;
    gap: 10px;
}

.logo-icon {
    width: 30px;
    height: 30px;
}

.logo-text {
    height: 24px;
}

.nav-container {
    flex: 1;
    margin-left: 40px;
}

.nav-menu {
    border: none;
}

.nav-menu :deep(.el-menu-item) {
    height: 60px;
    line-height: 60px;
    padding: 0 24px;
    font-size: 15px;
    color: #fff;
    transition: all 0.3s;
}

.nav-menu :deep(.el-menu-item.is-active) {
    background-color: rgba(64, 158, 255, 0.1);
    color: #409EFF !important;
    font-weight: 500;
}

.nav-menu :deep(.el-menu-item:not(.is-active):hover) {
    background-color: rgba(255, 255, 255, 0.05);
    color: #fff !important;
}

.nav-menu :deep(.el-icon) {
    margin-right: 4px;
    font-size: 18px;
}

.user-container {
    margin-left: auto;
}

.user-info {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    padding: 5px 10px;
    border-radius: 40px;
    transition: all 0.3s;
}

.user-info:hover {
    background-color: rgba(255, 255, 255, 0.1);
}

.user-avatar {
    border: 2px solid rgba(255, 255, 255, 0.2);
}

.user-name {
    color: #fff;
    font-size: 14px;
    margin: 0 4px;
}

.user-dropdown {
    min-width: 150px;
}

.dropdown-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    font-size: 14px;
    cursor: pointer;
}

.dropdown-item .el-icon {
    font-size: 16px;
}

.dropdown-item:hover {
    background-color: #f5f7fa;
}

.dropdown-item.danger {
    color: #f56c6c;
}

.dropdown-item.danger:hover {
    background-color: #fef0f0;
}

:deep(.el-dropdown-menu__item:not(.is-disabled):hover) {
    background-color: transparent;
}

.main-container {
    margin-top: 60px;
    min-height: calc(100vh - 120px);
    background-color: #121212;
    padding: 0;
}

.main-content {
    max-width: 1400px;
    margin: 0 auto;
    padding: 20px;
}

.footer {
    background-color: #1a1a1a;
    height: 60px !important;
    display: flex;
    align-items: center;
    justify-content: center;
}

.footer-content {
    color: #666;
    font-size: 14px;
}
</style>