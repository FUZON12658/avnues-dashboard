import { crAxios } from "..";


export const signupApi = async ({
  firstName,
  lastName,
  username,
  password,
}:{
  firstName:string;
  lastName: string;
  username: string;
  password: string;
}) => {
  const { data } = await crAxios.post("/api/v1/signup", {
    first_name: firstName,
    last_name: lastName,
    username,
    password,
  });
  return data;
};