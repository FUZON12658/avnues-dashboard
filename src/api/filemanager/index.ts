import { crAxios } from "..";

export const getTopLevelEntitiesFromFileManager = async () => {
  const { data } = await crAxios.get("/api/v1/file-manager/top");
  return data;
};

export const getFilesByFolderId = async (id: string) => {
  const { data } = await crAxios.get(`/api/v1/file-manager/file/${id}`);
  return data;
};

export const createNewFolder = async ({
  name,
  parent_id,
}: {
  name: string;
  parent_id: string | null;
}) => {
  const { data } = await crAxios.post("/api/v1/file-manager/folders", {
    name,
    parent_id,
  });

  return data;
};

export const uploadMultipleFilesApi = async (formData: FormData) => {
  const { data } = await crAxios.post("/api/v1/file-manager/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    withCredentials: true, // <- ADD THIS BACK
    onUploadProgress: (progressEvent: any) => {
      const percentCompleted = Math.round(
        (progressEvent.loaded * 100) / (progressEvent.total || 1)
      );
      console.log(`Upload Progress: ${percentCompleted}%`);
    },
  });

  return data;
};

export const deleteFilesOrFolder = async (id: string) => {
  const { data } = await crAxios.delete(`/api/v1/file-manager/${id}`);

  return data;
};

export const copyItemsApi = async (
  itemsIds: string[],
  sourceFolderId: string | null,
  destinationFolderId: string | null
) => {
  const { data } = await crAxios.post("/api/v1/file-manager/copy/", {
    item_ids: itemsIds,
    source_folder_id: sourceFolderId,
    destination_folder_id: destinationFolderId,
  });
  return data;
};

export const moveItemsApi = async (
  itemIds: string[],
  sourceFolderId: string | null,
  destinationFolderId: string | null
) => {
  const { data } = await crAxios.post("/api/v1/file-manager/move/", {
    item_ids: itemIds,
    source_folder_id: sourceFolderId,
    destination_folder_id: destinationFolderId,
  });
  return data;
};
