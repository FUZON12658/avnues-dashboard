const { default: axios } = require("axios");

const apiHost = process.env.NEXT_PUBLIC_API_HOST 
console.log(apiHost);
export const crAxios = axios.create({
  baseURL: apiHost,
  withCredentials: true,
});