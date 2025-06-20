const { default: axios } = require("axios");

const apiHost = process.env.NEXT_PUBLIC_API_HOST || 'https://avnews.sayathari.tech';

export const crAxios = axios.create({
  baseURL: apiHost,
  withCredentials: true,
});