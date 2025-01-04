import { defineStore } from 'pinia'   // 导入 defineStore
import request from '@/utils/request'

// 你可以对 `defineStore()` 的返回值进行任意命名，但最好使用 store 的名字，
// 同时以 `use` 开头且以 `Store` 结尾。(比如 `useUserStore`，
// `useCartStore`，`useProductStore`)
// 第一个参数是你的应用中 Store 的唯一 ID。
export const useUserStore = defineStore('user', {
  state: () => ({ // 表示user对象
    loginInfo: null,
    isLoggedIn: false, // 添加登录状态
    refreshInterval: null
  }),
  getters: {
    getUserId() {
      return this.loginInfo?.user?.id || 0
    },
    getUser(){
      return this.loginInfo?.user || {}
    },
    getBearerToken() {
      return this.loginInfo?.token ? 'Bearer ' + this.loginInfo.token : ""
    },
    getToken() {
      return this.loginInfo?.token || ""
    }
  },
  
  actions: { // 可以用来存储数据
    updateUserInfo(loginInfo) {
      this.loginInfo = loginInfo;
      this.isLoggedIn = true; // 设置登录状态
    },
    setUser(user){
      if (this.loginInfo) {
        this.loginInfo.user = JSON.parse(JSON.stringify(user));
      }
    },
    logout() {
      this.loginInfo = null;
      this.isLoggedIn = false;
      this.stopAutoRefresh();
    },
    // 更新用户积分
    updateUserPoints(newPoints) {
      if (this.loginInfo?.user) {
        this.loginInfo.user.scope = newPoints;
      }
    }
  },
  // 开始数据持久化
  persist: true
})