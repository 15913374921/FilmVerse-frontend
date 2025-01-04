<template>
  <!-- 搜索 -->
  <Search />
  <!-- 今日热门 -->
  <TodayHotModule />

  <!-- 本周热门 -->
  <WeekMovieTv/>

  <!-- 预告片 -->
  <TrailerMovieTv/>
</template>

<script setup>
import { ref, onMounted,computed } from 'vue';
import { useMovieStore } from "@/stores/movie";
import { useTvStore } from "@/stores/tv";
import request from '@/utils/request'
import { ElMessage } from 'element-plus'
import { Carousel, Slide } from 'vue3-carousel';
import 'vue3-carousel/dist/carousel.css';
import { VideoPlay } from '@element-plus/icons-vue'
import Search from '@/components/Search.vue';
import TodayHotModule from '@/components/TodayMovieTv.vue';
import WeekMovieTv from '@/components/WeekMovieTv.vue';
import TrailerMovieTv from '@/components/trailerMovieTv.vue';
import '../assets/css/Home.css'; // 确保路径正确

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

:root {
    --maxPrimaryPageWidth: 1300px;
}




</style>
