<template>
  <div class="content_list content-box">
    <div>
      <h2 style="font-size: 20px; font-weight: 600; color: white;">{{ weekType === 'movie' ? '本周热门电影' : '本周热门电视' }}</h2>
      <button @click="switchWeekType('movie')" :class="['button', { active: weekType === 'movie' }]">电影</button>
      <button @click="switchWeekType('tv')" :class="['button', { active: weekType === 'tv' }]">电视</button>
      <div style="display: flex; align-items: center;">
          <div class="da-movie" :style="WebackgroundStyle" @mouseenter="showOverlay('week')" @mouseleave="hideOverlay('week')">
            <div class="overlay"></div>
            <div class="overlayXQ" style="z-index: 3;" v-if="overlayVisible.week">
              <div class="XqFlex" @click="viewDetails(currentContent.week.id)">
                <img src="../assets/imgs/详情.png" style="width: 20px; height: 20px;">
                <p>查看详情</p>
              </div>
              <div class="XqFlex" @click="handleAddToWatchlist(currentMovieContent.week.id)">
              <img src="../assets/imgs/标签.png" style="width: 20px; height: 20px;">
              <p>添加到待看</p>
            </div>
            <div class="XqFlex" @click="handleFavorite">
              <img src="../assets/imgs/爱心.png" style="width: 20px; height: 20px;">
              <p>收藏</p>
            </div>
            <div class="XqFlex" @click="handleRate">
              <img src="../assets/imgs/星星.png" style="width: 20px; height: 20px;">
              <p>评分</p>
            </div>
            </div>
            <h2 style="z-index: 2; margin-bottom: 0;">{{ weekType === 'movie' ? currentMovieContent.week.title : currentTvContent.week.name }}</h2>
            <h4 style="z-index: 2; margin: 0; font-family: 'Montserrat', sans-serif;">({{ weekType === 'movie' ? currentMovieContent.week.original_title : currentTvContent.week.original_name }})</h4>
            <p style="z-index: 2; margin: 5px 0 0 0; font-family: 'Montserrat', sans-serif;">{{ weekType === 'movie' ? currentMovieContent.week.release_date : currentTvContent.week.first_air_date }}</p>
            <div style="display: flex;">
              <img src="../assets/imgs/星星.png" style="width: 20px; height: 20px; margin-right: 5px; margin-top: 3px; z-index: 2;">
              <p style="z-index: 2; margin: 0 0 15px 0px;">评分 ：{{ weekType === 'movie' ? currentMovieContent.week.vote_average : currentTvContent.week.vote_average }}</p>
            </div>
          </div>

            <div class="carousel-wrapper" ref="carouselWrapper">
              <transition name="fade" mode="out-in">
                <Carousel v-if="carouselReady"
                          ref="carouselRef" 
                          :items-to-show="5" 
                          :wrapAround="true" 
                          :snap-align="'start'" 
                          @slide-end="(index) => onSlideTo(index, weekType, 'week')" 
                          :animation-duration="100"
                          :key="weekType">
                  <Slide v-for="(item, index) in currentWeekItems" :key="index">
                    <img :src="`https://image.tmdb.org/t/p/w154${item.poster_path}`" alt="Slide Image" />
                  </Slide>
                </Carousel>
              </transition>
            </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue';
import { useMovieStore } from "@/stores/movie";
import { useTvStore } from "@/stores/tv";
import { Carousel, Slide } from 'vue3-carousel';
import request from '@/utils/request';
import { ElMessage } from 'element-plus';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user'

const movieStore = useMovieStore();
const tvStore = useTvStore();
const userStore = useUserStore(); 

const weekType = ref('movie');
const WebackgroundStyle = ref({});
const overlayVisible = ref({ week: false });
const carouselReady = ref(false);
const carouselRef = ref(null);
const carouselWrapper = ref(null);

const currentWeekItems = computed(() => {
  return weekType.value === 'movie' ? movieStore.weekTrendingMoviesInfo : tvStore.weekTrendingTvsInfo;
});

const currentMovieContent = ref({
  week: {
    id: '',
    title: '',
    release_date: '',
    vote_average: '',
    backdrop_path: '',
    original_title: '',
  }
});

const currentTvContent = ref({
  week: {
    id: '',
    name: '',
    first_air_date: '',
    vote_average: '',
    backdrop_path: '',
    original_name: '',
  }
});

const showOverlay = (type) => {
  overlayVisible.value[type] = true;
};

const hideOverlay = (type) => {
  overlayVisible.value[type] = false;
};


const switchWeekType = async (type) => {
  weekType.value = type;
  carouselReady.value = false; // 先设置为 false 以触发过渡

  await loadContent();

  // 重置 Carousel 到第一张
  if (carouselRef.value) {
    await nextTick(); // 确保 DOM 更新完成
    carouselRef.value.slideTo(0); // 重置 Carousel 到第一张图片
    setCarouselHeight(); // 设置 Carousel 高度
  }
  updateBackgroundStyle('week', currentWeekItems.value[0].backdrop_path);
};

const setCarouselHeight = () => {
  if (carouselRef.value) {
    const firstSlide = carouselRef.value.$el.querySelector('.carousel__slide');
    if (firstSlide) {
      const height = firstSlide.offsetHeight; // 获取第一张图片的高度
      carouselWrapper.value.style.height = `${height}px`; // 设置 Carousel 的高度
    }
  }
};

const updateCurrentMovie = (index, movieType, type) => {
  const contentData = currentWeekItems.value[index];
  
  if (type === 'week') {
    if (movieType === 'movie') {
      currentMovieContent.value.week = {
        id: contentData.id,
        title: contentData.title,
        release_date: contentData.release_date,
        vote_average: contentData.vote_average,
        backdrop_path: contentData.backdrop_path,
        original_title: contentData.original_title
      };
    } else if (movieType === 'tv') {
      currentTvContent.value.week = {
        id: contentData.id,
        name: contentData.name,
        first_air_date: contentData.first_air_date,
        vote_average: contentData.vote_average,
        backdrop_path: contentData.backdrop_path,
        original_name: contentData.original_name
      };
    }
    updateBackgroundStyle(type, contentData.backdrop_path);
  }
};

const updateBackgroundStyle = (timePeriod, backdropPath) => {
  const baseUrl = 'https://image.tmdb.org/t/p/w300';
  const fallbackGradient = 'linear-gradient(to right, #ff8177 0%, #ff867a 0%, #ff8c7f 21%, #f99185 52%, #cf556c 78%, #b12a5b 100%)';

  const style = {
    backgroundImage: backdropPath ? `url(${baseUrl}${backdropPath})` : fallbackGradient,
    width: '500px',
    height: '200px',
    backgroundSize: 'cover',
    backgroundRepeat: 'no-repeat',
  };

  WebackgroundStyle.value = style;
};

const onSlideTo = (index, movieType, type) => {
  const newIndex = index.currentSlideIndex;
  updateCurrentMovie(newIndex, movieType, type);
};

const loadContent = async () => {
  try {
    const [movieWeekRes, tvWeekRes] = await Promise.all([
      request.get('/movie', { params: { type: 'WEEK' } }),
      request.get('/tv', { params: { type: 'WEEK' } })
    ]);

    if (movieWeekRes.code === '200') {
      movieStore.setweekTrendingMoviesInfo(movieWeekRes.data);
      currentMovieContent.value.week = movieWeekRes.data[0];
      updateBackgroundStyle('week', movieWeekRes.data[0].backdrop_path);
    }

    if (tvWeekRes.code === '200') {
      tvStore.setweekTrendingTvsInfo(tvWeekRes.data);
      currentTvContent.value.week = tvWeekRes.data[0];
    }
    carouselReady.value = true; // 数据加载完成后设置为 true
    await nextTick(); // 确保 DOM 更新完成
    if (carouselRef.value) {
      carouselRef.value.slideTo(0); // 重置 Carousel 到第一张图片
      setCarouselHeight(); // 设置 Carousel 高度
    }
  } catch (err) {
    ElMessage.error(err);
  }
};

const router = useRouter();
const useid = userStore.getUser.id;

const viewDetails = (contentId) => {
  if (weekType.value === 'movie') {
    router.push({ name: 'MovieDetail', params: { id: contentId, type: 'movie' } });
  } else if (weekType.value === 'tv') {
    router.push({ name: 'TvDetail', params: { id: contentId, type: 'tv' } });
  }
};

const currentContent = computed(() => {
  return weekType.value === 'movie' ? currentMovieContent.value : currentTvContent.value;
});

const handleAddToWatchlist = () => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录才能添加到待看列表。');
    return;
  }
  // 添加到待看逻辑
  request.post("/watchlist", {
    userId: useid,
    movietvId: currentContent.value.week.id,
    type: weekType.value
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

const handleFavorite = () => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录才能收藏。');
    return;
  }
  // 收藏逻辑
};

const handleRate = () => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录才能评分。');
    return;
  }
  // 评分逻辑
};

onMounted(() => {
  loadContent();
});
</script>

<style scoped>

.da-movie {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 400px;
  align-items: center;
  justify-content: space-around;
  position: relative;
  color: white;
}

.da-movie .overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.5));
  z-index: 1;
}

.da-movie .overlayXQ {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.9));
  z-index: 3;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-evenly;
  cursor: pointer;
}

.XqFlex {
  display: flex;
  padding: 10px;
  width: 100%;
  height: 25%;
  border-bottom: 3px solid white;
  align-items: center;
  justify-content: center;
  background-color: transparent;
  transition: background-color 0.3s;
}

.XqFlex:hover {
  background-color: rgba(128, 128, 128, 0.7);
  cursor: pointer;
}

.XqFlex p {
  margin: 0;
  font-weight: 600;
  color: white;
}

.XqFlex img {
  margin-top: 4px;
  margin-right: 3px;
}

.carousel-wrapper {
  position: relative;
  width: 100%;
  overflow: hidden;
}

.carousel {
  overflow: hidden;
  width: 100%;
  justify-content: center;
  gap: 10px;
}

.carousel__slide img {
  width: 100%;
  max-width: 150px;
  height: 225px;
  object-fit: cover;
  flex-shrink: 0;
  border-radius: 10px;
}

/* 淡入淡出效果 */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
