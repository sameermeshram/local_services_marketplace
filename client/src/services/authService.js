import api, { clearAccessToken, setAccessToken, unwrap } from "./api";

function persistToken(response) {
  const token = response?.data?.accessToken;
  if (token) setAccessToken(token);
  return response;
}

export const authService = {
  async register(payload) {
    const response = await unwrap(api.post("/auth/register", payload));
    return persistToken(response);
  },

  async login(payload) {
    const response = await unwrap(api.post("/auth/login", payload));
    return persistToken(response);
  },

  async logout() {
    try {
      return await unwrap(api.post("/auth/logout"));
    } finally {
      clearAccessToken();
    }
  },

  async refresh() {
    const response = await unwrap(api.post("/auth/refresh"));
    return persistToken(response);
  },

  me() {
    return unwrap(api.get("/auth/me"));
  },

  async verifyEmail(token) {
    return await unwrap(api.post("/auth/verify-email", { token }));
  },

  async resendVerification(email) {
    return await unwrap(api.post("/auth/resend-verification", { email }));
  },
};

export default authService;

