import axiosInstance from "./axiosinstance";

// Get ONE user by Mongo/Object id
export const getUserByIdApi = (id: string) =>
  axiosInstance.get(`/users/${id}`);

// Get ONE user by username
export const getUserByUsernameApi = (username: string) =>
  axiosInstance.get(`/users/username/${encodeURIComponent(username)}`);




export const loginApi = (data: { username: string, password: string }) => {
  return axiosInstance.post('/auth/login', data);
};

export const registerApi = (data: { email: string, username: string, password: string }) => {
  return axiosInstance.post('/auth/register', data);
};

export const getUserListApi = () => {
  return axiosInstance.get('/user/userslist');
};
