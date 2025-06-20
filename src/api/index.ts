const { default: axios } = require("axios");

const apiHost = process.env.NEXT_PUBLIC_API_HOST;
console.log('Environment variables:', {
  NEXT_PUBLIC_API_HOST: process.env.NEXT_PUBLIC_API_HOST,
  NODE_ENV: process.env.NODE_ENV,
  apiHost: apiHost
});

export const crAxios = axios.create({
  baseURL: apiHost,
  withCredentials: true,
});

// Add request interceptor to log actual URLs being called
crAxios.interceptors.request.use((request:any) => {
  console.log('Making request to:', request.url);
  console.log('Full URL:', `${request.baseURL}${request.url}`);
  return request;
});