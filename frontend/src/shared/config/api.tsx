import axiosInstance from "./axiosinstance";

export type RegisterBody = {
  email: string;
  username: string;
  password: string;
  phone: string;
  locationText: string;
};

export type LoginBody = { username: string; password: string };

/** ===== Auth ===== */
export const registerApi = (data: RegisterBody) =>
  axiosInstance.post("/auth/register", data);

export const loginApi = (data: LoginBody) =>
  axiosInstance.post("/auth/login", data);

export const getUserByIdApi = (id: string) =>
  axiosInstance.get(`/user/profile/${id}`);

export const getUserByUsernameApi = (username: string) =>
  axiosInstance.get(`/user/username/${encodeURIComponent(username)}`); 

export const getUserListApi = () =>
  axiosInstance.get("/user/userslist");

export const getUserProfile = (id: string) =>
  axiosInstance.get(`/user/profile/${id}`);

export const patchUserProfile = (id: string, payload: any) =>
  axiosInstance.patch(`/user/profile/${id}`, payload);

export const patchUserArrays = (
  id: string,
  payload: {
    addCertificates?: string[];
    removeCertificates?: string[];
    addSkills?: string[];
    removeSkills?: string[];
  }
) => axiosInstance.patch(`/user/profile/${id}/arrays`, payload);

/** ===== Profile Photo ===== */
export const uploadAvatarApi = (id: string, file: File) => {
  const fd = new FormData();
  fd.append("file", file); // key MUST be "file" to match upload.single("file")
  return axiosInstance.post(`/user/profile/${id}/photo`, fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};
