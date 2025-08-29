import axiosInstance from "./axiosinstance";

/* ---------- Auth ---------- */
export type RegisterBody = {
  email: string;
  username: string;
  password: string;
  phone: string;
  locationText: string;
};
export type LoginBody = { username: string; password: string };

export const registerApi = (data: RegisterBody) =>
  axiosInstance.post("/auth/register", data);

export const loginApi = (data: LoginBody) =>
  axiosInstance.post("/auth/login", data);

/* ---------- Users / Profiles ---------- */
export const getUserListApi = () => axiosInstance.get("/user/userslist");

export const getUserProfile = (id: string) =>
  axiosInstance.get(`/user/profile/${id}`, { params: { _: Date.now() } });

export const getProfileOptionsApi = () =>
  axiosInstance.get("/user/options");

/* ---------- Edit Profile: basic fields ---------- */
export type UpdateUserProfilePayload = {
  phone?: string;
  locationText?: string;
  title?: string;
  summary?: string;
  avatarUrl?: string;
  hourlyRate?: number | ""; // "" clears on server
  availability?: string;    // "" clears
  jobType?: string;         // "" clears
  education?: string;
  experience?: string;
};

export const updateUserProfileApi = (id: string, payload: UpdateUserProfilePayload) =>
  axiosInstance.patch(`/user/profile/${id}`, payload);

/* Keep your old name too (alias) */
export const patchUserProfile = updateUserProfileApi;

/* ---------- Edit Profile: arrays ---------- */
export type UpdateUserArraysPayload = {
  addCertificates?: string[];
  removeCertificates?: string[];
  addSkills?: string[];
  removeSkills?: string[];
};

export const updateUserArraysApi = (id: string, payload: UpdateUserArraysPayload) =>
  axiosInstance.patch(`/user/profile/${id}/arrays`, payload);

/* Alias for compatibility */
export const patchUserArrays = updateUserArraysApi;

/* ---------- Profile Photo ---------- */
export const uploadProfilePhotoApi = (id: string, file: File) => {
  const fd = new FormData();
  fd.append("file", file);
  return axiosInstance.post(`/user/profile/${id}/photo`, fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

/* Alias */
export const uploadAvatarApi = uploadProfilePhotoApi;
