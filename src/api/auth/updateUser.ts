import { crAxios } from '..';

export const updateUserUsingAuthInQuery = async ({
  auth,
  updates,
}: {
  auth: string;
  updates: Record<string, unknown>;
}) => {
  const { data } = await crAxios.put(`/api/v1/query/user`, updates, {
    params: { auth },
  });
  return data;
};

export const updateUserUsingSessionApi = async ({
  updates,
}: {
  updates: any;
}) => {
  const { data } = await crAxios.put(`/api/v1/user`, updates);
  return data;
};
