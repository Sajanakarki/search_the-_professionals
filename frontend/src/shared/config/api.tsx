import axiosInstance from "./axiosinstance";

export const getUserByIdApi = (id: string) =>
  axiosInstance.get(`/users/${id}`);

export const getUserByUsernameApi = (username: string) =>
  axiosInstance.get(`/users/username/${encodeURIComponent(username)}`);

export const loginApi = (data: { username: string; password: string }) => {
  return axiosInstance.post("/auth/login", data);
};

export const registerApi = (data: { email: string; username: string; password: string }) => {
  return axiosInstance.post("/auth/register", data);
};

export const getUserListApi = () => {
  return axiosInstance.get("/user/userslist");
};


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
