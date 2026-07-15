import apiClient from "@/router/apiClient";
import {eventBus} from "@/main";

function normalizeHeaders(headers, payload) {
    const h = { ...(headers || {}) };

    if (payload instanceof FormData) {
        for (const k of Object.keys(h)) {
            if (k.toLowerCase() === "content-type") delete h[k];
        }
    }

    return h;
}

const apiService = {
    getWithAuth: async (endpoint, options = {}) => {
        try {
            const response = await apiClient.get(`/${endpoint}`, {
                params: options.params || {},
                headers: options.headers || {},
                responseType: options.responseType || "json",
            });

            if (options.successMessage) {
                eventBus.emit('toast', {
                    severity: 'success',
                    summary: 'Successo',
                    detail: options.successMessage,
                });
            }

            const payload = response.data?.data ?? response.data?.message ?? response.data;

            return options.transform ? options.transform(payload) : payload;
        } catch (error) {
            const errorMessage = options.errorMessage || error.response?.data?.message || error.message;

            eventBus.emit('toast', {
                severity: 'error',
                summary: 'Errore',
                detail: errorMessage,
            });

            console.error(`Error fetching ${endpoint}:`, errorMessage);
            throw error;
        }
    },
    deleteWithAuth: async (endpoint, id, options = {}) => {
        try {
            const response = await apiClient.delete(`/${endpoint}/${id}`, {
                headers: options.headers || {},
                params: options.params || {},
            });

            eventBus.emit('toast', {
                severity: 'success',
                summary: 'Successo',
                detail: options.successMessage || 'Operazione completata con successo.',
            });

            return response.status;
        } catch (error) {
            const errorMessage = options.errorMessage || error.response?.data?.message || error.message;

            eventBus.emit('toast', {
                severity: 'error',
                summary: 'Errore',
                detail: errorMessage,
            });

            console.error(`Error deleting ${endpoint}:`, errorMessage);
            throw error;
        }
    },
    postOrPutWithAuth: async (endpoint, payload, isEdit = false, options = {}) => {
        try {
            const method = isEdit ? 'put' : 'post';
            const response = await apiClient[method](`/${endpoint}`, payload, {
                headers: normalizeHeaders(options.headers, payload),
                params: options.params || {},
                responseType: options.responseType || "json",
            });

            eventBus.emit('toast', {
                severity: 'success',
                summary: 'Successo',
                detail: options.successMessage || 'Operazione completata con successo.',
            });

            return response.data?.data ?? response.data?.message ?? response.data;
        } catch (error) {
            const errorMessage = options.errorMessage || error.response?.data?.message || error.message;

            eventBus.emit('toast', {
                severity: 'error',
                summary: 'Errore',
                detail: errorMessage,
            });

            throw error;
        }
    }
}

export default apiService