import { crAxios } from "..";


export const startAuthenticatorVerification = async({device_name, username}:{device_name:string, username:string})=>{
  const { data } = await crAxios.post("/api/v1/authenticator/setup",{
    device_name,
    username
  });
  return data;
}

export const verifyAuthentication = async({code}:{code:string})=>{
  const { data } = await crAxios.post("/api/v1/authenticator/verify",{
    code,
  })
  return data;
}

export const loginUsingAuthenticator = async({code}:{code:string})=>{
  const { data } = await crAxios.post("/api/v1/authenticator/login",{
    code,
  })
  return data;
}

export const getAuthenticators = async() => {
  const { data } = await crAxios.get("/api/v1/authenticator/devices");
  return data;
};

export const deleteAuthenticator = async(id:string) => {
  const { data } = await crAxios.delete(`/api/v1/authenticator/${id}`);
  return data;
};