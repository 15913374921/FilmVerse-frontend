<template>
  <div class="search-bar">
    <div class="search-controls">
      <el-select v-model="searchType" placeholder="Select type" class="custom-select">
        <el-option label="Movies" value="movies"></el-option>
        <el-option label="TV Shows" value="tvshows"></el-option>
      </el-select>
      <div class="input-wrapper">
        <el-input
          v-model="query"
          placeholder="请输入电影或剧集"
          @keyup.enter="performSearch"
          clearable
          prefix-icon="el-icon-search"
          class="custom-input"
        />
      </div>
      <el-button type="primary" @click="performSearch" class="custom-button">搜索</el-button>
    </div>
    
    <div v-if="searchResults.length > 0" class="results">
      <div v-for="item in searchResults" :key="item.id" class="result-item">
        <img 
          :src="`https://image.tmdb.org/t/p/w92${item.poster_path}`" 
          :alt="item.title || item.name" 
          @click="viewDetails(item.id, searchType)" 
        />
        <div class="result-details">
          <h3 @click="viewDetails(item.id, searchType)">
            {{ item.title || item.name }}（{{ item.original_title || item.original_name }}）
          </h3>
          <p><strong>Release Date:</strong> {{ item.release_date || item.first_air_date }}</p>
          <p class="overview">{{ item.overview }}</p>
        </div>
      </div>
    </div>

    <el-pagination
      v-if="totalResults > 0"
      :current-page="currentPage"
      :page-size="pageSize"
      :total="totalResults"
      @current-change="handlePageChange"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import request from '@/utils/request';
import { ElMessage } from 'element-plus';

const query = ref('');
const searchType = ref('movies');
const router = useRouter();
const route = useRoute();
const currentPage = ref(1);
const pageSize = ref(20);
const totalResults = ref(0);
const searchResults = ref([]);

onMounted(() => {
  query.value = route.query.q || '';
  currentPage.value = parseInt(route.query.pageNum) || 1;
  performSearch();
});

const performSearch = async () => {
  if (query.value.trim()) {
    try {
      const res = await request.get('/SearchMovieTv', {
        params: {
          q: query.value,
          type: searchType.value,
          pageNum: currentPage.value,
          pageSize: pageSize.value
        }
      });

      if (res.code === '200') {
        totalResults.value = res.data.total;
        searchResults.value = res.data.records;
      } else {
        ElMessage.error(res.msg);
      }
    } catch (error) {
      console.error('Search error:', error);
    }
  }
};

const handlePageChange = (page) => {
  currentPage.value = page;
  performSearch();
};

const viewDetails = (id, type) => {
  const convertedType = type === 'movies' ? 'movie' : 'tv';
  router.push({ name: 'MovieDetail', params: { id, type: convertedType } });
};
</script>

<style scoped>
body {
  background: linear-gradient(to right, #ece9e6, #ffffff);
  font-family: 'Arial', sans-serif;
}

.search-bar {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 20px 0;
  padding: 20px;
  background-color: #f9f9f9;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  width: 100%;
}

.search-controls {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 20px;
}

.input-wrapper {
  position: relative;
  width: 400px;
}

.custom-select {
  width: 200px;
  border-radius: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.custom-input {
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  background-color: #fff;
  border: 1px solid #ddd;
}

.custom-button {
  border-radius: 20px;
  background: linear-gradient(45deg, #6b8cff, #3b6cff);
  color: #fff;
  border: none;
  transition: background-color 0.3s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 10px 20px;
}

.custom-button:hover {
  background-color: #0056b3;
}

.results {
  width: 100%;
  max-width: 800vh;
  margin: 0 auto;
}

.result-item {
  display: flex;
  align-items: flex-start;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
  padding: 15px;
  transition: transform 0.2s;
  width: 100%;
}

.result-item:hover {
  transform: translateY(-5px);
}

.result-item img {
  width: 100px;
  height: auto;
  border-radius: 8px;
  margin-right: 20px;
  transition: transform 0.3s;
}

.result-item img:hover {
  transform: scale(1.1);
  cursor: pointer;
}

.result-details {
  flex: 1;
}

.result-details h3 {
  margin: 0;
  font-size: 1.2em;
  color: #333;
  transition: color 0.3s;
}

.result-details h3:hover {
  color: gray;
  cursor: pointer;
}

.result-details p {
  margin: 5px 0;
  color: #666;
}

.overview {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style> 