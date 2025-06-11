import { crAxios } from "..";

export const loginAdminApi = async ({ username, password }:{username:string; password:string}) => {
  const { data } = await crAxios.post("/api/v1/login", {
    username,
    password,
    is_admin: true,
    is_organization: false
  });
  return data;
};

export const loginOrganizationApi = async ({ username, password }:{username:string; password:string}) => {
  const { data } = await crAxios.post("/api/v1/login", {
    username,
    password,
    is_admin: false,
    is_organization: true
  });
  return data;
};

export const loginApi = async ({ username, password }:{username:string; password:string}) => {
  const { data } = await crAxios.post("/api/v1/users/login", {
    username,
    password,
    is_admin: true,
    is_organization: true,
  });
  return data;
};

export const getUserIdApi = async () => {
  const { data } = await crAxios.get("/api/user");
  return data;
};

export const refreshTokenAdminApi = async () => {
  const { data } = await crAxios.get("/api/v1/admin/refresh");
  return data;
};


export const refreshTokenApi = async () => {
  const { data } = await crAxios.get("/api/v1/user/refresh");
  return data;
};
