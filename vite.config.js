import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';
import path from 'path';

export default defineConfig({
    plugins: [
        vue(),
        vueJsx(),
    ],
    server: {
        hmr: {
            host: 'localhost'
        }
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            'primevue': path.resolve(__dirname, './node_modules/primevue'),
        },
    },
    optimizeDeps: {
        exclude: ['luxon', '@fullcalendar/luxon3'],
        include: [
            'vue-google-maps-community-fork',
        ],
    },
    define: {
        '__VUE_PROD_HYDRATION_MISMATCH_DETAILS__': false,
    },
});
