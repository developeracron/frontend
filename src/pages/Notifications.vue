<template>
  <div class="flex px-5 pt-5 !mb-0">
    <div class="w-full mx-auto">
      <div>
        <Card>
          <template #content>
            <div class="flex justify-between items-center mb-4">
              <div class="text-xl font-bold">Notifiche</div>
              <div class="flex gap-2 items-center">
                <Button
                  :label="
                    isMobile
                      ? ''
                      : toggleFilters
                      ? 'Nascondi filtri'
                      : 'Mostra filtri'
                  "
                  @click="toggleFilters = !toggleFilters"
                  icon="pi pi-search"
                  severity="help"
                  class="p-button-primary responsive-button"
                  outlined
                  v-tooltip.bottom="{
                    value: isMobile
                      ? toggleFilters
                        ? 'Nascondi filtri'
                        : 'Mostra filtri'
                      : null,
                    showDelay: 100,
                  }"
                />
                <Button
                  label="Marca tutte come lette"
                  @click="markAllAsRead"
                  outlined
                />
              </div>
            </div>

            <DataTable
              :value="notifications"
              lazy
              stripedRows
              responsiveLayout="scroll"
              v-model:first="first"
              filterDisplay="row"
              :filters="filters"
              @filter="onFilter"
              :sortField="sortField"
              :sortOrder="sortOrder"
              @sort="onSort"
              removableSort
              :loading="loading"
              :paginator="true"
              paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
              currentPageReportTemplate="Pagina {currentPage} di {totalPages}"
              paginatorPosition="bottom"
              :rows="perPage"
              :first="first"
              :rowsPerPageOptions="[10, 20, 50, 100]"
              :totalRecords="totalRecords"
              @page="onPage"
            >
              <template #empty>
                <div v-if="message">{{ message }}</div>
              </template>
              <Column
                field="log_level"
                header="Livello"
                style="min-width: 12rem"
                :sortable="true"
                :showFilterMenu="false"
                :showClearButton="false"
              >
                <template #filter="{ filterModel, filterCallback }">
                  <Select
                    v-model="filterModel.value"
                    v-if="toggleFilters"
                    @change="filterCallback()"
                    :options="logLevels"
                    placeholder="Seleziona"
                    :showClear="true"
                  >
                  </Select>
                </template>
                <template #body="slotProps">
                  <Badge
                    :severity="getBadgeSeverity(slotProps.data.log_level)"
                    :value="slotProps.data.log_level"
                  />
                </template>
              </Column>
              <Column field="log" header="Messaggio">
                <template #body="slotProps">
                  <div
                    class="flex flex-col"
                    :class="{
                      'cursor-pointer hover:underline':
                        slotProps.data.entity === 'Client' ||
                        slotProps.data.entity === 'Allocation',
                    }"
                    v-on:click="goToEntity(slotProps.data)"
                  >
                    <span :class="{ 'font-semibold': !slotProps.data.read }">{{
                      slotProps.data.log
                    }}</span>
                    <span
                      v-if="slotProps.data.details"
                      class="text-xs text-gray-500 mt-1"
                    >
                      {{ slotProps.data.details }}
                    </span>
                  </div>
                </template>
              </Column>
              <Column
                field="entity"
                header="Entità"
                :sortable="true"
                :showFilterMenu="false"
                :showClearButton="false"
              >
                <template #filter="{ filterModel, filterCallback }">
                  <InputText
                    v-if="toggleFilters"
                    v-model="filterModel.value"
                    type="search"
                    @input="debouncedFilter(filterCallback)"
                    placeholder="Filtra per entità..."
                  />
                </template>
                <template #body="slotProps">
                  <span class="capitalize">{{ slotProps.data.entity }}</span>
                </template>
              </Column>
              <Column
                field="created_at"
                header="Data"
                :sortable="true"
                :showFilterMenu="false"
                :showClearButton="false"
              >
                <template #filter="{ filterModel, filterCallback }">
                  <div class="relative inline-block w-full max-w-xs">
                    <DatePicker
                      v-if="toggleFilters"
                      v-model="filterModel.value"
                      dateFormat="dd.mm.yy"
                      placeholder="Filtra per data..."
                      @update:modelValue="filterCallback()"
                      class="w-full min-w-40"
                    />
                    <button
                      v-if="filters.created_at.value"
                      @click="clearFilter('created_at')"
                      class="absolute right-4 top-1/2 -translate-y-1/2 text-[22px] font-bold text-blue-900"
                      type="button"
                    >
                      ×
                    </button>
                  </div>
                </template>
                <template #body="slotProps">
                  <div class="flex flex-col">
                    <span class="text-xs text-gray-700">{{
                      formatDate(slotProps.data.created_at)
                    }}</span>
                    <span class="text-xs text-gray-500">{{
                      getRelativeTime(slotProps.data.created_at)
                    }}</span>
                  </div>
                </template>
              </Column>
              <Column
                header="Azioni"
                headerClass="text-right"
                bodyClass="text-right"
              >
                <template #body="slotProps">
                  <Button
                    v-tooltip.top="
                      slotProps.data.read ? 'Già letta' : 'Marca come letta'
                    "
                    icon="pi pi-check"
                    text
                    :severity="slotProps.data.read ? 'success' : 'secondary'"
                    @click="markAsRead(slotProps.data)"
                    :disabled="slotProps.data.read"
                    class="mr-2"
                  />
                  <Button
                    icon="pi pi-arrow-right"
                    text
                    severity="info"
                    @click="goToEntity(slotProps.data)"
                    tooltip="Vai all'entità"
                  />
                </template>
              </Column>
            </DataTable>

            <!-- <DataTable
              :value="notifications"
              stripedRows
              responsiveLayout="scroll"
              class="p-datatable-sm"
              :rows="perPage"
              :rowsPerPageOptions="[5, 10, 20]"
              v-model:first="first"
              :paginator="true"
              paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
              currentPageReportTemplate="Pagina {currentPage} di {totalPages}"
              paginatorPosition="bottom"
              :totalRecords="notifications.length"
              v-model:filters="filters"
              @filter="onFilter"
            >
              <Column
                field="log_level"
                header="Livello"
                :sortable="true"
                :showFilterMenu="false"
                :showClearButton="false"
              >
                <template #filter="{ filterModel, filterCallback }">
                  <InputText
                    v-if="toggleFilters"
                    v-model="filterModel.value"
                    type="search"
                    placeholder="Filtra per livello..."
                    @input="filterCallback()"
                  />
                </template>
                <template #body="slotProps">
                  <Badge
                    :severity="getBadgeSeverity(slotProps.data.log_level)"
                    :value="slotProps.data.log_level"
                  />
                </template>
              </Column>
              <Column field="log" header="Messaggio">
                <template #body="slotProps">
                  <div class="flex flex-col">
                    <span :class="{ 'font-semibold': !slotProps.data.read }">{{
                      slotProps.data.log
                    }}</span>
                    <span
                      v-if="slotProps.data.details"
                      class="text-xs text-gray-500 mt-1"
                    >
                      {{ slotProps.data.details }}
                    </span>
                  </div>
                </template>
              </Column>
              <Column field="entity" header="Entità" :sortable="true">
                <template #body="slotProps">
                  <span class="capitalize">{{ slotProps.data.entity }}</span>
                </template>
              </Column>
              <Column field="created_at" header="Data" :sortable="true">
                <template #body="slotProps">
                  <div class="flex flex-col">
                    <span class="text-xs text-gray-700">{{
                      formatDate(slotProps.data.created_at)
                    }}</span>
                    <span class="text-xs text-gray-500">{{
                      getRelativeTime(slotProps.data.created_at)
                    }}</span>
                  </div>
                </template>
              </Column>
              <Column
                header="Azioni"
                headerClass="text-right"
                bodyClass="text-right"
              >
                <template #body="slotProps">
                  <Button
                    v-tooltip.top="
                      slotProps.data.read ? 'Già letta' : 'Marca come letta'
                    "
                    icon="pi pi-check"
                    text
                    :severity="slotProps.data.read ? 'success' : 'secondary'"
                    @click="markAsRead(slotProps.data)"
                    :disabled="slotProps.data.read"
                    class="mr-2"
                  />
                  <Button
                    icon="pi pi-arrow-right"
                    text
                    severity="info"
                    @click="goToEntity(slotProps.data)"
                    tooltip="Vai all'entità"
                  />
                </template>
              </Column>
            </DataTable> -->
          </template>
        </Card>

        <br />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, onUnmounted, reactive } from "vue";
import { useRouter } from "vue-router";
import apiClient from "@/router/apiClient";
import Button from "primevue/button";
import Checkbox from "primevue/checkbox";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import Dropdown from "primevue/dropdown";
import MultiSelect from "primevue/multiselect";
import Badge from "primevue/badge";
import Card from "primevue/card";
import { useStore } from "@/store"; // Corretto import dello store Pinia
import InputText from "primevue/inputtext";
import ProgressSpinner from "primevue/progressspinner";
import { FilterMatchMode } from "@primevue/core/api";
import Select from "primevue/select";
import DatePicker from "primevue/datepicker";
import { formatDateIso } from "@/utils/dateUtils";
import { formatUtcToCest } from "@/utils/dateUtils";
import Paginator from "primevue/paginator";

const router = useRouter();
const store = useStore(); // Inizializzazione dello store Pinia
const notifications = ref([]);
let evtSource = null;

const totalRecords = ref(0);
const perPage = ref(20);
const first = ref(0);
const sortField = ref(null);
const sortOrder = ref(null);
const toggleFilters = ref(true);
const logLevels = ref(["INFO"]);
const message = ref("");
//ref(store.defaults.log_levels);
// const filters = reactive({
//   log_level: "",
//   entity: "",
//   user_id: "",
//   from: "",
//   to: "",
//   start_date: null,
//   end_date: null,
// });
const filters = ref({
  log_level: { value: null, matchMode: FilterMatchMode.CONTAINS },
  entity: { value: null, matchMode: FilterMatchMode.CONTAINS },
  created_at: { value: null, matchMode: FilterMatchMode.EQUALS },
});

const loading = ref(false);
const isMobile = ref(false);

const sseUrl = import.meta.env.VITE_SSE_URL;

const checkScreenSize = () => {
  isMobile.value = window.innerWidth < 500;
};

const onFilter = (event) => {
  filters.value = event.filters;
  loading.value = true;
  first.value = 0;
  fetchNotifications();
};

const clearFilter = (key) => {
  if (filters.value[key]) {
    filters.value[key].value = null;
    first.value = 0;
    onFilter({ filters: { ...filters.value } });
  }
};

const onPage = (event) => {
  loading.value = true;
  if (event.rows !== perPage.value) {
    perPage.value = event.rows;
    first.value = 0;
  } else {
    first.value = event.first;
  }
  fetchNotifications();
};

const onSort = (event) => {
  sortField.value = event.sortField;
  sortOrder.value = event.sortOrder;
  fetchNotifications();
};

// const initFilters = () => {
//   filters.value = {
//     log_level: { value: null, matchMode: FilterMatchMode.CONTAINS },
//   };
// };

// initFilters();

const fetchNotifications = async () => {
  const page = Math.floor(first.value / perPage.value) + 1;
  // params: {
  //       log_level: "INFO",
  //       entity: "Client",
  //       user_id: "9ec08273-a2f3-45d0-8a0b-91ea60c7bd5d",
  //       from: "2024-05-10",
  //       to: "2026-05-10",
  //       page: null,
  //       per_page: null,
  //     },

  const logLevel = filters.value.log_level?.value || null;
  const entity = filters.value.entity?.value || null;
  const userId = filters.value.user_id?.value || null;
  const from = formatDateIso(filters.value.created_at?.value) || null;
  const to = formatDateIso(filters.value.end_date?.value) || null;

  const params = {
    log_level: logLevel,
    entity: entity,
    user_id: userId,
    from: from,
    to: to,
    per_page: perPage.value,
    page: page,
    by: sortField.value || null,
    desc: sortOrder.value === -1 ? 1 : 0,
  };


  try {
    const result = await apiClient.get(`${store.api}/activity-logs`, {
      params,
      headers: {
        Authorization: `Bearer ${store.token}`,
      },
    });

    if (result.data.data.length === 0) {
      notifications.value = [];
      message.value = "Non ci sono notifiche disponibile.";
    } else if (result.data && Array.isArray(result.data.data)) {
      notifications.value = result.data.data.map((item) => ({
        id: item.id,
        entity: item.entity,
        entity_id: item.entity_id,
        log_level: item.log_level || "INFO",
        log: item.log,
        details: item.details || "",
        user_id: item.user_id,
        created_at: formatUtcToCest(item.created_at),
        updated_at: formatUtcToCest(item.updated_at),
        deleted_at: formatUtcToCest(item.deleted_at),
        read: item.read || false,
      }));
      totalRecords.value = result.data.meta.total;
    } else if (result.data && typeof result.data === "object") {
      const dataArray = Object.values(result.data);
      notifications.value = dataArray.map((item) => ({
        id: item.id,
        entity: item.entity,
        entity_id: item.entity_id,
        log_level: item.log_level || "INFO",
        log: item.log,
        details: item.details || "",
        user_id: item.user_id,
        created_at: formatUtcToCest(item.created_at),
        updated_at: formatUtcToCest(item.updated_at),
        deleted_at: formatUtcToCest(item.deleted_at),
        read: item.read || false,
      }));
      totalRecords.value = result.data.meta.total;
    } else {
      notifications.value = [];
    }

    refreshNotifications();
  } catch (error) {
    console.error("Errore nel caricamento delle notifiche:", error);
    notifications.value = [];
  }
  loading.value = false;
};

const listenNotifications = () => {
  const userId = store.user;
  const token = store.token;

  if (!userId || !token) {
    console.error(
      "Utente o token mancante, impossibile connettersi agli eventi SSE"
    );
    return;
  }

  if (evtSource) {
    evtSource.close();
  }

  const normalizedSseUrl = (sseUrl || "").replace(/\/+$/, "");
  const sseBaseUrl = normalizedSseUrl.endsWith("/sse")
    ? normalizedSseUrl.slice(0, -4)
    : normalizedSseUrl;

  fetch(`${sseBaseUrl}/session`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ user_id: userId }),
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`SSE session failed (${response.status}): ${await response.text()}`);
      }

      evtSource = new EventSource(
        `${sseUrl}?user_id=${encodeURIComponent(userId)}`,
        { withCredentials: true }
      );

      evtSource.onopen = () => {
      };

      evtSource.addEventListener("connected", function () {
      });

      evtSource.addEventListener("log", function (event) {
        try {
          const payload = JSON.parse(event.data);

          const notificationId = payload?.id;
          const values = payload?.data;
          if (!notificationId || !values) return;

          const notification = {
            id: notificationId,
            entity: values.entity,
            entity_id: values.entity_id,
            log_level: values.log_level || "INFO",
            log: values.message,
            details: values.details || "",
            user_id: values.user_id,
            created_at: values.created_at
              ? formatUtcToCest(values.created_at)
              : new Date()
                  .toISOString()
                  .replace("T", " ")
                  .substring(0, 19),
            updated_at: values.updated_at
              ? formatUtcToCest(values.updated_at)
              : new Date()
                  .toISOString()
                  .replace("T", " ")
                  .substring(0, 19),
            deleted_at: null,
            read: false,
          };

          notifications.value.unshift(notification);
        } catch (error) {
          console.error("Errore nel parsing della notifica:", error);
        }
      });

      evtSource.onerror = (err) => {
        console.error("❌ Errore di connessione SSE", err);
      };
    })
    .catch((error) => {
      console.error("❌ Errore di inizializzazione SSE", error);
    });
};

const refreshNotifications = async () => {
  try {
    notifications.value.sort((a, b) => {
      if (a.read !== b.read) {
        return a.read ? 1 : -1;
      }
      return new Date(b.created_at) - new Date(a.created_at);
    });
  } catch (error) {
    console.error("Errore durante il refresh delle notifiche:", error);
  }
};

const sendAck = async (logIds) => {
  if (!logIds || (Array.isArray(logIds) && !logIds.length)) {
    console.error("Nessun ID fornito per l'acknowledgment");
    return false;
  }

  const ids = Array.isArray(logIds) ? logIds : [logIds];

  try {
    const data = await store.sendAck("logs", ids);

    // Aggiorno la tabella dopo l'ack
    await refreshNotifications();
    return true;
  } catch (error) {
    console.error("❌ ACK fallito", error);
    return false;
  }
};

const markAsRead = async (notif) => {
  const success = await sendAck(notif.id);
  if (success) {
    notif.read = true;
  }
};

const markAllAsRead = async () => {
  const unreadIds = notifications.value.filter((n) => !n.read).map((n) => n.id);

  if (unreadIds.length === 0) {
    return;
  }

  const success = await sendAck(unreadIds);

  if (success) {
    notifications.value.forEach((n) => {
      if (unreadIds.includes(n.id)) {
        n.read = true;
      }
    });
  }
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString("it-IT", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getRelativeTime = (dateString) => {
  const now = new Date();
  const date = new Date(dateString);
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} giorni fa`;
  if (hours > 0) return `${hours} ore fa`;
  if (minutes > 0) return `${minutes} minuti fa`;
  return "Appena adesso";
};

const getBadgeSeverity = (logLevel) => {
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

const goToEntity = (notif) => {
  markAsRead(notif);
  switch (notif.entity.toLowerCase()) {
    case "client":
      router.push(`/${notif.entity.toLowerCase()}s?details=${notif.entity_id}`);
      return;
    case "allocation":
      router.push(
        `/${notif.entity.toLowerCase()}s/allocation-details/${notif.entity_id}`
      );
      return;
    default:
      return;
  }
  //router.push(`/${notif.entity.toLowerCase()}s/${notif.entity_id}`);
};

onMounted(() => {
  checkScreenSize();
  fetchNotifications();
  listenNotifications();
  loading.value = true;
});

onUnmounted(() => {
  if (evtSource) {
    evtSource.close();
    evtSource = null;
  }
});

let filterTimeout = null;

const debouncedFilter = (filterCallback) => {
  if (filterTimeout) {
    clearTimeout(filterTimeout);
  }
  filterTimeout = setTimeout(() => {
    filterCallback();
  }, 1000);
};
</script>

<style scoped>
.p-datatable-sm .p-datatable-tbody > tr > td {
  padding: 0.75rem 1rem;
}
</style>
