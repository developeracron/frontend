import axios from 'axios';
import { useStore } from "@/store";

const envApiUrl = (import.meta.env.VITE_API_URL || '').trim();
const envApiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').trim();
const isLocalHost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
const localApiUrl = `${window.location.protocol}//${window.location.hostname}:8080/api`;

const normalizeApiUrl = (rawUrl) => {
    if (!rawUrl) return '';

    try {
        const parsed = new URL(rawUrl, window.location.origin);
        const missingPort = !parsed.port;
        const localhost = ['localhost', '127.0.0.1'].includes(parsed.hostname);

        if (localhost && missingPort) {
            parsed.port = '8080';
        }

        parsed.pathname = parsed.pathname.replace(/\/+$/, '') || '/api';
        if (!parsed.pathname.endsWith('/api')) {
            parsed.pathname = `${parsed.pathname}/api`.replace(/\/{2,}/g, '/');
        }

        return parsed.toString().replace(/\/+$/, '');
    } catch (_) {
        return rawUrl;
    }
};

const resolvedApiUrl = isLocalHost
    ? (normalizeApiUrl(envApiUrl) || normalizeApiUrl(envApiBaseUrl) || localApiUrl)
    : (normalizeApiUrl(envApiUrl) || (envApiBaseUrl ? `${envApiBaseUrl.replace(/\/+$/, '')}/api` : '/api'));

const apiClient = axios.create({
    baseURL: resolvedApiUrl,
    headers: {
        'Accept': 'application/json'
    }
});

let isRefreshing = false;
let refreshQueue = [];

function queueRequest(cb) {
    return new Promise((resolve, reject) => refreshQueue.push({ cb, resolve, reject }));
}

function flushQueue(err, token) {
    refreshQueue.forEach(({ cb, resolve, reject }) => {
        if (err) reject(err);
        else resolve(cb(token));
    });
    refreshQueue = [];
}

apiClient.interceptors.request.use((config) => {
    if (config?.data instanceof FormData && config.headers) {
        delete config.headers['Content-Type'];
        delete config.headers['content-type'];
    }

    return config;
});

apiClient.interceptors.response.use(
    r => r,
    async (error) => {
        const store = useStore();

        const status = error.response?.status;
        const original = error.config;

        if (status === 403) {
            return Promise.reject(error);
        }

        if (
            status === 401 &&
            original &&
            !original._retry &&
            !String(original.url || "").includes("/login") &&
            !String(original.url || "").includes("/refresh")
        ) {
            original._retry = true;

            if (isRefreshing) {
                return queueRequest((newToken) => {
                    original.headers.Authorization = `Bearer ${newToken}`;
                    return apiClient(original);
                });
            }

            isRefreshing = true;


            try {
                const newToken = await store.refreshAccessToken();
                flushQueue(null, newToken);

                original.headers.Authorization = `Bearer ${newToken}`;
                return apiClient(original);
            } catch (e) {
                flushQueue(e, null);
                store.clearAuthData();


                // store.stopNotifications()
                window.location.href = "/login";
                return Promise.reject(e);
            } finally {
                isRefreshing = false;

            }
        }

        return Promise.reject(error);
    }
);

export default apiClient;
