import axios from "axios";
import Cookies from "js-cookie";
import authConfig from "./authConfig";
import AuthStore from "../Store/AuthStore";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://api.example.com";

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json", Accept: "application/json" },
});

// ── INTERCEPTORS ─────────────────────────────────────────────
client.interceptors.request.use((config) => {
  const token = AuthStore.getState().token;
  if (token && !config.noAuth) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (res) => res,
  (error) => {
    const isLoginRequest = error.config?.url?.includes('api/login');
    if (error.response?.status === 401 && !isLoginRequest) {
      Cookies.remove(authConfig.tokenKey);
      Cookies.remove(authConfig.userKey);
      AuthStore.getState().clearAuth();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

const wrap = async (fn) => {
  try {
    const res = await fn();
    return { success: true, data: res.data, status: res.status };
  } catch (err) {
    // const error {
    //   success: false,
    //   message: err.response?.data?.message || err.message || "Terjadi kesalahan.",
    //   status: err.response?.status || 0,
    //   errors: err.response?.data?.errors || null,
    // };
    throw err;
  }
};

const Apis = {
  Get: (url, params = {}, config = {}) =>
    wrap(() => client.get(url, { params, ...config })),

  Post: (url, body = {}, config = {}) =>
    wrap(() => client.post(url, body, config)),

  Put: (url, body = {}, config = {}) =>
    wrap(() => client.put(url, body, config)),

  Patch: (url, body = {}, config = {}) =>
    wrap(() => client.patch(url, body, config)),

  Delete: (url, config = {}) =>
    wrap(() => client.delete(url, config)),

  Upload: (url, file, { fieldName = "file", extraData = {}, onProgress } = {}) => {
    const form = new FormData();
    form.append(fieldName, file);
    Object.entries(extraData).forEach(([k, v]) => form.append(k, v));
    return wrap(() =>
      client.post(url, form, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (e) => onProgress?.(Math.round((e.loaded * 100) / e.total)),
      })
    );
  },

  Download: async (url, filename, params = {}) => {
    const result = await wrap(() => client.get(url, { responseType: "blob", params }));
    if (!result.success) return result;
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([result.data]));
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
    return { success: true };
  },

  setToken: (access) => {
    Token.set(access);
    client.defaults.headers.common.Authorization = `Bearer ${access}`;
  },

  clearToken: () => {
    Token.clear();
    delete client.defaults.headers.common.Authorization;
  },

  cancelToken: () => {
    const ctrl = new AbortController();
    return { signal: ctrl.signal, cancel: () => ctrl.abort() };
  },
};

export default Apis;
