import { defineStore } from 'pinia';
import apiClient from "@/router/apiClient";

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

export const useStore = defineStore('auth', {
    state: () => ({
        api: resolvedApiUrl,
        sseUrl: import.meta.env.VITE_SSE_URL,
        user: localStorage.getItem('user') || '',
        token: localStorage.getItem('token') || '',
        refreshToken: localStorage.getItem('refresh_token') || '',

        roles: JSON.parse(localStorage.getItem("roles") || "[]"),
        permissions: JSON.parse(localStorage.getItem("permissions") || "[]"),

        defaults: [],
        notifications: [],
        downloads: {},
        loader: null,
        _evtSource: null,
        _listeners: {
            log: new Set(),
            docgen: new Set(),
            connected: new Set(),
            error: new Set(),
        },
    }),
    actions: {
        init() {
            if (this.token) {
                apiClient.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
            }
        },
        setToken(token) {
            this.token = token;
            localStorage.setItem('token', token);
            apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        },
        setUser(user) {
            this.user = user;
            localStorage.setItem('user', user);
        },

        setAuthz({ roles = [], permissions = [] } = {}) {
            this.roles = Array.isArray(roles) ? roles : [];
            this.permissions = Array.isArray(permissions) ? permissions : [];
            localStorage.setItem("roles", JSON.stringify(this.roles));
            localStorage.setItem("permissions", JSON.stringify(this.permissions));
        },

        clearAuthData() {
            this.token = "";
            this.user = "";
            this.refreshToken = "";

            this.roles = [];
            this.permissions = [];

            localStorage.removeItem("token");
            localStorage.removeItem("user");
            localStorage.removeItem("roles");
            localStorage.removeItem("permissions");
            localStorage.removeItem("refresh_token");

            delete apiClient.defaults.headers.common["Authorization"];
        },

        setRefreshToken(rt) {
            this.refreshToken = rt;
            localStorage.setItem('refresh_token', rt);
        },

        async login(authData) {
            try {
                const response = await apiClient.post('/login', authData);

                if (!response || !response.data) {
                    return new Error('No valid response or response.data is missing');
                }

                if (!response.data.message) {
                    return new Error('No "message" object in response.data');
                }

                const { token, refresh_token, user } = response.data.message;
                if (!token) {
                    return new Error('No "token" in message object');
                }

                if (!user || !user.id) {
                    return new Error('No valid "user" in message object');
                }

                this.setToken(token);
                if (!refresh_token) {
                    throw new Error('No "refresh_token" in message object');
                }

                this.setRefreshToken(refresh_token);
                this.setUser(user.id);

                await this.fetchMe();
            } catch (error) {
                throw error;
            }
        },

        async refreshAccessToken() {
            if (!this.refreshToken) throw new Error("No refresh token");

            const res = await apiClient.post("/refresh", { refresh_token: this.refreshToken });

            const payload = res.data?.message ?? res.data;
            const access = payload.access_token;
            const refresh = payload.refresh_token;

            if (!access || !refresh) throw new Error("Invalid refresh response");

            this.setToken(access);
            this.setRefreshToken(refresh);
            return access;
        },

        async fetchMe() {
            const res = await apiClient.get("/me");
            const me = res.data?.data ?? res.data;

            this.setAuthz({
                roles: me.roles || [],
                permissions: me.permissions || [],
            });

            return me;
        },

        on(eventName, cb) {
            if (!this._listeners[eventName]) {
                this._listeners[eventName] = new Set();
            }
            this._listeners[eventName].add(cb);
            return () => this._listeners[eventName].delete(cb);
        },

        _emit(eventName, payload) {
            const set = this._listeners[eventName];
            if (!set) return;
            for (const cb of set) {
                try {
                    cb(payload);
                } catch (e) {
                    console.error(`[SSE listener error] event=${eventName}`, e);
                }
            }
        },
        getSseBaseUrl() {
            const normalizedSseUrl = (this.sseUrl || "").replace(/\/+$/, "");

            return normalizedSseUrl.endsWith("/sse")
                ? normalizedSseUrl.slice(0, -4)
                : normalizedSseUrl;
        },

        async ensureSseSession() {
            const userId = this.user;
            const token = this.token;

            if (!userId || !token) {
                throw new Error("Missing SSE credentials");
            }

            const response = await fetch(`${this.getSseBaseUrl()}/session`, {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ user_id: userId }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`SSE session failed (${response.status}): ${errorText}`);
            }
        },

        ensureSseConnected() {
            const userId = this.user;
            const token = this.token;

            if (!userId || !token) return;

            if (this._evtSource) {
                // already connected/connecting
                return;
            }

            this.ensureSseSession()
                .then(() => {
                    const url = `${this.sseUrl}?user_id=${encodeURIComponent(userId)}`;
                    this._evtSource = new EventSource(url, { withCredentials: true });

                    this._evtSource.onopen = () => {
                        this._emit("connected", { userId });
                    };

                    this._evtSource.addEventListener("connected", (event) => {
                        this._emit("connected", { userId, data: event.data });
                    });

                    this._evtSource.addEventListener("log", (event) => {
                        this._emit("log", event.data);
                        try {
                            const payload = JSON.parse(event.data);

                            const data = payload?.data;
                            if (!data) return;

                            if (data.type === "docgen") {
                                const jobId = String(data.job_id);

                                this._emit("docgen", {
                                    jobId,
                                    status: data.status,
                                    progress: Number(data.progress ?? 0),
                                    download_url: data.download_url || null,
                                    error: data.error || null,
                                    client_id: data.client_id ? String(data.client_id) : null,
                                });
                            }
                        } catch (e) {
                            // ignore
                        }
                    });

                    this._evtSource.onerror = (err) => {
                        console.error("❌ SSE connection error", err);
                        this._emit("error", err);

                        this.stopNotifications();
                    };
                })
                .catch((err) => {
                    console.error("❌ SSE session error", err);
                    this._emit("error", err);
                    this.stopNotifications();
                });
        },

        stopNotifications() {
            if (this._evtSource) {
                try {
                    this._evtSource.close();
                } catch (_) { }
            }
            this._evtSource = null;
        },

        async sendAck(stream, ids) {
            const arr = Array.isArray(ids) ? ids : [ids];
            if (!arr.length) return;

            const response = await fetch(`${this.getSseBaseUrl()}/ack`, {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${this.token}`,
                },
                body: JSON.stringify({
                    user_id: this.user,
                    stream,        // "notifications" | "logs"
                    log_ids: arr,  // redis stream ids
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`ACK failed (${response.status}): ${errorText}`);
            }

            return response.json();
        },
        async fetchDefaults() {
            try {
                const response = await apiClient.get('/defaults');
                this.defaults = response.data
            } catch (error) {
                console.error('Error fetching defaults:', error)
            }
        },
        async logout() {
            try {
                await apiClient.post("/logout", {});
            } catch (e) {
                //
            } finally {
                this.clearAuthData();
            }
        },
        async forgotPassword(email) {
            try {
                const response = await apiClient.post('/forgot-password', { email });
                return response.data.message;
            } catch (error) {
                throw error;
            }
        },
        async startClientDownload(clientId) {
            const res = await apiClient.post(`/clients/${clientId}/download`);
            const body = res.data?.message ?? res.data;
            const jobId = String(body.job_id);

            this.downloads[jobId] = {
                client_id: String(clientId),
                status: body.status || "queued",
                progress: 0,
                download_url: null,
                error: null,
            };

            return jobId;
        },

        async fetchDownloadStatus(jobId) {
            const res = await apiClient.get(`/downloads/${jobId}`);
            const data = res.data?.data ?? res.data;

            this.downloads[String(jobId)] = {
                ...(this.downloads[String(jobId)] || {}),
                status: data.status,
                progress: Number(data.progress ?? 0),
                download_url: data.download_url ?? this.downloads[String(jobId)]?.download_url,
                error: data.error ?? null,
            };

            return this.downloads[String(jobId)];
        },

        async downloadGeneratedFile(jobId) {
            const res = await apiClient.get(`/downloads/${jobId}/file`, { responseType: "blob" });

            const cd = res.headers?.["content-disposition"] || "";
            const match = /filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i.exec(cd);
            const fileName = decodeURIComponent(match?.[1] || match?.[2] || `document_${jobId}.docx`);

            const blobUrl = window.URL.createObjectURL(res.data);
            const a = document.createElement("a");
            a.href = blobUrl;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(blobUrl);
        },

        waitForDownloadReady(jobId, { timeoutMs = 120000, pollEveryMs = 2000 } = {}) {
            jobId = String(jobId);

            return new Promise((resolve, reject) => {
                let done = false;

                const finishOk = (state) => {
                    if (done) return;
                    done = true;
                    cleanup();
                    resolve(state);
                };

                const finishErr = (err) => {
                    if (done) return;
                    done = true;
                    cleanup();
                    reject(err);
                };

                const onDocgen = (payload) => {
                    if (payload.jobId !== jobId) return;

                    if (payload.status === "failed") {
                        finishErr(new Error(payload.error || "Document generation failed"));
                    }

                    if (payload.status === "ready") {
                        finishOk(payload);
                    }
                };

                const unsub = this.on("docgen", onDocgen);

                const poll = async () => {
                    try {
                        const st = await this.fetchDownloadStatus(jobId);
                        if (st.status === "failed") finishErr(new Error(st.error || "Document generation failed"));
                        if (st.status === "ready") finishOk(st);
                    } catch (e) {
                        // ignore
                    }
                };

                const pollTimer = setInterval(poll, pollEveryMs);
                const timeoutTimer = setTimeout(() => {
                    finishErr(new Error("Timeout waiting for document generation"));
                }, timeoutMs);

                poll();

                const cleanup = () => {
                    clearInterval(pollTimer);
                    clearTimeout(timeoutTimer);
                    unsub?.();
                };
            });
        },
    },
    getters: {
        isAuthenticated: (state) => !!state.token && !!state.user,
        getUser: (state) => state.user,
        hasPermission: (state) => (perm) => state.permissions?.includes(perm),
        hasRole: (state) => (role) => state.roles?.includes(role),
    },
    can: (state) => (perm) => {
        if (!perm) return true;
        return state.permissions?.includes(perm);
    },
});
