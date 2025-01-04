import { defineStore } from 'pinia'
import request from '@/utils/request'

export const useMovieStore = defineStore('movie', {
    state: () => ({
        PopularMoviesInfo: {},
        dailyTrendingMoviesInfo: {},
        weekTrendingMoviesInfo: {},
        trailers: []
    }),
    getters: {
        getdailyTrendingMovies() {
            return this.dailyTrendingMoviesInfo || []
        },
        getWeekTrendingMovies() {
            return this.weekTrendingMoviesInfo || []
        },
        getTrailers() {
            return this.trailers
        }
    },
    actions: {
        setPopularMovies(PopularMoviesInfo) {
            this.PopularMoviesInfo = PopularMoviesInfo
        },
        getMovieId(randomNum) {
            return this.PopularMoviesInfo ? this.PopularMoviesInfo[randomNum] : null
        },
        setDailyTrendingMoviesInfo(dailyTrendingMoviesInfo) {
            this.dailyTrendingMoviesInfo = dailyTrendingMoviesInfo
        },
        getDailyTrendingMovieId(index) {
            return this.dailyTrendingMoviesInfo ? this.dailyTrendingMoviesInfo[index] : null
        },
        setweekTrendingMoviesInfo(weekTrendingMoviesInfo) {
            this.weekTrendingMoviesInfo = weekTrendingMoviesInfo
        },
        getWeekTrendingMoviesId(index) {
            return this.weekTrendingMoviesInfo ? this.weekTrendingMoviesInfo[index] : null
        },
        setTrailers(trailers) {
            this.trailers = trailers
        },
    },
    persist: true
})