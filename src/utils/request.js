import { ElMessage } from 'element-plus'
import router from '../router'
import axios from "axios"
import config from "/config"
import { useUserStore } from "@/stores/user"

const request = axios.create({
    baseURL: `http://${config.serverUrl}`,
    timeout: 5000
})

request.interceptors.request.use(config => {
    config.headers['Content-Type'] = 'application/json;charset=utf-8';
    config.headers['Authorization'] = useUserStore().getBearerToken;
    return config
}, error => {
    return Promise.reject(error)
});

// response拦截器
// 可以在接口响应后统一处理结果
request.interceptors.response.use(
    response => {
        let res = response.data;
        // 如果返回的是文件
        if(response.config.responseType === 'blob') {
            return res
        }

        // 兼容服务端返回的字符串数据
        if(typeof res === 'string'){
            res = res ? JSON.parse(res) : res
        }
        // 当权限验证不通过的时候给出提示
        if(res.code === '401'){
            ElMessage.error(res.msg);
            router.push("/login")
        }
        return res;
    },
    error => {
        console.log('err' + error)
        return Promise.reject(error)
    }
)

export default request