import axios from "axios";

const api = axios.create({

  baseURL: "http://localhost:8080/api/v1",

  timeout: 10000,

  headers: {

    Accept: "application/json",

  },

});


api.interceptors.request.use(

  (config) => {

    const token =
      localStorage.getItem("token");


    if (token) {

      config.headers.Authorization =
        `Bearer ${token}`;

    }


    return config;

  },

  (error) =>
    Promise.reject(error)

);


api.interceptors.response.use(

  (response) =>
    response,


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
      "==============================="
    );


    return Promise.reject(error);

  }

);


export default api;