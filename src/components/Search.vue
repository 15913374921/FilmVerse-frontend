<template>
  <div class="content_list" :style="backgroundStyle">
    <div class="overlay"></div>
    <div class="titleSer">
      <h2>FilmVerse —————— 电影的世界，从这里开始</h2>
      <div class="search-container">
        <el-input
          v-model="searchQuery"
          style="flex: 1; height: 45px; text-align: center; overflow: hidden;"
          placeholder="搜索电影、剧集、人物..."
          @keyup.enter="performSearch"
        />
        <el-button class="search-button" @click="performSearch">搜索</el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useMovieStore } from '@/stores/movie';
import { useTvStore } from "@/stores/tv";
import request from '@/utils/request'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'

const movieStore = useMovieStore();
const tvStore = useTvStore();
const router = useRouter();

const backgroundStyle = computed(() => {
  const randomNum = Math.floor(Math.random() * 20);
  const backdropPath = movieStore.getMovieId(randomNum)?.backdrop_path;
  return {
    backgroundImage: backdropPath ? `url(https://image.tmdb.org/t/p/w1280${backdropPath})` : 'linear-gradient(to right, #ff8177 0%, #ff867a 0%, #ff8c7f 21%, #f99185 52%, #cf556c 78%, #b12a5b 100%)',
    height: '400px',
  };
});

const searchQuery = ref('');

const performSearch = () => {
  if (searchQuery.value.trim()) {
    router.push({
      name: 'SearchResults',
      query: { q: searchQuery.value, pageNum: 1 }
    });
  }
};

const loadContent = async () => {
  try {
    const [popularRes] = await Promise.all([
    request.get('/movie', { params: { type: 'POPULAR' } }),
      request.get('/tv', { params: { type: 'POPULAR' } })
    ]);

    if(popularRes.code === '200') {
      movieStore.setPopularMovies(popularRes.data);
    }

    if(popularRes.code === '200') {
      tvStore.setPopularTvs(popularRes.data);
    }
  } catch (err) {
    ElMessage.error(err);
  }
};
onMounted(loadContent);
</script>

<style scoped>
.content_list {
  width: 1280px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px 0;
  position: relative;
  overflow: hidden;
  max-width: var(--maxPrimaryPageWidth);
}

.overlay {
  filter: blur(5px);
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.5));
  z-index: 1;
}

.titleSer {
  display: flex;
  width: 80%;
  max-width: 800px;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: white;
  position: relative;
  z-index: 2;
  padding: 20px;
}

:deep(.el-input__wrapper) {
  border-radius: 50px !important;
}

.search-container {
  position: relative;
  width: 100%;
  gap: 10px;
  align-items: center;
}

.search-button {
  border-radius: 50px;
  height: 45px;
  width: 80px;
  background-image: linear-gradient(to right, #74ebd5 0%, #9face6 100%);
  position: absolute;
  right: 0;
}
</style>
