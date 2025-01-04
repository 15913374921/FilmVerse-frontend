<template>
  <div class="content_list content-box">
    <div class="trailer-section">
      <h2 class="section-title">热门电视电影预告片</h2>
      <div class="tags">
        <span @click="filterByType('movie')" :class="{ active: selectedType === 'movie' }" class="button">电影</span>
        <span @click="filterByType('tv')" :class="{ active: selectedType === 'tv' }" class="button">电视</span>
      </div>
      <div class="trailer-content">
        <div class="trailer-preview">
          <div class="thumbnail-container" @click="playTrailer(selectedTrailer.filePath)">
            <img v-if="selectedTrailer" :src="`https://image.tmdb.org/t/p/original${selectedTrailer.backdrop_path}`" alt="预告片缩略图" class="thumbnail" />
            <div v-if="selectedTrailer" class="play-overlay">
              <span class="play-icon">▶</span>
            </div>
            <img v-else :src="defaultThumbnail" alt="默认预告片缩略图" class="thumbnail" />
          </div>
        </div>
        <div class="poster-list">
          <div
            class="poster-item"
            v-for="trailer in filteredTrailers"
            :key="trailer.key"
            @click="selectTrailer(trailer)"
          >
            <img :src="`https://image.tmdb.org/t/p/w500${trailer.backdrop_path}`" alt="影片海报" class="poster-image" />
            <h4 class="movie-title">{{ trailer.movieTitle }}</h4>
          </div>
        </div>
      </div>
    </div>
    <div v-if="showModal" class="modal" @click="closeModal">
      <div class="modal-content" @click.stop>
        <span class="close" @click="closeModal">&times;</span>
        <iframe
          width="100%"
          height="100%"
          :src="`https://www.youtube.com/embed/${selectedTrailer.key}`"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
          class="modal-video"
        ></iframe>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useMovieStore } from '@/stores/movie'; // 引入 movie store
import { useTvStore } from '@/stores/tv'; // 引入 tv store
import request from '@/utils/request';
const movieStore = useMovieStore(); // 创建 movie store 实例
const tvStore = useTvStore(); // 创建 tv store 实例
const selectedType = ref('movie');
const selectedTrailer = ref(null);
const showModal = ref(false);
const defaultThumbnail = 'https://via.placeholder.com/300x150'; 

const fetchTrailers = async () => {
  // 如果 trailers 为空，则从 store 中获取
  await request.get('/movie/trailerList').then(res => {
    if (res.code === '200') {
      movieStore.setTrailers(res.data);
    }
  });
  await request.get('/tv/trailerList').then(res => {
    if (res.code === '200') {
      console.log(res.data);
      tvStore.setTrailers(res.data);
    }
  });
};

const filteredTrailers = computed(() => {
  return selectedType.value === 'movie' ? movieStore.getTrailers : tvStore.getTrailers; // 根据选中的类型返回相应的预告片
});

const filterByType = (type) => {
  selectedType.value = type; // 切换类型
  if (type === 'movie' && filteredTrailers.value.length > 0) {
    selectedTrailer.value = filteredTrailers.value[0]; // 切换到电影时选择第一个电影预告片
  } else if (type === 'tv' && filteredTrailers.value.length > 0) {
    selectedTrailer.value = filteredTrailers.value[0]; // 切换到电视时选择第一个电视预告片
  }
};

const selectTrailer = (trailer) => {
  selectedTrailer.value = trailer;
};

const playTrailer = (videoUrl) => {
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
};

onMounted(() => {
  fetchTrailers(); // 在组件加载时获取预告片
  selectedType.value = 'movie'; // 默认选择电影
  // 设置默认的 selectedTrailer
  if (movieStore.getTrailers.length > 0) {
    selectedTrailer.value = movieStore.getTrailers[0]; // 默认选择第一个电影预告片
  }
});
</script>

<style scoped>
.trailer-section {
  padding: 20px;
  color: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 1);
  width: 100%; 
  height: auto; 
  overflow: hidden; 
  margin-bottom: 20px; 
}

.section-title {
  font-size: 28px;
  margin-bottom: 15px;
  text-align: left; /* 标题靠左 */
}

.tags {
  display: flex;
  justify-content: flex-start; /* 按钮靠左 */
  margin-bottom: 20px;
}

.tags span {
  margin: 0 10px;
  cursor: pointer;
  padding: 8px 20px; /* 调整按钮的内边距 */
  border: 2px solid transparent;
  border-radius: 50px; /* 椭圆形按钮 */
  background-color: #333;
  color: white; /* 按钮文字颜色 */
  transition: background-color 0.3s, border-color 0.3s;
}

.tags span.active {
  background-color: #007bff;
  border-color: #0056b3;
  color: white;
}

.trailer-content {
  display: flex;
  height: 100%; /* 确保内容高度为100% */
}

.trailer-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 75%;

}

.thumbnail-container {
  position: relative; /* 使遮罩层相对于容器定位 */
  cursor: pointer; /* 鼠标悬停时显示为可点击 */
}

.thumbnail {
  width: 100%;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}

.play-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.5); /* 半透明背景 */
  border-radius: 8px;
  opacity: 0; /* 初始透明度 */
  transition: opacity 0.3s; /* 过渡效果 */
}

.thumbnail-container:hover .play-overlay {
  opacity: 1; /* 悬停时显示遮罩层 */
}

.play-icon {
  font-size: 48px; /* 播放图标大小 */
  color: white; /* 播放图标颜色 */
}

.poster-list {
  width: 300px;
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow-y: auto; 
  max-height: 520px; 
  padding-right: 15px;

}

/* 自定义滚动条样式 */
.poster-list::-webkit-scrollbar {
  width: 6px; /* 设置滚动条的宽度 */
}

.poster-list::-webkit-scrollbar-thumb {
  background-color: #888; /* 滚动条的颜色 */
  border-radius: 10px; /* 滚动条的圆角 */
}

.poster-list::-webkit-scrollbar-thumb:hover {
  background-color: #555; /* 悬停时的颜色 */
}

.poster-list::-webkit-scrollbar-track {
  background: #f1f1f1; /* 滚动条轨道的颜色 */
}

.poster-item {
  margin: 5px 0; /* 减少每个海报项的底部边距 */
  cursor: pointer;
  transition: transform 0.3s;
  display: flex;
  flex-direction: column; 
  align-items: center; 
}

.poster-item:hover {
  transform: scale(1.05);
}

.poster-image {
  width: 250px; /* 设置海报的宽度 */
  height: auto; /* 自适应高度 */
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}

/* 电影标题样式 */
.movie-title {
  white-space: nowrap; /* 不换行 */
  overflow: hidden; /* 隐藏溢出内容 */
  text-overflow: ellipsis; /* 使用省略号表示溢出 */
  width: 250px; /* 增大标题的宽度 */
  font-size: 16px; /* 增大字体大小 */
  text-align: center; /* 标题居中对齐 */
}

/* Modal样式 */
.modal {
  display: flex;
  position: fixed;
  z-index: 1000;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  overflow: auto;
  background-color: rgba(0, 0, 0, 0.8);
}

.modal-content {
  position: relative;
  width: 80%; /* 设置宽度 */
  height: 80%; /* 设置高度 */
  margin: auto;
  background-color: transparent; /* 去掉白色背景 */
}

.close {
  color: #aaa;
  float: right;
  font-size: 28px;
  font-weight: bold;
}

.close:hover,
.close:focus {
  color: black;
  text-decoration: none;
  cursor: pointer;
}

.modal-video {
  width: 100%;
  height: 100%;
  border: none; /* 去掉边框 */
}
</style>
