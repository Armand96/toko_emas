// Apis.js
import axios from "axios";
import Cookies from "js-cookie";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://api.example.com";
const TOKEN_KEY = import.meta.env.VITE_TOKEN_KEY || "access_token";
const REFRESH_KEY = import.meta.env.VITE_REFRESH_KEY || "refresh_token";


const client = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json", Accept: "application/json" },
});

// ── TOKEN ────────────────────────────────────────────────────
const Token = {
  get: () => Cookies.get(TOKEN_KEY),
  getRefresh: () => Cookies.get(REFRESH_KEY),
  set: (access, refresh) => {
    Cookies.set(TOKEN_KEY, access, { expires: 1, secure: true, sameSite: "Strict" });
    if (refresh) Cookies.set(REFRESH_KEY, refresh, { expires: 7, secure: true, sameSite: "Strict" });
  },
  clear: () => {
    Cookies.remove(TOKEN_KEY);
    Cookies.remove(REFRESH_KEY);
  },
};

// ── INTERCEPTORS ─────────────────────────────────────────────
client.interceptors.request.use((config) => {
  const token = Token.get();
  if (token  && !config.noAuth ) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let isRefreshing = false;
let queue = [];

client.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => queue.push({ resolve, reject }))
          .then((token) => {
            original.headers.Authorization = `Bearer ${token}`;
            return client(original);
          });
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, {
          refresh_token: Token.getRefresh(),
        });

        Token.set(data.access_token, data.refresh_token);
        client.defaults.headers.common.Authorization = `Bearer ${data.access_token}`;
        queue.forEach((p) => p.resolve(data.access_token));
        queue = [];
        original.headers.Authorization = `Bearer ${data.access_token}`;
        return client(original);
      } catch (err) {
        queue.forEach((p) => p.reject(err));
        queue = [];
        Token.clear();
        window.location.href = "/login";
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
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

  setToken: (access, refresh) => {
    Token.set(access, refresh);
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
