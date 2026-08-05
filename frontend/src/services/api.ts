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

    const token = localStorage.getItem("token");

    console.log("================================");
    console.log("🔐 API REQUEST");
    console.log(
      "URL:",
      `${config.baseURL}${config.url}`
    );
    console.log(
      "METHOD:",
      config.method
    );
    console.log(
      "TOKEN ADA:",
      !!token
    );

    // =================================================
    // AUTHORIZATION
    // =================================================

    if (token) {

      config.headers =
        config.headers || {};

      config.headers.Authorization =
        `Bearer ${token}`;

      console.log(
        "AUTHORIZATION:",
        `Bearer ${token.substring(0, 20)}...`
      );

    } else {

      console.log(
        "❌ TOKEN TIDAK ADA DI LOCALSTORAGE"
      );

    }


    // =================================================
    // CONTENT TYPE
    // =================================================

    /**
     * Jangan memaksa Content-Type:
     *
     * application/json
     *
     * karena beberapa endpoint seperti
     * upload menu menggunakan FormData.
     *
     * Axios akan menentukan Content-Type
     * secara otomatis berdasarkan data.
     */

    if (
      typeof FormData !== "undefined" &&
      config.data instanceof FormData
    ) {

      /**
       * Hapus Content-Type jika sebelumnya
       * pernah diset oleh default/interceptor.
       *
       * Browser/Axios akan membuat:
       *
       * multipart/form-data;
       * boundary=----------------...
       */

      if (config.headers) {

        delete config.headers[
          "Content-Type"
        ];

        delete config.headers[
          "content-type"
        ];
      }

      console.log(
        "📦 REQUEST BODY: FormData"
      );

      console.log(
        "📦 CONTENT TYPE: multipart/form-data"
      );

    } else {

      console.log(
        "📦 REQUEST BODY:",
        config.data
      );

    }


    console.log("================================");

    return config;
  },

  (error) => {
    return Promise.reject(error);
  }
);


// =====================================================
// RESPONSE INTERCEPTOR
// =====================================================

api.interceptors.response.use(

  (response) => {

    console.log(
      "✅ API SUCCESS:",
      response.config.url,
      response.status
    );

    return response;
  },

  (error) => {

    console.error(
      "========== API ERROR =========="
    );

    console.error(
      "URL:",
      error.config?.baseURL +
      error.config?.url
    );

    console.error(
      "METHOD:",
      error.config?.method
    );

    console.error(
      "STATUS:",
      error.response?.status
    );

    console.error(
      "DATA:",
      error.response?.data
    );

    console.error(
      "TOKEN:",
      localStorage.getItem("token")
    );

    console.error(
      "AUTH HEADER:",
      error.config?.headers?.Authorization
    );

    console.error(
      "==============================="
    );

    return Promise.reject(error);
  }
);


export default api;