<template>
  <div class="topbar-wrapper" v-bind="$attrs">
    <div class="topbar-container px-4 py-4 text-surface-900">
      <div class="topbar-content">
        <div class="logo-section" v-show="isSmallScreen">
          <a href="/dashboard" class="flex items-center">
            <img src="/src/assets/logo.png" alt="Logo" class="logo" />
            <span class="text-surface-600 text-2xl font-medium"
              >Akron Consulting</span
            >
          </a>
          <Button
            :icon="'pi pi-bars'"
            class="hamburger-menu"
            text
            @click.stop="openSidebar"
            ref="menuButtonRef"
          />
        </div>

        <div class="topbar-left">
          <div class="flex items-center gap-6">
            <div class="text-surface-600 text-3xl font-medium">{{ title }}</div>
            <Button
              v-if="title === 'Fasi'"
              label="Nota"
              icon="pi pi-exclamation-triangle"
              @click="helper = true"
              severity="help"
              outlined
            />
          </div>
          <div class="text-surface-500 text-lg mt-2">{{ description }}</div>
          <Drawer
            v-if="title === 'Fasi'"
            v-model:visible="helper"
            header="Nota"
          >
            <p>
              Se modifichi un gruppo di fasi dopo che è stato associato a bandi
              o pratiche, tali associazioni esistenti rimarranno invariate e
              manterranno la configurazione originale del gruppo.
            </p>
          </Drawer>
        </div>
        <div class="topbar-right">
          <div
            class="search-container relative w-full max-w-xl"
            ref="searchContainer"
          >
            <!-- Search input -->
            <div
              class="flex items-center bg-white rounded-md shadow-sm border px-2 min-w-80 w-full"
            >
              <i class="pi pi-search text-gray-400 mr-2"></i>
              <input
                v-model="query"
                @input="onInput"
                @click="isDropdownVisible = true"
                type="text"
                class="flex-1 py-2 outline-none border-none text-sm"
                placeholder="Cerca"
              />
              <button
                v-if="query"
                @click="clearSearch"
                class="text-gray-400 hover:text-gray-600"
              >
                <i class="pi pi-times"></i>
              </button>
            </div>

            <!-- Results container -->
            <div
              v-if="isDropdownVisible && (isSearching || hasSearched)"
              class="absolute top-full left-0 mt-2 w-full bg-white shadow-lg rounded-md border z-50 max-h-[400px] overflow-y-auto"
            >
              <!-- Loader -->
              <div
                v-if="isSearching"
                class="flex justify-center items-center py-10"
              >
                <i class="pi pi-spin pi-spinner text-gray-400 text-xl"></i>
              </div>

              <!-- No results -->
              <div
                v-else-if="!sections.length && hasSearched"
                class="py-4 text-center text-gray-500 text-sm"
              >
                Nessun risultato trovato
              </div>

              <!-- Results -->
              <div v-else>
                <div
                  v-for="section in sections"
                  :key="section.type"
                  class="border-b last:border-none"
                >
                  <div
                    class="flex justify-between items-center px-4 py-2 text-xs text-gray-500 uppercase bg-gray-50"
                  >
                    <span
                      >{{ section.label }} ({{ section.total }} risultati)</span
                    >
                    <a
                      v-if="section.type != 'notes'"
                      href="#"
                      @click.prevent="openAll(section.type)"
                      class="text-[#10b981] hover:underline text-[11px]"
                      >Mostra tutti</a
                    >
                  </div>

                  <ul>
                    <li
                      v-for="item in section.items"
                      :key="item.id"
                      class="px-4 py-2 hover:bg-gray-50 cursor-pointer"
                      @click="selectItem(section.type, item)"
                    >
                      <div class="font-semibold">
                        {{ getItemLabel(section.type, item) }}
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div class="buttons-container">
            <div class="relative">
              <Button
                type="button"
                style="padding: 3px 12px 5px 12px"
                outlined
                @click.stop="showNotifications = !showNotifications"
                class="h-full"
              >
                <OverlayBadge
                  v-if="unreadCount"
                  :value="unreadCount"
                  style="margin-top: 8px"
                >
                  <i class="pi pi-bell" />
                </OverlayBadge>
                <i v-else class="pi pi-bell" />
              </Button>

              <div
                v-if="showNotifications"
                ref="notificationPanel"
                class="absolute right-0 mt-2 w-[300px] notification-dropdown bg-white border border-gray-200 shadow-lg z-50 rounded-md text-left"
              >
                <Panel header="Notifiche">
                  <div
                    v-if="notifications.length === 0"
                    class="p-4 text-center text-gray-500"
                  >
                    Nessuna notifica
                  </div>
                  <div class="mb-3">
                    <Button
                      label="Marca tutte come lette"
                      @click="markAllAsRead"
                      size="small"
                      text
                      class="w-full"
                    />
                  </div>
                  <div class="notification-list">
                    <div
                      v-for="notif in notifications"
                      :key="notif.id"
                      :ref="(el) => observeNotif(el, notif)"
                    >
                      <Card
                        class="mb-2 mt-[1px] notification-card-clickable"
                        :pt="{
                          root: {
                            class: [
                              'notification-card',
                              notif.log_level === 'INFO'
                                ? 'info'
                                : notif.log_level === 'WARNING'
                                ? 'warning'
                                : notif.log_level === 'CRITICAL'
                                ? 'critical'
                                : '',
                              notif.read ? 'bg-white' : '',
                            ],
                          },
                        }"
                        @click="navigateToEntity(notif)"
                      >
                        <template #header>
                          <div class="w-full flex justify-end p-0 m-0">
                            <span
                              class="text-xs text-gray-400 whitespace-nowrap"
                              >{{ getRelativeTime(notif.created_at) }}</span
                            >
                          </div>
                        </template>
                        <template #content>
                          <div class="flex flex-col items-start">
                            <p
                              class="text-sm font-medium text-gray-700 text-left"
                            >
                              {{ notif.log }}
                            </p>
                            <p
                              v-if="notif.details"
                              class="text-xs text-gray-500 text-left w-full mt-0.5"
                            >
                              {{ notif.details }}
                            </p>
                          </div>
                        </template>
                      </Card>
                    </div>
                  </div>
                  <div class="mt-3 text-center">
                    <Button
                      label="Visualizza tutte le notifiche"
                      icon="pi pi-list"
                      @click="goToNotificationsPage"
                      size="small"
                      text
                      class="w-full"
                    />
                  </div>
                </Panel>
              </div>
            </div>

            <Button
              label="Calendar"
              icon="pi pi-calendar"
              @click="showCalendar = true"
              outlined
            />
          </div>
        </div>
      </div>
    </div>
    <Dialog
      v-model:visible="showCalendar"
      modal
      header="Calendar"
      class="w-[75%] h-[85%]"
      contentStyle="height: 100%;"
      maximizable
      @maximize="triggerResizeCalendar"
      @unmaximize="triggerResizeCalendar"
    >
      <div class="h-full">
        <Calendar ref="child" @close-calendar="showCalendar = false" />
      </div>
    </Dialog>
  </div>
</template>

<script setup>
import OverlayBadge from "primevue/overlaybadge";
import Button from "primevue/button";
import Drawer from "primevue/drawer";
import Dialog from "primevue/dialog";
import Panel from "primevue/panel";
import Card from "primevue/card";
import {
  ref,
  onMounted,
  onUnmounted,
  onBeforeUnmount,
  computed,
  watch,
} from "vue";
import Calendar from "@/pages/Calendar.vue";
import { useRouter } from "vue-router";
import { useStore } from "@/store";
import { formatUtcToCest } from "@/utils/dateUtils";
import apiClient from "@/router/apiClient";

let unsubLog = null;
let unsubConnected = null;
let unsubError = null;

const openAll = (section) => {
  if (section === "clients") {
  }
  switch (section) {
    case "clients":
      router.push(`/clients?search=${query.value}`);
      isDropdownVisible.value = false;
      return;
    default:
      isDropdownVisible.value = false;
  }
};

// Add this line to disable automatic attribute inheritance
defineOptions({
  inheritAttrs: false,
});

const helper = ref(false);
const showCalendar = ref(false);
const isSmallScreen = ref(false);
const sidebarVisible = ref(false);
let observer = null;

const props = defineProps({
  title: {
    type: String,
    default: "",
  },
  description: {
    type: String,
    default: "",
  },
  notificationsCount: {
    type: Number,
    default: 0,
  },
});

const child = ref(null);
const menuButtonRef = ref(null);
const notificationPanel = ref(null);
const store = useStore(); // Inizializzazione dello store Pinia
let evtSource = null;
const isSearching = ref(false);
const hasSearched = ref(false);

const entityLabels = {
  allocations: "Pratiche",
  clients: "Clienti",
  tenders: "Bandi",
  phases: "Fasi",
  workflows: "Gruppo di fase",
  users: "Utenti",
  notes: "Note",
};
const sections = ref([]);
const isDropdownVisible = ref(false);
const searchContainer = ref(null);

const triggerResizeCalendar = () => {
  if (child.value) {
    child.value.resizeCalendar();
  }
};

const checkScreenSize = () => {
  isSmallScreen.value = window.innerWidth < 990;
};

const openSidebar = () => {
  window.dispatchEvent(new CustomEvent("toggle-sidebar"));
};

onMounted(() => {
  checkScreenSize();
  window.addEventListener("resize", checkScreenSize);

  window.addEventListener("sidebar-state-changed", (event) => {
    sidebarVisible.value = event.detail.isOpen;
  });

  document.addEventListener("click", handleClickOutside);
  document.addEventListener("click", closeNotificationsOnClickOutside);

  bindSseListeners();
});

onUnmounted(() => {
  window.removeEventListener("resize", checkScreenSize);
  window.removeEventListener("sidebar-state-changed", () => {});
  document.removeEventListener("click", handleClickOutside);
  document.removeEventListener("click", closeNotificationsOnClickOutside);

  if (unsubLog) unsubLog();
  if (unsubConnected) unsubConnected();
  if (unsubError) unsubError();

  unsubLog = unsubConnected = unsubError = null;
});

// notification section
const showNotifications = ref(false);
const notifications = ref([]);

const markAsRead = async (notif) => {
  notif.read = true;
  try {
    await store.sendAck("logs", notif.id);
  } catch (error) {
    console.error("❌ ACK fallito (TopBar):", error);
  }
};

const markAllAsRead = async () => {
  const unreadIds = notifications.value.filter((n) => !n.read).map((n) => n.id);

  if (unreadIds.length === 0) {
    return;
  }

  notifications.value.forEach((n) => {
    n.read = true;
  });

  try {
    await store.sendAck("logs", unreadIds);
  } catch (error) {
    console.error("❌ ACK fallito (TopBar):", error);
  }
  showNotifications.value = false;
};

const unreadCount = computed(
  () =>
    notifications.value.filter((n) => !n.read).length > 9
      ? "9+"
      : notifications.value.filter((n) => !n.read).length // Count unread notifications
);

const formatDate = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();

  const formattedDate = date.toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const formattedTime = date.toLocaleTimeString("it-IT", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const diffTime = Math.abs(now - date);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  let daysText = "";
  if (diffDays === 0) {
    daysText = "Oggi";
  } else if (diffDays === 1) {
    daysText = "1 giorno fa";
  } else {
    daysText = `${diffDays} giorni fa`;
  }

  return `${formattedDate}, ${formattedTime}, ${daysText}`;
};

const bindSseListeners = () => {
  store.ensureSseConnected();

  if (unsubLog) return;

  unsubConnected = store.on("connected", (payload) => {
  });

  unsubError = store.on("error", (err) => {
    console.error("❌ SSE error (TopBar)", err);
  });

  unsubLog = store.on("log", (raw) => {
    try {
      const payload = JSON.parse(raw);

      // NEW FORMAT from Go:
      // payload = { id: "176...", stream: "...", data: { ...values... } }
      const notificationId = payload?.id;
      const values = payload?.data;

      if (!notificationId || !values) return;

      const notification = {
        id: notificationId, // ✅ correct redis stream id
        entity: values.entity,
        entity_id: values.entity_id,
        log_level: values.log_level || "INFO",
        log: values.message, // or values.log if you renamed
        details: values.details || "",
        user_id: values.user_id,

        // if backend provides created_at inside values
        created_at: values.created_at
          ? formatUtcToCest(values.created_at)
          : new Date()
              .toLocaleString("sv-SE", { timeZone: "Europe/Rome" })
              .replace("T", " "),

        updated_at: values.updated_at
          ? formatUtcToCest(values.updated_at)
          : new Date()
              .toLocaleString("sv-SE", { timeZone: "Europe/Rome" })
              .replace("T", " "),

        deleted_at: null,
        read: false,
      };

      if (values.type !== "docgen") {
        notifications.value.unshift(notification);
      }

      if (notifications.value.length > 10) {
        notifications.value = notifications.value.slice(0, 10);
      }
    } catch (error) {
      console.error("Errore nel parsing della notifica (TopBar):", error, raw);
    }
  });
};

const getRelativeTime = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();

  const diffTime = Math.abs(now - date);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString("it-IT", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } else if (diffDays === 1) {
    return "1 giorno fa";
  } else if (diffDays <= 30) {
    return `${diffDays} giorni fa`;
  } else {
    return date.toLocaleDateString("it-IT", {
      day: "2-digit",
      month: "2-digit",
    });
  }
};

const getSeverity = (logLevel) => {
  switch (logLevel) {
    case "INFO":
      return "info";
    case "WARNING":
      return "warn";
    case "CRITICAL":
      return "danger";
    default:
      return "info";
  }
};

const router = useRouter();

const navigateToEntity = (notif) => {
  markAsRead(notif);
  showNotifications.value = false;
  // Needs to be updated for different entities
  router.push(`/${notif.entity.toLowerCase()}s/${notif.entity_id}`);
};

const goToNotificationsPage = () => {
  showNotifications.value = false;
  router.push("/notifications");
};

const closeNotificationsOnClickOutside = (event) => {
  if (showNotifications.value && notificationPanel.value) {
    const notificationButton = event.target.closest("button");

    if (
      !notificationPanel.value.contains(event.target) &&
      !(
        notificationButton &&
        notificationButton.contains(document.querySelector(".pi-bell"))
      )
    ) {
      showNotifications.value = false;
    }
  }
};

const query = ref("");

const search = async () => {
  const q = query.value.trim();
  if (!q) {
    sections.value = [];
    hasSearched.value = true;
    return;
  }
  try {
    isSearching.value = true;
    hasSearched.value = true;

    const response = await apiClient.get(`${store.api}/search`, {
      params: { q },
      headers: { Authorization: `Bearer ${store.token}` },
    });

    sections.value = Object.entries(response.data)
      .map(([key, value]) => ({
        type: key,
        label: entityLabels[key] || key,
        total: value?.meta?.total || 0,
        items: value?.data || [],
        meta: value?.meta || {},
      }))
      .filter((section) => section.items.length > 0);
  } catch (err) {
    console.error("Search failed:", err);
    sections.value = [];
  } finally {
    isSearching.value = false;
    hasSearched.value = true;
  }
};

let searchTimeout = null;

const onInput = () => {
  if (!query.value.trim()) {
    sections.value = [];
    isSearching.value = false;
    hasSearched.value = false;
    return;
  }
  isDropdownVisible.value = true;
  debouncedSearch();
};

const clearSearch = () => {
  query.value = "";
  sections.value = [];
  isSearching.value = false;
  hasSearched.value = false;
  isDropdownVisible.value = false;
};

const debouncedSearch = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(search, 1000);
};

const truncate = (text, maxLength = 100) => {
  if (!text) return "";
  return text.length > maxLength ? text.slice(0, maxLength) + "…" : text;
};

const getItemLabel = (type, item) => {
  switch (type) {
    case "clients":
      return (
        item.legal_name || item.fiscal_code || item.vat_number || "Senza nome"
      );
    case "notes":
      return truncate(item.content, 100) || "Senza contenuto";
    case "tenders":
      return item.name || "Senza nome";
    case "allocations":
      return item.name || `Allocation #${item.id}`;
    case "phases":
      return item.name || `Phase #${item.id}`;
    case "users":
      return item.name || item.user || "Utente sconosciuto";
    case "workflows":
      return item.name || `Workflow #${item.id}`;
    default:
      return item.name || "Senza titolo";
  }
};

const selectItem = (type, item) => {
  query.value = getItemLabel(type, item);
  sections.value = [];
  isSearching.value = false;
  hasSearched.value = false;
  isDropdownVisible.value = false;
  switch (type) {
    case "clients":
      router.push(`/${type}?details=${item.fiscal_code}`);
      return;
    case "notes":
      return;
    case "allocations":
      router.push(`/${type}/allocation-details/${item.id}`);
      return;
    default:
      return;
  }
};

const handleClickOutside = (event) => {
  if (searchContainer.value && !searchContainer.value.contains(event.target)) {
    isDropdownVisible.value = false;
  }
};

const observeNotif = (el, notif) => {
  if (!el) return;
  if (!observer) {
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const n = entry.target.__notif;
            if (n && !n.read) {
              markAsRead(n);
            }
          }
        });
      },
      {
        root: document.querySelector(".notification-dropdown"),
        threshold: 0.9,
      }
    );
  }

  el.__notif = notif;
  observer.observe(el);
};

watch(showNotifications, (newVal, oldVal) => {
  if (oldVal === true && newVal === false) {
    notifications.value = notifications.value.filter((n) => !n.read);
  }
});

onBeforeUnmount(() => {
  if (observer) observer.disconnect();
});
</script>

<style scoped>
.topbar-wrapper {
  width: 100%;
  background-color: transparent;
  z-index: 900; /* Lower z-index so sidebar can appear above it */
  position: relative; /* Needed for z-index to work */
}

.topbar-container {
  width: 100%;
  background-color: white;
}

.topbar-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo-section {
  display: flex;
  align-items: center;
  margin-right: 1rem;
  justify-content: space-between;
  width: 100%;
}

.logo {
  height: 60px;
  width: auto;
}

.hamburger-menu {
  font-size: 1.5rem;
  display: none;
}

.topbar-left {
  flex: 1;
  padding-right: 2rem;
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-direction: row;
}

.search-container {
  display: flex;
}

.buttons-container {
  display: flex;
  gap: 0.5rem;
}

@media (max-width: 990px) {
  .hamburger-menu {
    display: flex;
    margin-left: 1rem;
  }

  .topbar-content {
    flex-direction: column;
    align-items: stretch;
    gap: 1.5rem;
  }

  .logo-section {
    width: 100%;
    justify-content: space-between;
    margin-bottom: 0.5rem;
  }

  .topbar-right {
    justify-content: flex-start;
  }
}

@media (max-width: 600px) {
  .topbar-right {
    flex-direction: column;
    width: 100%;
    gap: 1rem;
  }

  .search-container {
    width: 100%;
  }

  .search-container :deep(.p-iconfield) {
    width: 100%;
  }

  .search-container :deep(.p-inputtext) {
    width: 100%;
  }

  .buttons-container {
    width: 100%;
    justify-content: space-between;
  }

  .buttons-container .p-button {
    flex: 1;
    display: flex;
    justify-content: center;
  }
}

@media (max-width: 500px) {
  .topbar-left {
    display: none;
  }

  .topbar-right {
    display: none;
  }
}

.info {
  background-color: #e6f4ff; /* Light blue */
}

.warning {
  background-color: #fff4e5; /* Light yellow */
}

.critical {
  background-color: #ffe5e5; /* Light red */
}

.bg-white {
  background-color: white;
}

.mobile-sidebar {
  padding: 1.5rem;
}
.notification-card-clickable {
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.notification-card-clickable:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.notification-card :deep(.p-card-header) {
  padding-bottom: 0 !important;
  margin-bottom: 0 !important;
  padding-top: 0 !important;
  padding-right: 0 !important;
}

.notification-card :deep(.p-card-header div) {
  margin: 0 0 -7% 0 !important;
  padding: 4px 3% 0 0 !important;
}

.notification-dropdown {
  max-height: calc(100vh - 120px);
  display: flex;
  flex-direction: column;
}

.notification-dropdown {
  max-height: calc(100vh - 120px);
  display: flex;
  flex-direction: column;
}

.notification-dropdown :deep(.p-panel-content) {
  display: flex;
  flex-direction: column;
  padding: 0.75rem;
}

.notification-list {
  overflow-y: auto;
  max-height: 350px;
  padding: 0 0.25rem;
}

.notification-list::-webkit-scrollbar {
  display: none;
}

.notification-list {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
