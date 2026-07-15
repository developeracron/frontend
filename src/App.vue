<template>
  <div id="app">
    <LeftBar v-if="showShell" class="left-bar" />
    <div class="main-content" :class="{ 'app-content': showShell }">
      <TopBar
          v-if="showShell"
          :title="currentRouteInfo.title"
          :description="currentRouteInfo.description"
          class="top-bar"
      />
      <router-view class="content" />
    </div>
    <Toast />
    <ConfirmDialog />
  </div>
</template>

<script setup>
import { useStore } from "./store";
import LeftBar from "./components/LeftBar.vue";
import TopBar from "./components/TopBar.vue";
import { computed } from "vue";
import { useRoute } from "vue-router";
import Toast from "primevue/toast";
import ConfirmDialog from "primevue/confirmdialog";
import { useToast } from "primevue/usetoast";
import { eventBus } from "@/main";

const store = useStore();
const route = useRoute();
const toast = useToast();

eventBus.on("toast", (toastData) => {
  toast.add({
    ...toastData,
    life: toastData.life || 3000,
  });
});

const showShell = computed(() => store.isAuthenticated && route.path !== "/login");

const routeInfoMap = {
  Dashboard: {
    title: "Dashboard",
    description:
      "Panoramica generale con informazioni e statistiche sui dati principali del sistema",
  },
  Allocations: {
    title: "Pratica",
    description:
      "Pratiche create per i Clienti, assegnate ad uno o più dipendenti",
  },
  Clients: {
    title: "Anagrafica",
  },
  AddClient: {
    title: "Aggiungi cliente",
    description:
      "Inserimento di un nuovo cliente nel sistema con tutti i dati necessari",
  },
  EditClient: {
    title: "Modifica cliente",
    description:
      "Aggiornamento delle informazioni relative a un cliente esistente",
  },
  Tenders: {
    title: "Bandi",
    description:
      "Gestione dei bandi disponibili e delle opportunità di finanziamento per i clienti",
  },
  Phases: {
    title: "Fasi",
    description:
      "Organizza le fasi create in gruppi per facilitarne il riutilizzo in pratica o bandi futuri",
  },
  Settings: {
    title: "Impostazioni",
    description:
      "Configurazione generale del sistema e personalizzazione dell'applicazione",
  },
  Users: {
    title: "Utenti",
    description:
      "Gestione degli utenti del sistema con relativi ruoli e permessi di accesso",
  },
  Notifications: {
    title: "Notifiche",
    description: "Gestione delle notifiche del sistema",
  },
};

const currentRouteInfo = computed(() => {
  return routeInfoMap[route.name] || { title: "", description: "" };
});
</script>

<style>
#app {
  display: flex;
  width: 100%;
}

.left-bar {
  height: 100vh;
  width: 288px;
  flex-shrink: 0;
}

.main-content {
  height: 100vh;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  min-width: 0;
  overflow-y: hidden;
  overflow-x: auto;
}

.top-bar {
  position: sticky;
  top: 0;
  z-index: 1000;
  background-color: black;
}

.content {
  flex-grow: 1;
  min-width: 0;
  overflow-y: auto;
  overflow-x: auto;
  margin-bottom: 16px;
}

html,
body,
#app {
  height: 100%;
  margin: 0;
  overflow-y: hidden;
  overflow-x: auto;
}

.app-content {
  transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

@media (min-width: 991px) {
  .app-content {
    margin-left: 288px;
  }
}

@media (max-width: 990px) {
  .app-content {
    margin-left: 0;
  }
}
</style>
