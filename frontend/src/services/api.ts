import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8080/api/v1",
  timeout: 10000,

  headers: {
    Accept: "application/json",
  },
});

// =====================================================
// REQUEST INTERCEPTOR
// =====================================================

api.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem("token");

    const isLoginRequest =
      config.url === "/auth/login" ||
      config.url?.endsWith("/auth/login");

    const isForgotPassword =
      config.url === "/auth/forgot-password" ||
      config.url?.endsWith("/auth/forgot-password");

    if (
      !isLoginRequest &&
      !isForgotPassword &&
      token
    ) {
      config.headers =
        config.headers || {};

      config.headers.Authorization =
        `Bearer ${token}`;
    }

    // =================================================
    // FORMDATA
    // =================================================

    if (
      typeof FormData !== "undefined" &&
      config.data instanceof FormData
    ) {
      if (config.headers) {
        delete config.headers["Content-Type"];
        delete config.headers["content-type"];
      }
    }

    // =================================================
    // DEBUG
    // =================================================

    console.log(
      "➡️ API REQUEST:",
      config.method?.toUpperCase(),
      `${config.baseURL ?? ""}${config.url ?? ""}`,
    );

    return config;
  },

  (error) => {
    console.error(
      "❌ API REQUEST ERROR:",
      error,
    );

    return Promise.reject(error);
  },
);

// =====================================================
// RESPONSE INTERCEPTOR
// =====================================================

api.interceptors.response.use(
  (response) => {

    console.log(
      "✅ API RESPONSE:",
      response.status,
      response.config.url,
      response.data,
    );

    return response;
  },

  (error) => {

    console.error(
      "❌ API RESPONSE ERROR:",
      {
        status:
          error?.response?.status,

        url:
          error?.config?.url,

        data:
          error?.response?.data,

        message:
          error?.message,
      },
    );

    if (
      error.response?.status === 401
    ) {
      localStorage.removeItem(
        "token",
      );
    }

    return Promise.reject(error);
  },
);

export default api;