const { default: axios } = require("axios");

export const crAxios = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_HOST,
  withCredentials: true,
});