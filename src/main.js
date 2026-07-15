import { createApp } from "vue";
import App from "./App.vue";
import PrimeVue from "primevue/config";
import Aura from "@primevue/themes/aura";
import ToastService from "primevue/toastservice";
import ConfirmationService from "primevue/confirmationservice";
import Tooltip from "primevue/tooltip";
import router from "./router";
import { createPinia } from "pinia";
import mitt from "mitt";

import "primeicons/primeicons.css";
import "./index.css";
import { useStore } from "@/store";

export const eventBus = mitt();

const app = createApp(App);
app.config.globalProperties.$eventBus = eventBus;

app.use(PrimeVue, {
    theme: {
        preset: Aura,
        options: { darkModeSelector: "none" },
    },
});

app.directive("tooltip", Tooltip);
app.use(ConfirmationService);
app.use(ToastService);

const pinia = createPinia();
app.use(pinia);
app.use(router);

const store = useStore(pinia);
store.init();                // sets Authorization header if token exists
if (store.isAuthenticated) {
    store.fetchMe().catch(() => {});
}
store.ensureSseConnected();  // connects SSE if token+user exist

app.mount("#app");
