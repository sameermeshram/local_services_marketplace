import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
let accessToken = null;

export function getAccessToken() {
  return accessToken;
}

export function setAccessToken(token) {
  accessToken = token || null;
}

export function clearAccessToken() {
  accessToken = null;
}

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

let refreshPromise = null;

function persistAccessTokenFromResponse(response) {
  const token = response.data?.data?.accessToken;
  if (token) setAccessToken(token);
  return response;
}

api.interceptors.response.use(
  (response) => persistAccessTokenFromResponse(response),
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    if (status !== 401 || originalRequest?._retry || originalRequest?.url?.includes("/auth/refresh")) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      refreshPromise ??= api.post("/auth/refresh");
      const response = await refreshPromise;
      refreshPromise = null;

      const newAccessToken = response.data?.data?.accessToken;
      if (newAccessToken) {
        setAccessToken(newAccessToken);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      }

      return api(originalRequest);
    } catch (refreshError) {
      refreshPromise = null;
      clearAccessToken();
      return Promise.reject(refreshError);
    }
  }
);

export const unwrap = (request) => request.then((response) => response.data);

export const categoryService = {
  getAll: () => unwrap(api.get("/v1/categories")),
  create: (payload) => unwrap(api.post("/v1/categories", payload)),
  update: (id, payload) => unwrap(api.put(`/v1/categories/${id}`, payload)),
  remove: (id) => unwrap(api.delete(`/v1/categories/${id}`)),
};

export const providerService = {
  getAll: (params) => unwrap(api.get("/providers", { params })),
  getById: (id) => unwrap(api.get(`/providers/${id}`)),
  updateProfile: (payload) => unwrap(api.patch("/providers/me/profile", payload)),
  updateAvailability: (payload) => unwrap(api.patch("/providers/me/availability", payload)),
  uploadPhoto: (formData) =>
    unwrap(
      api.post("/providers/me/photos", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
    ),
  uploadVerificationDocument: (formData) =>
    unwrap(
      api.post("/providers/me/verification-documents", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
    ),
  getDashboard: () => unwrap(api.get("/providers/me/dashboard")),
};

export const bookingService = {
  create: (payload) => unwrap(api.post("/bookings", payload)),
  getMine: (params) => unwrap(api.get("/bookings/me", { params })),
  getProviderBookings: () => unwrap(api.get("/bookings/provider")),
  updateStatus: (id, status) => unwrap(api.patch(`/bookings/${id}/status`, { status })),
  getById: (id) => unwrap(api.get(`/bookings/${id}`)),
  cancel: (id, payload) => unwrap(api.patch(`/bookings/${id}/cancel`, payload)),
  reschedule: (id, payload) => unwrap(api.patch(`/bookings/${id}/reschedule`, payload)),
  accept: (id) => unwrap(api.patch(`/bookings/${id}/accept`)),
  reject: (id, payload) => unwrap(api.patch(`/bookings/${id}/reject`, payload)),
  complete: (id) => unwrap(api.patch(`/bookings/${id}/complete`)),
};

export const reviewService = {
  getForProvider: (providerId, params) =>
    unwrap(api.get(`/providers/${providerId}/reviews`, { params })),
  createForBooking: (bookingId, payload) =>
    unwrap(api.post(`/bookings/${bookingId}/reviews`, payload)),
  getMine: () => unwrap(api.get("/reviews/me")),
};

export const notificationService = {
  getAll: (params) => unwrap(api.get("/notifications", { params })),
  markRead: (id) => unwrap(api.patch(`/notifications/${id}/read`)),
  markAllRead: () => unwrap(api.patch("/notifications/read-all")),
};

export default api;
