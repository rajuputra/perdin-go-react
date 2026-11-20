import axios from "axios";

const api = axios.create({
  headers: { "X-DinasFlow-Request": "1" },
  timeout: 20000,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.dispatchEvent(new Event("auth:unauthorized"));
    }
    return Promise.reject(error);
  },
);

export function apiMessage(error: unknown): string | undefined {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message;
  }
}

export default api;
