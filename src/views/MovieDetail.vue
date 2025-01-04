<template>
  <transition name="fade" mode="out-in">
    <div v-if="loading" key="loading" class="loading-spinner">
      加载中...
    </div>
    <div v-else key="content" class="movie-detail">
      <div class="backdrop-container">
        <img :src="`https://image.tmdb.org/t/p/original${content.backdrop_path}`" alt="Backdrop" class="backdrop" />
        <div class="image-overlay"></div>
      </div>
      <div class="info-container">
        <div style="display: flex;">
          <div class="poster-container">
            <img :src="`https://image.tmdb.org/t/p/original${content.poster_path}`" alt="Poster" class="poster" />
          </div>
          <div class="movie-info">
            <div style="display: flex; align-items: center;">
              <h1 class="movie-title">{{ content.title || content.name }}</h1>
              <span class="runtime" v-if="content.runtime" style="font-size: 0.8em; margin-left: 10px;">时长 ：{{ content.runtime }} 分钟</span>
            </div>
            <p class="release-date">{{ content.release_date || content.first_air_date }} ({{ content.original_title || content.original_name }})</p>
            <div class="rating">
              <span>评分：</span>
              <span class="rating-value">{{ content.vote_average }}</span>
              <span class="rating-label">/ 10</span>
            </div>
            <div class="genres">
              <span v-for="genre in content.genres" :key="genre.id" class="genre">{{ genre.name }}</span>
            </div>
            <div style="display: flex; align-items: center; margin-bottom: 20px; margin-top: 15px;">
              <h2 style="margin: 0;">剧情简介</h2>
              <el-button 
                  type="primary" 
                  size="small" 
                  @click="addToFavorites"
                  style="margin-left: 10px;"
              >
                  收藏
              </el-button>
              <el-button 
                  type="success" 
                  size="small" 
                  @click="addToWatchlist"
                  style="margin-left: 10px;"
              >
                  加入待看清单
              </el-button>
              <el-rate 
                ref="rateComponent"
                v-model="starRating" 
                :max="5" 
                :allow-half="true" 
                size="large"
                style="margin-left: 10px;"
                @change="handleRateChange"
              />
              <button ref="focusTrap" style="position: absolute; left: -9999px;">Focus Trap</button>
            </div>
            <p style="font-size: 15px;">{{ content.overview || '暂无剧情简介' }}</p>
            <div class="streaming-services">
              <h2 style="display: inline-block; margin-right: 10px;">观看平台</h2>
              <div style="display: inline-block;">
                <ul style="display: flex; align-items: center; padding: 0; margin: 0;">
                  <li v-if="streamingServices.length === 0" style="list-style: none;">暂无观看平台信息</li>
                  <li v-for="service in streamingServices" :key="service.provider_id" style="list-style: none; margin-right: 5px;">
                    <img :src="`https://image.tmdb.org/t/p/w45${service.logo_path}`" style="width: 35px; height: auto; border-radius: 10%;" alt="Streaming Service Logo" class="streaming-logo" />
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div class="cast-info">
          <h2>演员·信息</h2>
          <el-scrollbar class="cast-scrollbar">
            <div class="scrollbar-flex-content">
              <div v-if="cast.length === 0">暂无演员信息</div>
              <div v-for="actor in cast" :key="actor.id" class="cast-member">
                <template v-if="actor.profile_path">
                  <img 
                    :src="`https://image.tmdb.org/t/p/w185${actor.profile_path}`"
                    :alt="actor.name"
                    class="cast-photo"
                  />
                </template>
                <template v-else>
                  <div class="avatar-placeholder">{{ actor.name.charAt(0) }}</div>
                </template>
                <div class="cast-details">
                  <div class="actor-name">{{ actor.name || '暂无演员信息' }}</div>
                </div>
              </div>
            </div>
          </el-scrollbar>
        </div>
        <div class="similar-movies">
          <h2>相似电影推荐</h2>
          <el-scrollbar class="similar-scrollbar" style="height: 320px;">
            <div class="scrollbar-flex-content">
              <div v-if="similarMovies.length === 0">暂无相似电影推荐</div>
              <div v-for="movie in similarMovies" :key="movie.id" class="similar-movie" style="margin-right: 20px; display: inline-block;">
                <img 
                  v-if="movie.poster_path"
                  :src="`https://image.tmdb.org/t/p/w154${movie.poster_path}`"
                  :alt="movie.title"
                  class="movie-poster"
                  @click="viewDetails(movie.id)"
                />
                <div v-else class="poster-placeholder">
                  暂无海报
                </div>
                <div class="movie-details" style="font-size: 15px;">
                  <div class="movie-name">{{ movie.title || movie.name }}</div>
                  <div class="movie-rating">{{ movie.vote_average.toFixed(1) }} / 10</div>
                </div>
              </div>
            </div>
          </el-scrollbar>
        </div>
      </div>
      <div class="comments-section">
        <Comments />
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Comments from '../components/Comments.vue';
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus';
import request from '@/utils/request';

const route = useRoute();
const router = useRouter();
const movieTvId = ref(route.params.id);
const contentType = ref(route.params.type);
const content = ref({});
const streamingServices = ref([]);
const cast = ref([]);
const similarMovies = ref([]);
const loading = ref(true);
const error = ref(null);
const userStore = useUserStore();
const starRating = ref(0);
const ratingExists = ref(false); // 用于记录评分是否存在


// 计算实际评分（0-10分）
const actualRating = computed(() => starRating.value * 2);

const fetchDetails = async () => {
  loading.value = true;
  try {
    if (contentType.value === 'movie') {

      const response = await request.get(`/movieTv/${movieTvId.value}/detail`, {
        params: {
          type: 'movie'
        }
      });
      
      if (response.code === '200') {
      // 解析 JSON 字符串为对象
        content.value = JSON.parse(response.data.body);

      } else {
        ElMessage.error( response.msg);
      }

      // 获取观看平台信息
      const servicesResponse = await request.get(`/movieTv/watch/${movieTvId.value}`,
        {
          params: {
            type: 'movie'
          }
        }
      );

      if (servicesResponse.code === '200') {
        // 解析 JSON 字符串为对象
        const parsedData = JSON.parse(servicesResponse.data.body);
        
        const userCountry = 'US';
        const services = parsedData.results[userCountry];
        
        // 过滤出可用的播放服务
        const flatrateServices = services ? services.flatrate || [] : [];
        const rentServices = services ? services.rent || [] : [];
        const buyServices = services ? services.buy || [] : [];

        // 使用 Set 来跟踪已添加的 provider_name
        const providerNames = new Set();
        const uniqueServices = [];

        // 合并所有可用的服务，确保 provider_name 不重复
        [...flatrateServices, ...rentServices, ...buyServices].forEach(service => {
          if (!providerNames.has(service.provider_name)) {
            providerNames.add(service.provider_name);
            uniqueServices.push(service);
          }
        });

        streamingServices.value = uniqueServices;
      } else {
        ElMessage.error(servicesResponse.msg);
      }

      // 获取演员信息
      const creditsResponse = await request.get(`/movieTv/credits/${movieTvId.value}`,{
        params: {
          type: 'movie'
        }
      })
      if (creditsResponse.code === '200') {
        cast.value = JSON.parse(creditsResponse.data.body).cast;
      } else {
        ElMessage.error(creditsResponse.msg);
      }
    } else if (contentType.value === 'tv') {
      const response = await request.get(`/movieTv/${movieTvId.value}/detail`, {
        params: {
          type: 'tv'
        }
      });

      if (response.code === '200') {
      // 解析 JSON 字符串为对象
        content.value = JSON.parse(response.data.body);
      } else {
        ElMessage.error( response.msg);
      }
      

      // 获取观看平台信息
      const servicesResponse = await request.get(`/movieTv/watch/${movieTvId.value}`,
        {
          params: {
            type: 'tv'
          }
        }
      );
      if (servicesResponse.code === '200') {
        // 解析 JSON 字符串为对象
        const parsedData = JSON.parse(servicesResponse.data.body);
        
        const userCountry = 'US';
        const services = parsedData.results[userCountry];
        
        // 过滤出可用的播放服务
        const flatrateServices = services ? services.flatrate || [] : [];
        const rentServices = services ? services.rent || [] : [];
        const buyServices = services ? services.buy || [] : [];

        // 使用 Set 来跟踪已添加的 provider_name
        const providerNames = new Set();
        const uniqueServices = [];

        // 合并所有可用的服务，确保 provider_name 不重复
        [...flatrateServices, ...rentServices, ...buyServices].forEach(service => {
          if (!providerNames.has(service.provider_name)) {
            providerNames.add(service.provider_name);
            uniqueServices.push(service);
          }
        });

        streamingServices.value = uniqueServices;
      } else {
        ElMessage.error(servicesResponse.msg);
      }

      // 获取演员信息
      const creditsResponse = await request.get(`/movieTv/credits/${movieTvId.value}`,{
        params: {
          type: 'tv'
        }
      })
      if (creditsResponse.code === '200') {
        cast.value = JSON.parse(creditsResponse.data.body).cast;
      } else {
        ElMessage.error(creditsResponse.msg);
      }
    }
  } catch (err) {
    console.error('Error fetching details:', err);
    error.value = '无法获取信息，请稍后再试。';
  } finally {
    loading.value = false;
  }

  const similarResponse = await request.get(`/movieTv/similar/${movieTvId.value}`, {
    params: {
      type: contentType.value
    }
  });

  if (similarResponse.code === '200') {
    similarMovies.value = JSON.parse(similarResponse.data.body).results;
  } else {
    ElMessage.error(similarResponse.msg);
  }
};

const fetchSimilarContent = async () => {
  const similarResponse = await request.get(`/movieTv/similar/${movieTvId.value}`, {
    params: {
      type: contentType.value
    }
  });

  if (similarResponse.code === '200') {
    similarMovies.value = JSON.parse(similarResponse.data.body).results;
  } else {
    ElMessage.error(similarResponse.msg);
  }
};

const viewDetails = (id) => {
  router.push({ name: 'MovieDetail', params: { id, type: contentType.value } }).then(() => {
    fetchDetails();
    fetchSimilarContent();
  });
};

const addToFavorites = () => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录才能添加到收藏列表。');
    return;
  }
  request.post("/favoritelist", {
    userId: userStore.getUserId,
    movietvId: movieTvId.value,
    type: contentType.value
  }).then(res => {
    if (res.code === '200') {
      ElMessage.success('收藏成功');
    } else {
      ElMessage.error(res.msg);
    }
  });
};

const addToWatchlist = () => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录才能添加到待看列表。');
    return;
  }
  request.post("/watchlist", {
    userId: userStore.getUserId,
    movietvId: movieTvId.value,
    type: contentType.value
}, {
    // headers: {
    //     'Authorization': userStore.getBearerToken
    // }
}).then(res => {
    if (res.code === '200') {
        ElMessage.success('添加到待看列表成功');
    } else {
      ElMessage.error(res.msg);
    }
});
};

const fetchRating = async () => {
  if (!userStore.isLoggedIn) {
    return;
  }
 await request.get(`/ratings/${movieTvId.value}/${userStore.getUserId}`,{
  }).then(res => {
    if (res.code === '200') {
      starRating.value = res.data.rating / 2;
      ratingExists.value = true; // 记录评分存在
    }else {
      ElMessage.error(res.msg);
    }
  });
}

const rateComponent = ref(null);
const focusTrap = ref(null);

const handleRateChange = () => {
  if (!userStore.isLoggedIn) {
    if (focusTrap.value) {
    focusTrap.value.focus();
    }
    ElMessage.warning('请先登录才能评分。');
    return;
  }
  submitRating();
  // 将焦点移到隐藏的按钮上
  if (focusTrap.value) {
    focusTrap.value.focus();
  }
};

const submitRating = () => {
  try {
    const method = ratingExists.value ? 'put' : 'post';
    console.log(method);
    
    // 发送评分信息到后端
    request[method]('/ratings', {
      userId: userStore.getUserId,
      movitvId: movieTvId.value,
      type: contentType.value,
      rating: actualRating.value
    }).then(res => {
      if (res.code === '200') {
        ElMessage.success('评分成功');
        ratingExists.value = true; // 更新评分存在状态
      } else {
        ElMessage.error(res.msg);
      }
    });
  } catch (error) {
    console.error('Error submitting rating:', error);
  }
};

onMounted(() => {
  fetchDetails();
  fetchSimilarContent();
  fetchRating();
});

// Watch for route changes
watch(() => route.params.id, (newId) => {
  console.log('Route changed, new movie ID:', newId);
  movieTvId.value = newId;
  starRating.value = 0; // 重置星级评分
  ratingExists.value = false; // 重置评分存在状态
  fetchDetails();
  fetchSimilarContent();
  fetchRating();
});
</script>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.5s;
}
.fade-enter, .fade-leave-to /* .fade-leave-active in <2.1.8 */ {
  opacity: 0;
}

.movie-detail {
  display: flex;
  flex-direction: column;
  color: #fff;
  width: 100%;
}

.backdrop-container {
  position: relative;
  height: 400px; /* 置容器的高度 */
  overflow: hidden; /* 隐藏超出容器的部分 */
}

.backdrop {
  width: 100%; 
  height: auto; 
  object-fit: cover; 
  object-position: center; 
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle, rgba(18, 18, 18, 0) 80%, rgba(18, 18, 18, 1) 90%);
}

.info-container {
  display: flex;
  margin-top: -15px; 
  background: #121212; 
  padding: 20px;
  border-radius: 10px; 
  z-index: 1; 
  width: 80%; 
  margin-left: auto; 
  margin-right: auto; 
  flex-direction: column;
}

.poster-container {
  margin-right: 20px; /* 海报与信息之间的间距 */
}

.poster {
  width: 300px; 
  height: auto;
  border-radius: 5%; 
}

.movie-info {
  display: flex;
  flex-direction: column; /* 垂直排列信息 */
}

.movie-title {
  font-size: 2.5em;
  margin: 0;
}

.release-date {
  font-size: 1.2em;
  margin: 5px 0;
}

.rating {
  display: flex;
  align-items: center;
}

.rating-value {
  font-size: 1.5em;
  font-weight: bold;
}

.genres {
  margin-top: 10px;
}

.genre {
  display: inline-block;
  background-color: rgba(255, 255, 255, 0.7);
  border-radius: 5px;
  padding: 5px 10px;
  margin-right: 5px;
}



.streaming-services h2 {
  margin: 0;
}

.streaming-services ul {
  list-style: none;
  padding: 0;
}

.streaming-services li {
  margin: 5px 0;
}

.movie-overview {
  margin-top: 10px;
  width: 100%;
}

.footer {
  margin-top: 20px;
  text-align: center;
}

.cast-scrollbar {
  width: 100%; /* 设置滚动条的宽度 */
  height: 200px; /* 设置滚动条的高度 */
  margin-top: 30px; /* 增加与图片的间距 */
}

.scrollbar-flex-content {
  display: flex; /* 使用 flexbox 使内容横向排列 */
}

.cast-member {
  display: flex;
  flex-direction: column; /* 垂直排列演员信息 */
  align-items: center; /* 中心对齐 */
  margin-right: 20px; /* 演员卡片之间的间距 */
  width: 150px; /* 设置每个演员卡片的宽度 */
}

.cast-photo {
  width: 100px; /* 设置演员图片的宽度 */
  height: 150px; /* 设置演员图片的高度 */
  border-radius: 10px; /* 圆角 */
  object-fit: cover; /* 保持图片比例 */
}

.actor-name {
  margin-top: 10px; 
  font-weight: bold; 
  white-space: nowrap; 
  overflow: hidden; 
  text-overflow: ellipsis; 
  width: 100%;
  font-size: 0.7em;
}

.character-name {
  color: #888; /* 角色名称的颜色 */
}

.avatar-placeholder {
  width: 100px; /* 设置头像的宽度 */
  height: 100px; /* 设置头像的高度 */
  border-radius: 50%; /* 圆形 */
  background-color: #ccc; /* 背景颜色 */
  display: flex;
  align-items: center; /* 垂直居中 */
  justify-content: center; /* 水平居中 */
  font-size: 24px; /* 字体大小 */
  color: white; /* 字体颜 */
  margin-bottom: 10px; /* 与名字的间距 */
}
.movie-poster {
  border-radius: 5%;
  height: 231px;
}

.streaming-services {
  display: flex;
  align-items: center; /* 垂直居中对齐 */
}

.streaming-services h2 {
  margin-right: 10px; /* 标题与 logo 之间的间距 */
}

.streaming-services ul {
  display: flex; /* 使用 flexbox 使 logo 横向排列 */
  padding: 0; /* 去掉默认的内边距 */
  margin: 0; /* 去掉默认的外边距 */
}

.streaming-services li {
  list-style: none; /* 去掉列表样式 */
  margin-right: 5px; /* logo 之间的间距 */
}

.loading-spinner {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  font-size: 1.5em;
  color: #fff;
}
</style>
