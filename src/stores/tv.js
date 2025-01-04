import { defineStore } from 'pinia'
import request from '@/utils/request'

export const useTvStore = defineStore('tv', {
    state: () => ({
        PopularTvsInfo: {},
        dailyTrendingTvsInfo: {},
        weekTrendingTvsInfo: {},
        trailers: []
    }),
    getters: {
        getdailyTrendingTvs() {
            return this.dailyTrendingTvsInfo || []
        },
        getWeekTrendingTvs() {
            return this.weekTrendingTvsInfo || []
        },
        getTrailers() {
            return this.trailers
        }
    },
    actions: {
        setPopularTvs(PopularTvsInfo) {
            this.PopularTvsInfo = PopularTvsInfo
        },
        getTvId(randomNum) {
            return this.PopularTvsInfo ? this.PopularTvsInfo[randomNum] : null
        },
        setDailyTrendingTvsInfo(dailyTrendingTvsInfo) {
            this.dailyTrendingTvsInfo = dailyTrendingTvsInfo
        },
        getDailyTrendingTvId(index) {
            return this.dailyTrendingTvsInfo ? this.dailyTrendingTvsInfo[index] : null
        },
        setweekTrendingTvsInfo(weekTrendingTvsInfo) {
            this.weekTrendingTvsInfo = weekTrendingTvsInfo
        },
        getWeekTrendingTvsId(index) {
            return this.weekTrendingTvsInfo ? this.weekTrendingTvsInfo[index] : null
        },
        setTrailers(trailers) {
            this.trailers = trailers
        }
    },
    persist: true
})