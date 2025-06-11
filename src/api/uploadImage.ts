import { crAxios } from ".";
export const uploadImageApi = async (images: File[] | File): Promise<{ url: string }> => {
  try {
    // If a single file is passed, convert it to an array
    const filesArray = Array.isArray(images) ? images : [images];

    // Prepare FormData for the request
    const formData = new FormData();
    filesArray.forEach((image) => {
      formData.append("files", image); // Append each image to FormData
    });

    // Make the POST request to your backend's /upload-image endpoint
    const response = await crAxios.post("/api/v1/file-manager/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data", // Tell the backend we're sending files
      },
      withCredentials: true,
    });
    
    const finalReturningData = response.data.data.uploaded_files.map((data:any)=>({url:`${process.env.NEXT_PUBLIC_API_HOST}/${data.file.path}`}));
    // Return the array of image URLs received from the backend
    return finalReturningData[0]; // Assuming backend returns the image URLs in the response body

  } catch (error) {
    console.error("Error uploading images:", error);
    throw new Error("Image upload failed");
  }
};
