<template>
    <div class="container-height">
        <div class="content-wrapper">
            <!-- 左侧个人信息 -->
            <div class="user-info-section">
                <el-form :model="user" label-width="80px">
                    <div class="avatar-section">
                        <el-upload
                            class="avatar-uploader"
                            :action="url"
                            :headers="state.headers"
                            :show-file-list="false"
                            :on-success="handleAvatarSuccess"
                        >
                            <img v-if="user.avatar" :src="user.avatar" class="avatar" />
                            <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
                        </el-upload>
                        <div class="user-name">{{ user.name }}</div>
                    </div>

                    <el-form-item label="用户名">
                        <el-input v-model="user.username" disabled />
                    </el-form-item>
                    <el-form-item label="姓名">
                        <el-input v-model="user.name" />
                    </el-form-item>
                    <el-form-item label="邮箱">
                        <el-input v-model="user.email" />
                    </el-form-item>
                    <el-form-item>
                        <el-button type="primary" @click="save">保存</el-button>
                    </el-form-item>
                </el-form>

                <div class="points-container">
                    <h2>我的积分</h2>
                    <div class="points-display">
                        <span class="points-number">{{ user.points }}</span>
                        <span class="points-label">积分</span>
                    </div>
                    <div class="points-info">每次观影评论获赞可获得积分</div>
                </div>
            </div>

            <!-- 右侧收藏列表 -->
            <div class="collections-section">
                <!-- 待看清单 -->
                <div class="list-section">
                    <h2>待看清单</h2>
                    <div v-if="watchlist.length === 0" class="empty-state">
                        暂无待看内容
                    </div>
                    <div v-else class="media-grid">
                        <div v-for="item in paginatedWatchlist" 
                             :key="item.movie?.id || item.tv?.id" 
                             class="media-card">
                            <img 
                                :src="`https://image.tmdb.org/t/p/w154${item.movie?.poster_path || item.tv?.poster_path}`" 
                                :alt="item.movie?.title || item.tv?.name"
                            />
                            <div class="media-info">
                                <div class="media-title">{{ item.movie?.title || item.tv?.name }}</div>
                                <div class="media-date">{{ item.movie?.release_date || item.tv?.first_air_date }}</div>
                                <el-button 
                                    type="danger" 
                                    size="small"
                                    @click="() => removeFromList(item.movie?.id || item.tv?.id, currentPage, 'watchlist')"
                                >
                                    移除
                                </el-button>
                            </div>
                        </div>
                    </div>
                    <el-pagination
                        v-if="watchlist.length > 0"
                        background
                        layout="prev, pager, next"
                        :total="watchlistTotalItems"
                        :page-size="pageSize"
                        @current-change="page => handlePageChange(page, 'watchlist')"
                    />
                </div>

                <!-- 收藏清单 -->
                <div class="list-section">
                    <h2>收藏清单</h2>
                    <div v-if="favorites.length === 0" class="empty-state">
                        暂无收藏内容
                    </div>
                    <div v-else class="media-grid">
                        <div v-for="item in paginatedfavorites" 
                             :key="item.movie?.id || item.tv?.id" 
                             class="media-card">
                            <img 
                                :src="`https://image.tmdb.org/t/p/w154${item.movie?.poster_path || item.tv?.poster_path}`" 
                                :alt="item.movie?.title || item.tv?.name"
                            />
                            <div class="media-info">
                                <div class="media-title">{{ item.movie?.title || item.tv?.name }}</div>
                                <div class="media-date">{{ item.movie?.release_date || item.tv?.first_air_date }}</div>
                                <el-button 
                                    type="danger" 
                                    size="small"
                                    @click="() => removeFromList(item.movie?.id || item.tv?.id, currentPage, 'favorites')"
                                >
                                    移除
                                </el-button>
                            </div>
                        </div>
                    </div>
                    <el-pagination
                        v-if="favorites.length > 0"
                        background
                        layout="prev, pager, next"
                        :total="favoritesTotalItems"
                        :page-size="pageSize"
                        @current-change="page => handlePageChange(page, 'favorites')"
                    />
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { reactive,ref, computed, onMounted } from 'vue'

import request from '@/utils/request'
import { useUserStore } from "@/stores/user"
import config from "/config"
import {Plus,User,Message,Histogram} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
const router = useRouter()
const url = ref('http://' + config.serverUrl + "/file/upload")
const userstore = useUserStore()
const watchlist = ref([])
const favorites = ref([])
const currentPage = ref(1)
const totalItems = ref(0)
const pageSize = 5
const user = reactive({
    points: 0
})
const name = ''

const watchlistPage = ref(1);
const watchlistTotalItems = ref(0);

const favoritesPage = ref(1);
const favoritesTotalItems = ref(0);

const loadUser = () => {
    request.get('/user/' + userstore.getUserId).then(res => {
        console.log('Response data:', res.data);
        Object.assign(user, res.data);
        user.points = res.data.scope || 0;
    });
};

// 确保只在组件初始化时调用
onMounted(() => {
    loadUser();
    loadList('watchlist', watchlist, watchlistPage, watchlistTotalItems); // 加载待看清单
    loadList('favorites', favorites, favoritesPage, favoritesTotalItems); // 加载收藏清单
});

const loadList = (listType, listRef, pageRef, totalItemsRef) => {
    const endpoint = listType === 'watchlist' ? '/watchlist/page' : '/favoritelist/page';
    request.get(endpoint, {
        params: {
            pageNum: pageRef.value,
            pageSize: pageSize,
            userId: userstore.getUserId
        }
    }).then(res => {
        if (res.code === '200') {
            listRef.value = res.data.records;
            totalItemsRef.value = res.data.total;
        } else {
            ElMessage.error(res.msg);
        }
    });
};

const state = reactive({
    headers: {
        Authorization: userstore.getBearerToken
    }
})

const handleAvatarSuccess = (res) => {
    if (res.code === '200') {
        user.avatar = res.data + "?loginId=" + userstore.getUser.uid + "&token=" + userstore.getToken
        request.get('/user/' + userstore.getUserId).then(response => {
            if (response.code === '200') {
                userstore.setUser(response.data)
            }
        })
        ElMessage.success('更新成功')
    } else {
        ElMessage.error('上传失败')
    }
}

const save = () => {
    request.put('/user',user).then(res => {
        if(res.code === '200') {
            ElMessage.success('保存成功')
            userstore.setUser(user)
        } else {
            ElMessage.error(res.msg)
        }
    })
}

const paginatedWatchlist = computed(() => {
    return watchlist.value;
})

const paginatedfavorites = computed(() => {
    return favorites.value;
})

const handlePageChange = (page, listType) => {
    if (listType === 'watchlist') {
        watchlistPage.value = page;
        loadList('watchlist', watchlist, watchlistPage, watchlistTotalItems);
    } else {
        favoritesPage.value = page;
        loadList('favorites', favorites, favoritesPage, favoritesTotalItems);
    }
};

const removeFromList = (Idtype, page, listType) => {
    const endpoint = listType === 'watchlist' ? `/watchlist/${Idtype}` : `/favoritelist/${Idtype}`;
    request.delete(`${endpoint}?page=${page}`).then(res => {
        if (res.code === '200') {
            ElMessage.success('移除成功');
            if (listType === 'watchlist') {
                loadList('watchlist', watchlist, watchlistPage, watchlistTotalItems);
            } else {
                loadList('favorites', favorites, favoritesPage, favoritesTotalItems);
            }
        }
    });
};


</script>

<style scoped>
.container-height {
    min-height: calc(100vh - 60px);
    background-color: #f5f5f5;
    padding: 20px;
}

.content-wrapper {
    max-width: 1400px;
    margin: 0 auto;
    display: flex;
    gap: 20px;
}

/* 左侧个人信息区域 */
.user-info-section {
    width: 360px;
    flex-shrink: 0;
}

.avatar-section {
    text-align: center;
    margin-bottom: 30px;
}

.avatar {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    border: 3px solid #fff;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
    margin-bottom: 15px;
}

.user-name {
    font-size: 20px;
    font-weight: 500;
    color: #333;
    margin-top: 10px;
}

.el-form {
    background: white;
    padding: 30px;
    border-radius: 8px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
    margin-bottom: 20px;
}

.points-container {
    background: white;
    padding: 30px;
    border-radius: 8px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.points-display {
    display: flex;
    align-items: baseline;
    gap: 10px;
    margin: 15px 0;
}

.points-number {
    font-size: 36px;
    font-weight: bold;
    color: #409EFF;
}

.points-label {
    font-size: 16px;
    color: #666;
}

.points-info {
    font-size: 14px;
    color: #999;
}

/* 右侧收藏区域 */
.collections-section {
    flex: 1;
    min-width: 0;
}

.list-section {
    background: white;
    padding: 30px;
    border-radius: 8px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
    margin-bottom: 20px;
}

.list-section h2 {
    font-size: 20px;
    color: #333;
    margin-bottom: 20px;
    font-weight: 500;
}

.media-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 20px;
    margin-bottom: 20px;
}

.media-card {
    background: white;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transition: transform 0.3s;
}

.media-card:hover {
    transform: translateY(-5px);
}

.media-card img {
    width: 100%;
    aspect-ratio: 2/3;
    object-fit: cover;
}

.media-info {
    padding: 12px;
}

.media-title {
    font-size: 14px;
    font-weight: 500;
    color: #333;
    margin-bottom: 6px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.media-date {
    font-size: 12px;
    color: #999;
    margin-bottom: 10px;
}

.empty-state {
    text-align: center;
    padding: 40px;
    color: #999;
    background: #f9f9f9;
    border-radius: 8px;
}

.el-pagination {
    margin-top: 20px;
    text-align: center;
}

/* 响应式布局 */
@media (max-width: 1200px) {
    .content-wrapper {
        flex-direction: column;
    }

    .user-info-section {
        width: 100%;
    }

    .media-grid {
        grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    }
}

@media (max-width: 768px) {
    .container-height {
        padding: 10px;
    }

    .el-form, .points-container, .list-section {
        padding: 20px;
    }

    .media-grid {
        grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
        gap: 15px;
    }
}
</style>