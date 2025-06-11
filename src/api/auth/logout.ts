import { crAxios } from "..";

export const logoutApi = async () => {
  const { data } = await crAxios.post("/api/v1/user/logout");
  return data;
};

export const getUserApi = async() => {
  const { data } = await crAxios.get('/api/v1/user');
  return data;
}