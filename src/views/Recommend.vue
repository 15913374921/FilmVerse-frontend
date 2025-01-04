<template>
  <div class="page-container">
    <div class="main-content">
      <v-container fluid class="content-container">
        <!-- 选择器 -->
        <div class="selector-wrapper">
          <div class="selector-tabs">
            <div 
              class="tab-item" 
              :class="{ active: selectedType === 'movie' }"
              @click="selectedType = 'movie'"
            >
              电影
            </div>
            <div 
              class="tab-item" 
              :class="{ active: selectedType === 'tv' }"
              @click="selectedType = 'tv'"
            >
              剧集
            </div>
          </div>
        </div>

        <!-- 推荐列表 -->
        <div class="content-wrapper">
          <div class="movie-grid">
            <div
              v-for="(item, index) in currentItems"
              :key="index"
              class="movie-card"
            >
              <div class="image-content">
                <img
                  :src="`https://image.tmdb.org/t/p/w300${item.mediaDetail.poster_path}`"
                  class="poster-image"
                  :alt="getTitle(item)"
                />
              </div>
              <div class="movie-info">
                <div class="movie-title">{{ getTitle(item) }}</div>
                <p class="release-date">{{ formatDate(getReleaseDate(item)) }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 分页 -->
        <div class="pagination-wrapper">
          <el-pagination
            v-if="totalItems > 0"
            :current-page="currentPage"
            :page-size="itemsPerPage"
            :total="totalItems"
            @current-change="handlePageChange"
            background
            layout="prev, pager, next"
          />
        </div>
      </v-container>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import request from '@/utils/request';
import { ElMessage } from 'element-plus';
import { useUserStore } from '@/stores/user';

const selectedType = ref('movie');
const currentPage = ref(1);
const itemsPerPage = ref(30);
const totalItems = ref(0);
const movies = ref([]);
const tvShows = ref([]);
const userStore = useUserStore();

const getTitle = (item) => {
  return item.type === 'movie' ? item.mediaDetail.title : item.mediaDetail.name;
};

const getReleaseDate = (item) => {
  return item.type === 'movie' ? item.mediaDetail.release_date : item.mediaDetail.first_air_date;
};

const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.getFullYear() + '-' + (d.getMonth() + 1).toString().padStart(2, '0') + '-' + d.getDate().toString().padStart(2, '0');
};

onMounted(() => {
  fetchRecommendations();
});

const fetchRecommendations = async () => {
  try {
    const res = await request.get('/ratings/recommend/page', {
      params: {
        pageNum: currentPage.value,
        pageSize: itemsPerPage.value,
        userId: userStore.getUserId,
        type: selectedType.value
      }
    });

    if (res.code === '200') {
      totalItems.value = res.data.total;
      // 分类存储电影和剧集
      const items = res.data.records;
      items.forEach(item => {
        if (item.type === 'movie') {
          movies.value.push(item);
        } else if (item.type === 'tv') {
          tvShows.value.push(item);
        }
      });
    } else {
      ElMessage.error(res.msg);
    }
  } catch (error) {
    console.error('Fetch error:', error);
  }
};

const currentItems = computed(() => {
  return selectedType.value === 'movie' ? movies.value : tvShows.value;
});

const handlePageChange = (page) => {
  currentPage.value = page;
  fetchRecommendations();
};

watch(selectedType, () => {
  currentPage.value = 1;
  movies.value = []; // 清空数组
  tvShows.value = []; // 清空数组
  fetchRecommendations();
});
</script>

<style scoped>
.page-container {
  width: 100%;
  min-height: 100vh;
  background-color: rgb(3, 37, 65);
  display: flex;
  justify-content: center;
  padding: 30px 0;
}

.main-content {
  background: #fff;
  width: 100%;
  max-width: 1300px;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.content-container {
  padding: 30px 60px !important;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.content-wrapper {
  flex: 1;
  min-height: 600px;
}

.movie-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 40px 45px;
  padding: 20px;
  margin: 0;
  justify-content: flex-start;
}

.movie-card {
  width: 150px;
  position: relative;
  cursor: pointer;
  margin: 0;
}

.image-content {
  position: relative;
  width: 150px;
  border-radius: 8px;
  overflow: hidden;
  background: #dbdbdb;
  aspect-ratio: 2/3;
}

.poster-image {
  width: 150px;
  height: 225px;
  object-fit: cover;
  transition: transform 0.2s ease;
}

.movie-card:hover .poster-image {
  transform: scale(1.05);
}

.movie-info {
  padding: 12px 4px 0;
  text-align: center;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.movie-title {
  font-size: 1em;
  font-weight: 700;
  color: #000;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  text-align: center;
  width: 85%;
  text-decoration: none;
  margin: 0;
  line-height: 1.2;
  max-height: 2.4em;
}

.release-date {
  font-size: 0.9em;
  color: rgba(0,0,0,0.6);
  margin: 4px 0 0;
  text-align: center;
  width: 85%;
  display: block;
}

.pagination-wrapper {
  padding: 30px 0;
  display: flex;
  justify-content: center;
  width: 100%;
  background: #fff;
  border-top: 1px solid #eee;
  margin-top: auto;
}

:deep(.el-pagination.is-background .el-pager li:not(.is-disabled).is-active) {
  background-color: #01b4e4;
}

/* 选择器样式优化 */
.v-select {
  max-width: 200px;
}

.selector-wrapper {
  margin-bottom: 30px;
}

.selector-tabs {
  display: flex;
  gap: 20px;
  border-bottom: 1px solid #e3e3e3;
  padding-bottom: 20px;
}

.tab-item {
  font-size: 1.2em;
  font-weight: 600;
  color: #666;
  cursor: pointer;
  padding: 8px 16px;
  border-radius: 20px;
  transition: all 0.3s ease;
}

.tab-item:hover {
  color: #01b4e4;
}

.tab-item.active {
  color: #fff;
  background-color: #01b4e4;
}
</style>
