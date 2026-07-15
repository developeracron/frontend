<template>
  <div class="clients-page px-8 sm:px-8">
    <!-- <div v-if="isMapLoading" class="flex items-center justify-center w-full h-72">
      <ProgressSpinner />
    </div> -->
    <div v-show="!isMapLoading && showMap" class="map-container">
      <div id="map" class="w-full h-96 mb-6"></div>
    </div>

    <div
      v-if="loadingClientModal"
      class="absolute inset-0 flex items-center justify-center bg-white/50 z-10 rounded-md"
    >
      <ProgressSpinner />
    </div>

    <Card class="my-2">
      <template #content>
        <div class="flex flex-col sm:flex-col w-full">
          <div class="flex justify-between items-center mb-4 w-full">
            <div class="text-xl font-bold">Anagrafica</div>
            <div class="flex items-center gap-2 action-buttons">
              <Button
                v-show="!isMapLoading"
                :label="
                  isMobile ? '' : showMap ? 'Nascondi mappa' : 'Mostra mappa'
                "
                @click="toggleMap"
                icon="pi pi-map"
                severity="info"
                class="p-button-primary responsive-button"
                outlined
                v-tooltip.bottom="{
                  value: isMobile
                    ? showMap
                      ? 'Nascondi mappa'
                      : 'Mostra mappa'
                    : null,
                  showDelay: 100,
                }"
              />
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
                type="button"
                icon="pi pi-filter-slash"
                :label="isMobile ? '' : 'Pulisci filtri'"
                outlined
                class="responsive-button"
                @click="clearFilters()"
                v-tooltip.bottom="{
                  value: isMobile ? 'Pulisci filtri' : null,
                  showDelay: 100,
                }"
              />

              <Button
                v-if="canCreateClient"
                icon="pi pi-plus"
                :label="isMobile ? '' : 'Aggiungi nuovo cliente'"
                severity="success"
                class="responsive-button"
                @click="$router.push('/clients/new_client')"
                outlined
                v-tooltip.bottom="{
                  value: isMobile ? 'Aggiungi nuovo cliente' : null,
                  showDelay: 100,
                }"
              />
            </div>
          </div>
          <DataTable
            :value="clients"
            lazy
            class="p-datatable-customers"
            :responsive-layout="'scroll'"
            stripedRows
            ref="dataTable"
            :scrollable="true"
            scrollHeight="calc(100vh - 270px)"
            :rowHover="true"
            :paginator="true"
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
            currentPageReportTemplate="Pagina {currentPage} di {totalPages}"
            paginatorPosition="bottom"
            :rows="perPage"
            :first="first"
            :rowsPerPageOptions="[10, 20, 50, 100]"
            :totalRecords="totalRecords"
            @page="onPage"
            @sort="onSort"
            :sortField="sortField"
            :sortOrder="sortOrder"
            removableSort
            v-model:first="first"
            filterDisplay="row"
            :filters="filters"
            @filter="onFilter"
            :loading="loading"
          >
            <Column
              field="legal_name"
              sortable
              header="Nome Legale"
              :showFilterMenu="false"
              :showClearButton="false"
            >
              <template #filter="{ filterModel, filterCallback }">
                <InputText
                  v-if="toggleFilters"
                  v-model="filterModel.value"
                  type="search"
                  @input="debouncedFilter(filterCallback)"
                  placeholder="Filtra per nome legale..."
                />
              </template>
            </Column>
            <Column
              field="sector"
              sortable
              header="Tipologia di cliente"
              :showFilterMenu="false"
              :showClearButton="false"
            >
              <template #filter="{ filterModel, filterCallback }">
                <Select
                  v-model="filterModel.value"
                  v-if="toggleFilters"
                  @change="filterCallback()"
                  :options="sectors"
                  placeholder="Seleziona"
                  :showClear="true"
                >
                  {{ sectors }}
                  <template #option="slotProps">
                    <Tag :value="slotProps.option" />
                  </template>
                </Select>
              </template>
            </Column>
            <Column
              field="fiscal_code"
              sortable
              header="Codice Fiscale"
              :showFilterMenu="false"
              :showClearButton="false"
            >
              <template #filter="{ filterModel, filterCallback }">
                <InputText
                  v-if="toggleFilters"
                  v-model="filterModel.value"
                  type="search"
                  @input="debouncedFilter(filterCallback)"
                  placeholder="Filtra per codice fiscale..."
                />
              </template>
              <template #body="slotProps">
                {{ slotProps.data.fiscal_code }}
                <p
                  v-if="
                    isVatNumberDifferent(
                      slotProps.data.fiscal_code,
                      slotProps.data.vat_number
                    )
                  "
                  class="text-muted-color text-xs"
                >
                  P.IVA: {{ slotProps.data.vat_number }}
                </p>
              </template>
            </Column>
            <Column
              field="user"
              sortable
              header="Utente"
              :showFilterMenu="false"
              :showClearButton="false"
            >
              <template #filter="{ filterModel, filterCallback }">
                <InputText
                  v-if="toggleFilters"
                  v-model="filterModel.value"
                  type="search"
                  @input="debouncedFilter(filterCallback)"
                  placeholder="Filtra per utente..."
                />
              </template>
            </Column>
            <Column
              field="region"
              header="Regione"
              sortable
              :showFilterMenu="false"
              :showClearButton="false"
            >
              <template #filter="{ filterModel, filterCallback }">
                <InputText
                  v-if="toggleFilters"
                  v-model="filterModel.value"
                  type="search"
                  @input="debouncedFilter(filterCallback)"
                  placeholder="Filtra per regione..."
                />
              </template>
            </Column>
            <Column
              field="city"
              header="Città"
              sortable
              :showFilterMenu="false"
              :showClearButton="false"
            >
              <template #filter="{ filterModel, filterCallback }">
                <InputText
                  v-if="toggleFilters"
                  v-model="filterModel.value"
                  type="search"
                  @input="debouncedFilter(filterCallback)"
                  placeholder="Filtra per città..."
                />
              </template>
            </Column>
            <Column field="address_type" sortable header="Tipo di sede">
              <template #body="slotProps">
                {{ slotProps.data.address_type.join(", ") }}
              </template>
            </Column>
            <Column
              field="composedAtecoCode"
              sortable
              header="Codice ateco"
              :showFilterMenu="false"
              :showClearButton="false"
            >
              <template #filter="{ filterModel, filterCallback }">
                <InputText
                  v-if="toggleFilters"
                  v-model="filterModel.value"
                  type="search"
                  @input="debouncedFilter(filterCallback)"
                  placeholder="Filtra per codice ateco..."
                />
              </template>
            </Column>
            <Column field="active_allocation" sortable header="Pratica attiva">
              <template #body="{ data }">
                <div class="flex items-center justify-center">
                  <a
                    v-if="data.active_allocation.length"
                    :href="
                      data.active_allocation.length > 1
                        ? `/allocations?urgent=1&client_id=${data.id}`
                        : `/allocations/allocation-details/${data.active_allocation[0]}`
                    "
                    class="text-green-500"
                  >
                    <i class="pi pi-check-circle"></i>
                  </a>
                  <a
                    v-else
                    :href="`/allocations?urgent=1&client_id=${data.id}`"
                  >
                    <i class="pi pi-times-circle text-red-400"></i>
                  </a>
                </div>
              </template>
            </Column>
            <Column
              header="Azioni"
              class="min-w-44"
              v-if="showClientActionsColumn"
            >
              <template #body="slotProps">
                <Button
                  v-if="canViewClient"
                  type="button"
                  icon="pi pi-eye"
                  severity="info"
                  @click="openClientDetailsModal(slotProps.data)"
                  text
                />
                <Button
                  v-if="canUpdateClient"
                  type="button"
                  icon="pi pi-pencil"
                  severity="secondary"
                  @click="$router.push(`/clients/${slotProps.data.id}`)"
                  text
                />
                <Button
                  v-if="canDeleteClient"
                  type="button"
                  icon="pi pi-trash"
                  severity="danger"
                  text
                  @click="confirmDeleteClient(slotProps.data)"
                />
              </template>
            </Column>
            <template #empty>
              <div v-if="message">{{ message }}</div>
            </template>
          </DataTable>
        </div>
      </template>
    </Card>

    <Dialog
      v-model:visible="newClientModal"
      header="Aggiungi Nuovo Cliente"
      :modal="true"
      :closable="true"
    >
      <ClientCreate
        :mode="currentMode"
        :existingClientData="currentClientData"
        @close="newClientModal = false"
        @clientSaved="handleClientSaved"
      />
    </Dialog>

    <Dialog
      v-model:visible="showClientDetailsModal"
      :modal="true"
      :closable="true"
      :style="clientDetailsModalStyle"
    >
      <template #header>
        <div class="text-lg font-bold">
          Dettagli del cliente: {{ currentClientData.legal_name }}
        </div>
      </template>
      <ClientDetails :existingClientData="currentClientData" />
    </Dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch, nextTick } from "vue";
import { useStore } from "@/store";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import Button from "primevue/button";
import Dialog from "primevue/dialog";
import Card from "primevue/card";
import ClientCreate from "./ClientCreateOrUpdate.vue";
import ClientDetails from "./ClientDetails.vue";
import apiClient from "@/router/apiClient";
import { Loader } from "@googlemaps/js-api-loader";
import apiService from "@/services/apiService";
import { useConfirm } from "primevue/useconfirm";
import Tag from "primevue/tag";
import Select from "primevue/select";
import TreeSelect from "primevue/treeselect";
import { FilterMatchMode } from "@primevue/core/api";
import ProgressSpinner from "primevue/progressspinner";
import { useRoute, useRouter } from "vue-router";
import Tooltip from "primevue/tooltip";
import { useToast } from "primevue/usetoast";
import InputText from "primevue/inputtext";
import { usePermissions } from "@/composables/usePermissions";

const store = useStore();
const clients = ref([]);
const message = ref("");
const toast = useToast();
const newClientModal = ref(false);
const showClientDetailsModal = ref(false);
const updateClientModal = ref(false);
const selectedClientId = ref(null);
const currentMode = ref("create");
const currentClientData = ref({});
const confirm = useConfirm();
const toggleFilters = ref(true);
const sectors = ref(store.defaults.sectors);
const addressTypes = ref(["Sede legale", "Sede operativa"]);
const atecoCodes = ref([]);
const atecoTreeData = ref([]);
const allocations = ref([]);
const allocationTypes = ref([
  { label: "Sì", value: true },
  { label: "No", value: false },
]);
const mapMarkers = ref([]);
const dataTable = ref(null);
const isMapLoading = ref(true);
let currentMarker = null;
const inputRef = ref(null);
const isMapLoaded = ref(false);

const route = useRoute();
const router = useRouter();
const showMap = ref(false);
const mapInstance = ref(null);
let AdvancedMarkerElementClass = null;
const markersAdded = ref(false);
const searchBoxInstance = ref(null);
const pacInputRef = ref(null);
const isMobile = ref(false);
const loading = ref(false);
const totalRecords = ref(0);
const perPage = ref(20);
const first = ref(0);
const sortField = ref(null);
const sortOrder = ref(null);
const loadingClientModal = ref(false);

const selectedAtecoKey = ref(null);
// const initFilters = () => {
//   filters.value = {
//     sector: { value: null, matchMode: FilterMatchMode.EQUALS },
//     address_type: { value: null, matchMode: FilterMatchMode.CONTAINS },
//     composedAtecoCode: { value: null, matchMode: FilterMatchMode.CONTAINS },
//     active_allocation: { value: null, matchMode: FilterMatchMode.EQUALS },
//   };
// };

const filters = ref({
  legal_name: { value: null, matchMode: FilterMatchMode.CONTAINS },
  sector: { value: null, matchMode: FilterMatchMode.EQUALS },
  fiscal_code: { value: null, matchMode: FilterMatchMode.CONTAINS },
  user: { value: null, matchMode: FilterMatchMode.CONTAINS },
  region: { value: null, matchMode: FilterMatchMode.CONTAINS },
  city: { value: null, matchMode: FilterMatchMode.CONTAINS },
  composedAtecoCode: { value: null, matchMode: FilterMatchMode.CONTAINS },
  search: { value: null, matchMode: FilterMatchMode.CONTAINS },
});

const { can, canAny } = usePermissions();

const canViewClient = computed(() => can("clients.view"));
const canManageClient = computed(() => can("clients.manage"));
const canCreateClient = computed(() => canManageClient.value);
const canUpdateClient = computed(() => canManageClient.value);
const canDeleteClient = computed(() => can("clients.full"));

const showClientActionsColumn = computed(() =>
  canAny(["clients.view", "clients.manage", "clients.full"])
);

const clearMapMarkers = () => {
  mapMarkers.value.forEach((marker) => {
    marker.setMap(null);
  });
  mapMarkers.value = [];
};

//initFilters();

const clearFilters = async () => {
  //initFilters();
  loading.value = true;
  Object.keys(filters.value).forEach((key) => {
    filters.value[key].value = null;
  });
  await fetchClients();
  //selectedAtecoKey.value = null;
};

const clientDetailsModalStyle = computed(() => {
  return {
    width: window.innerWidth < 990 ? "90%" : "80%",
  };
});

const openClientModal = (mode, clientData = {}) => {
  currentMode.value = mode;
  currentClientData.value = mode === "update" ? clientData : {};
  newClientModal.value = true;
};

const openClientDetailsModal = (clientData = {}) => {
  showClientDetailsModal.value = false;

  setTimeout(() => {
    currentClientData.value = clientData;
    showClientDetailsModal.value = true;
    updateUrlForClients(clientData.fiscal_code);
  }, 50);
};

const updateUrlForClients = (fiscalCode) => {
  const query = { ...route.query };

  if (fiscalCode) query.details = fiscalCode;
  else delete query.details;

  router.replace({ path: "/clients", query });
};

const loadClientDetails = async () => {
  if (!route.query.details) return;

  try {
    loadingClientModal.value = true;
    const response = await apiClient.get(
      `${store.api}/clients/${route.query.details}`,
      {
        headers: { Authorization: `Bearer ${store.token}` },
      }
    );

    if (response.data.data.length === 0) {
      currentClientData.value = {};
      toast.add({
        severity: "error",
        summary: "Errore",
        detail: "Cliente non trovato",
        life: 3000,
      });
      router.replace({ path: "/clients", query: route.query });
    } else {
      currentClientData.value = response.data.data;
      updateUrlForClients(route.query.details);
      showClientDetailsModal.value = true;
    }
  } catch (error) {
    console.error("Error fetching client by fiscal code:", error.message);
    toast.add({
      severity: "error",
      summary: "Errore",
      detail: "Impossibile caricare i dettagli del cliente",
      life: 3000,
    });
    router.replace({ path: "/clients", query: route.query });
  } finally {
    loadingClientModal.value = false;
  }
};

watch(showClientDetailsModal, (newValue) => {
  if (!newValue) {
    updateUrlForClients();
  }
});

// const toggleMap = () => {
//   showMap.value = !showMap.value;

//   if (showMap.value && clients.value.length > 0) {
//     setTimeout(() => {
//       if (!mapInstance.value) {
//         if (!filteredData.value || filteredData.value.length === 0) {
//           filteredData.value = [...clients.value];
//         }
//         fetchPlaceDetailsForClients();
//       } else {
//         if (google && google.maps) {
//           google.maps.event.trigger(mapInstance.value, "resize");
//           refreshMapMarkers();
//         }
//       }
//     }, 100);
//   }
// };

const toggleMap = async () => {
  showMap.value = !showMap.value;

  if (showMap.value) {
    await nextTick();

    if (!mapInstance.value) {
      await initMap();
    }

    await renderMapMarkers();
  }
};

const processAddress = async (
  placeId,
  client,
  setRegionCity = false,
  isLegal = false
) => {
  if (!mapInstance.value || !AdvancedMarkerElementClass) return;

  let validPlaceId = null;

  if (typeof placeId === "string" && placeId.trim()) {
    validPlaceId = placeId.trim();
  } else if (
    placeId &&
    typeof placeId === "object" &&
    typeof placeId.google_place_id === "string" &&
    placeId.google_place_id.trim()
  ) {
    validPlaceId = placeId.google_place_id.trim();
  }

  if (!validPlaceId) {
    client.region = "N/A";
    client.city = "N/A";
    return;
  }

  try {
    const place = new google.maps.places.Place({
      id: validPlaceId,
      requestedLanguage: "it",
      requestedRegion: "IT",
    });

    try {
      const result = await place.fetchFields({
        fields: [
          "displayName",
          "formattedAddress",
          "location",
          "addressComponents",
        ],
      });
      const details = result.place;

      if (details && details.location) {
        const components = details.addressComponents || [];
        if (setRegionCity) {
          client.region = getRegion(components);
          client.city = getCity(components);
        }
        try {
          const map = mapInstance.value.__v_raw || mapInstance.value;

          const { PinElement } = await google.maps.importLibrary("marker");

          const bluePin = new PinElement({
            background: "#3b82f6",
            borderColor: "#1d4ed8",
            glyphColor: "#ffffff",
          });
          // if (isLegal) {
          //   new AdvancedMarkerElementClass({
          //     map,
          //     position: details.location,
          //     title: client.legal_name,
          //   });
          // } else {
          //   new AdvancedMarkerElementClass({
          //     map,
          //     position: details.location,
          //     title: client.legal_name,
          //     content: bluePin.element,
          //   });
          // }
          const marker = new AdvancedMarkerElementClass({
            map,
            position: details.location,
            title: client.legal_name,
            content: isLegal ? undefined : bluePin.element,
          });

          mapMarkers.value.push(marker);
        } catch (err) {
          console.error("Errore nella creazione del advanced marker:", err);
          try {
            new google.maps.Marker({
              map: mapInstance.value,
              position: details.location,
              title: client.legal_name,
              animation: google.maps.Animation.DROP,
            });
          } catch (fallbackErr) {
            console.error(
              "Anche il fallback del marker è fallito:",
              fallbackErr
            );
          }
        }
      } else {
        if (setRegionCity) {
          client.region = "N/A";
          client.city = "N/A";
        }
      }
    } catch (err) {
      if (err?.message?.includes("NOT_FOUND")) {
        return null;
      }
      console.error("Error fetching the place", err);
    }
  } catch (error) {
    console.error("Errore durante il recupero dei dettagli del place:", error);
    if (setRegionCity) {
      client.region = "N/A";
      client.city = "N/A";
    }
  }
};

const processClientAddresses = async (client) => {
  const addressTypeFilter = dataTable.value?.filters?.["address_type"]?.value;
  let legalProcessed = false;

  if (!addressTypeFilter || addressTypeFilter === "Sede legale") {
    if (Array.isArray(client.legal_address) && client.legal_address.length) {
      client.legal_address.forEach((address, index) =>
        processAddress(address, client, index === 0, true)
      );
      legalProcessed = true;
    }
  }

  if (!addressTypeFilter || addressTypeFilter === "Sede operativa") {
    if (Array.isArray(client.addresses) && client.addresses.length) {
      client.addresses.forEach((address, index) =>
        processAddress(address, client, !legalProcessed && index === 0)
      );
    }
  }
};

const editClient = (clientId) => {
  router.push(`/clients/${clientId}`);
};

const confirmDeleteClient = (client) => {
  confirm.require({
    message: "Sei sicuro di voler eliminare questo cliente?",
    header: "Conferma eliminazione",
    icon: "pi pi-exclamation-triangle",
    acceptClass: "p-button-danger",
    rejectClass: "p-button-secondary",
    acceptLabel: "Sì",
    rejectLabel: "Annulla",
    accept: () => deleteClient(client),
  });
};

const formatAtecoCode = (client) => {
  if (client.ateco_secondary_code) {
    return `${client.ateco_code} - ${client.ateco_secondary_code}`;
  } else if (client.ateco_primary_code) {
    return `${client.ateco_code} - ${client.ateco_primary_code}`;
  } else {
    return client.ateco_code || "";
  }
};

const deleteClient = async (client) => {
  try {
    const status = await apiService.deleteWithAuth("clients", client.id, {
      successMessage: "Allocazione eliminata con successo!",
      errorMessage: "Eliminazione dell'allocazione fallita.",
    });

    if (status === 204) {
      clients.value = clients.value.filter((a) => a.key !== client.id);
      message.value =
        clients.value.length === 0
          ? "Nessun dato su anagrafica ancora disponibile."
          : "";
    }
    await clearFilters();
  } catch (error) {
    console.error("Error deleting clients:", error.message);
  }
};

const handleClientSaved = async () => {
  newClientModal.value = false;
  await clearFilters();
};

const fetchClients = async () => {
  if (!canViewClient.value) {
    clients.value = [];
    totalRecords.value = 0;
    message.value = "Non hai i permessi per visualizzare i clienti.";
    loading.value = false;
    return;
  }

  const page = Math.floor(first.value / perPage.value) + 1;


  const legalName = filters.value.legal_name?.value || null;
  const user = filters.value.user?.value || null;
  const sector = filters.value.sector?.value || null;
  const fiscalCode = filters.value.fiscal_code?.value || null;
  const city = filters.value.city?.value || null;
  const region = filters.value.region?.value || null;
  const ateco = filters.value.composedAtecoCode?.value || null;
  const search = filters.value.search?.value || null;

  const params = {
    name: legalName,
    user: user,
    sector: sector,
    fiscal_code: fiscalCode,
    region: region,
    city: city,
    ateco: ateco,
    search: search,
    per_page: perPage.value,
    page: page,
    by: sortField.value || null,
    desc: sortOrder.value === -1 ? 1 : 0,
  };


  const response = await apiClient.get(`${store.api}/clients`, {
    params,
    headers: {
      Authorization: `Bearer ${store.token}`,
    },
  });

  if (response.data.data.length === 0) {
    clients.value = [];
    message.value = "Nessun dato su anagrafica ancora disponibile";
  } else {
    clients.value = response.data.data;
    totalRecords.value = response.data.meta.total;
    composeAtecoCode();
    addAddressType();
    await fetchPlaceDetailsForClients();

    if (showMap.value) {
      await renderMapMarkers();
    }
  }
  loading.value = false;
};

const composeAtecoCode = () => {
  clients.value = clients.value.map((client) => {
    if (client.ateco_code) {
      const parts = [client.ateco_code];

      if (client.ateco_primary_code != null) {
        parts.push(client.ateco_primary_code);
      }

      if (client.ateco_secondary_code != null) {
        parts.push(client.ateco_secondary_code);
      }

      return {
        ...client,
        composedAtecoCode: parts.join("-"),
      };
    }

    return {
      ...client,
      composedAtecoCode: "",
    };
  });
};

const fetchAtecoCodes = async () => {
  try {
    const response = await apiClient.get(`${store.api}/ateco`, {
      headers: {
        Authorization: `Bearer ${store.token}`,
      },
    });

    response.data.data.forEach((item) => atecoCodes.value.push(item.code));

    atecoTreeData.value = response.data.data.map((item) => {
      return {
        key: item.code,
        label: `${item.code} - (${item.primary_codes}) `,
        data: item,
        selectable: true,
        children: [],
        leaf: false,
      };
    });

  } catch (error) {
    console.error("Error fetching ATECO data:", error);
  }
};

const addAddressType = () => {
  clients.value.forEach((client) => {
    client.address_type = [];
    if (Array.isArray(client.legal_address) && client.legal_address.length) {
      client["address_type"].push("Sede legale");
    }
    if (Array.isArray(client.addresses) && client.addresses.length) {
      client["address_type"].push("Sede operativa");
    }
  });
};

const checkScreenSize = () => {
  isMobile.value = window.innerWidth < 500;
};

onMounted(async () => {
  checkScreenSize();

  window.addEventListener("resize", checkScreenSize);
  window.addEventListener("resize", () => {
    if (showClientDetailsModal.value) {
      showClientDetailsModal.value = false;
      setTimeout(() => {
        showClientDetailsModal.value = true;
      }, 0);
    }
  });

  loading.value = true;
  //filteredData.value = [...clients.value];

  if (route.query.details) {
    await loadClientDetails();
  }

  if (route.query.search) {
    filters.value.search = { value: route.query.search };
  }
  await fetchAtecoCodes();
  sortField.value = "legal_name";
  sortOrder.value = 1;
  await fetchClients();
});

watch(
  () => route.query.details,
  async (newDetails, oldDetails) => {
    if (newDetails && newDetails !== oldDetails) {
      await loadClientDetails();
    }
  }
);

const onFilter = (event) => {
  // filteredData.value = event.filteredValue || [];
  // markersAdded.value = false;

  // if (showMap.value && mapInstance.value) {
  //   if (mapInstance.value.setMap) {
  //     mapInstance.value.setMap(null);
  //   }

  //   setTimeout(() => {
  //     filteredData.value.forEach((client) => {
  //       processClientAddresses(client);
  //     });
  //     markersAdded.value = true;
  //   }, 100);
  // }

  filters.value = event.filters;
  loading.value = true;
  first.value = 0;
  fetchClients();
};

const fetchPlaceDetailsForClients = async () => {
  //get the city and region for every client
  clients.value.forEach((client) => {
    processClientAddresses(client);
  });

  //map stuff
  // if (mapInstance.value) {
  //   if (!markersAdded.value && filteredData.value.length > 0) {
  //     filteredData.value.forEach((client) => {
  //       processClientAddresses(client);
  //     });
  //     markersAdded.value = true;
  //   }
  //   return;
  // }

  try {
    const loader = new Loader({
      apiKey: import.meta.env.VITE_APP_GOOGLE_MAPS_API_KEY,
      libraries: ["places", "marker"],
      language: "it",
      region: "IT",
    });

    const Maps = await loader.importLibrary("maps");
    const { AdvancedMarkerElement } = await loader.importLibrary("marker");

    AdvancedMarkerElementClass = AdvancedMarkerElement;

    const map = new Maps.Map(document.getElementById("map"), {
      center: { lat: 45.0703, lng: 7.6869 },
      zoom: 6,
      mapId: "DEMO_MAP_ID",
      mapTypeControl: false,
    });

    mapInstance.value = map;

    // if (!filteredData.value || filteredData.value.length === 0) {
    //   filteredData.value = [...clients.value];
    // }

    // filteredData.value.forEach((client) => {
    //   processClientAddresses(client);
    // });
    markersAdded.value = true;

    await initializeSearchBox(map);
  } catch (error) {
    console.error("Errore nel caricamento della mappa:", error);
    toast.add({
      severity: "error",
      summary: "Errore",
      detail:
        "Impossibile caricare la mappa. Verifica la chiave API Google Maps.",
      life: 5000,
    });
  } finally {
    isMapLoading.value = false;
  }
};

const renderMapMarkers = async () => {
  if (!mapInstance.value) return;

  clearMapMarkers();

  for (const client of clients.value) {
    await processClientAddresses(client);
  }
};

const refreshMapMarkers = () => {
  if (!mapInstance.value) return;

  mapInstance.value.setMap(null);

  // if (filteredData.value && filteredData.value.length > 0) {
  //   filteredData.value.forEach((client) => {
  //     processClientAddresses(client);
  //   });
  // } else if (clients.value.length > 0) {
  //   clients.value.forEach((client) => {
  //     processClientAddresses(client);
  //   });
  // }
};

const reattachInput = () => {
  if (inputRef.value && mapInstance.value) {
    if (inputRef.value.parentNode) {
      inputRef.value.parentNode.removeChild(inputRef.value);
    }

    document.body.appendChild(inputRef.value);

    mapInstance.value.controls[google.maps.ControlPosition.TOP_LEFT].push(
      inputRef.value
    );

    if (!searchBoxInstance.value && google.maps.places) {
      searchBoxInstance.value = new google.maps.places.SearchBox(
        inputRef.value
      );

      searchBoxInstance.value.addListener(
        "places_changed",
        handlePlacesChanged
      );

      mapInstance.value.addListener("bounds_changed", () => {
        searchBoxInstance.value.setBounds(mapInstance.value.getBounds());
      });
    }
  }
};

const handlePlacesChanged = () => {
  const places = searchBoxInstance.value.getPlaces();

  if (!places || places.length === 0) {
    return;
  }

  const place = places[0];

  if (currentMarker) {
    currentMarker.setMap(null);
  }

  currentMarker = new google.maps.Marker({
    map: mapInstance.value,
    position: place.geometry.location,
    title: place.name,
    icon: {
      url: "https://maps.google.com/mapfiles/ms/icons/purple-dot.png",
      scaledSize: new google.maps.Size(40, 40),
    },
  });

  mapInstance.value.setCenter(place.geometry.location);
  mapInstance.value.setZoom(10);
};

let searchMarker = null;
let infoWindow = null;

function updateInfoWindow(content, center) {
  infoWindow.setContent(content);
  infoWindow.setPosition(center);
  infoWindow.open({
    map,
    anchor: searchMarker,
    shouldFocus: false,
  });
}

let directionsService;
let directionsRenderer;

const initializeSearchBox = async (map) => {
  const createSearchBox = (labelText, id) => {
    const wrapper = document.createElement("div");
    wrapper.classList.add("searchbox-wrapper");

    const label = document.createElement("p");
    label.textContent = labelText;
    wrapper.appendChild(label);

    const placeAutocomplete = new google.maps.places.PlaceAutocompleteElement();
    placeAutocomplete.id = id;
    placeAutocomplete.style.width = "300px";
    wrapper.appendChild(placeAutocomplete);

    return { wrapper, placeAutocomplete };
  };

  // --- Card container
  const card = document.createElement("div");
  card.classList.add("place-autocomplete-card");

  // --- Initial searchbox ("Cerca un luogo:")
  const { wrapper: singleWrapper, placeAutocomplete: singleSearch } =
    createSearchBox("Cerca un luogo:", "single-autocomplete-input");

  card.appendChild(singleWrapper);

  // --- Add (+) button
  const addBtn = document.createElement("button");
  addBtn.textContent = "+";
  addBtn.classList.add("route-btn");
  card.appendChild(addBtn);

  map.controls[google.maps.ControlPosition.TOP_LEFT].push(card);

  // --- Marker & infoWindow setup
  const { PinElement } = await google.maps.importLibrary("marker");
  const greenPin = new PinElement({
    background: "#22c55e",
    borderColor: "#16a34a",
    glyphColor: "#ffffff",
  });

  // Create "A" pin
  const pinA = new PinElement({
    background: "#4285F4", // classic blue
    borderColor: "#3367D6", // darker border
    glyphText: "A",
    glyphColor: "#ffffff",
  });

  // Create "B" pin
  const pinB = new PinElement({
    background: "#EA4335", // red
    borderColor: "#C5221F", // darker border
    glyphText: "B",
    glyphColor: "#ffffff",
  });

  searchMarker = new AdvancedMarkerElementClass({
    map,
    content: greenPin.element,
  });
  infoWindow = new google.maps.InfoWindow({});

  // --- State
  let originPlace = null;
  let destinationPlace = null;
  let toWrapper = null;
  let toSearch = null;
  let removeBtn = null;

  // --- Setup directions service
  directionsService = new google.maps.DirectionsService();
  directionsRenderer = new google.maps.DirectionsRenderer({
    map,
    suppressMarkers: true,
  });

  let originMarker = null;
  let destinationMarker = null;

  const updateRoute = () => {
    if (originPlace && destinationPlace && mapInstance.value) {
      if (searchMarker) {
        searchMarker.setMap(null);
      }
      directionsService.route(
        {
          origin: originPlace.formattedAddress,
          destination: destinationPlace.formattedAddress,
          travelMode: google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === "OK") {
            directionsRenderer.setDirections(result);

            // Clear old markers
            if (originMarker) {
              originMarker.setMap(null);
              originMarker = null;
            }
            if (destinationMarker) {
              destinationMarker.setMap(null);
              destinationMarker = null;
            }

            // Create markers
            originMarker = new AdvancedMarkerElementClass({
              map,
              position: originPlace.location,
              content: pinA.element,
            });

            destinationMarker = new AdvancedMarkerElementClass({
              map,
              position: destinationPlace.location,
              content: pinB.element,
            });
          } else {
            console.error("Directions request failed:", status);
          }
        }
      );
    }
  };

  const attachPlaceListener = (placeAutocomplete, isOrigin = true) => {
    placeAutocomplete.addEventListener(
      "gmp-select",
      async ({ placePrediction }) => {
        const place = placePrediction.toPlace();
        await place.fetchFields({
          fields: [
            "addressComponents",
            "displayName",
            "formattedAddress",
            "location",
          ],
        });

        if (place.viewport) {
          map.fitBounds(place.viewport);
        } else {
          map.setCenter(place.location);
          if (isOrigin) {
            map.setZoom(15);
          } else {
            map.setZoom(12);
          }
        }

        if (isOrigin) {
          originPlace = place;
        } else {
          destinationPlace = place;
        }

        // If both set → draw route
        updateRoute();

        // If only origin → show marker
        if (isOrigin && !destinationPlace) {
          // let content =
          //   '<div id="infowindow-content">' +
          //   '<span id="place-displayname" class="font-bold">' +
          //   place.displayName +
          //   "</span><br />" +
          //   '<span id="place-address">' +
          //   place.formattedAddress +
          //   "</span>" +
          //   "</div>";
          // updateInfoWindow(content, place.location);
          searchMarker.position = place.location;
          searchMarker.setMap(map);

          const city = getCity(place.addressComponents);
          const region = getRegion(place.addressComponents);

          let shouldRefetch = false;

          if (city && city !== "N/A" && filters.value.city.value !== city) {
            filters.value.city.value = city;
            shouldRefetch = true;
          }

          if (
            region &&
            region !== "N/A" &&
            filters.value.region.value !== region
          ) {
            filters.value.region.value = region;
            shouldRefetch = true;
          }

          if (shouldRefetch) {
            first.value = 0;
            loading.value = true;
            await fetchClients();
            if (!showMap.value) {
              showMap.value = true;
              await nextTick();
              await initMap();
            }
          }
        }
      }
    );
  };

  attachPlaceListener(singleSearch, true);

  // --- Handle add/remove buttons
  addBtn.addEventListener("click", () => {
    singleWrapper.querySelector("p").textContent = "Da:";

    if (!toWrapper) {
      const toObj = createSearchBox("A:", "to-autocomplete-input");
      toWrapper = toObj.wrapper;
      toSearch = toObj.placeAutocomplete;
      card.insertBefore(toWrapper, addBtn);
      attachPlaceListener(toSearch, false);
    }

    card.removeChild(addBtn);
    removeBtn = document.createElement("button");
    removeBtn.textContent = "—";
    removeBtn.classList.add("route-btn");
    card.appendChild(removeBtn);

    removeBtn.addEventListener("click", () => {
      singleWrapper.querySelector("p").textContent = "Cerca un luogo:";
      if (toWrapper) {
        card.removeChild(toWrapper);
        toWrapper = null;
        toSearch = null;
        destinationPlace = null;
        // if (originPlace) {
        //   searchMarker.position = originPlace.location;
        // }

        // Clear old markers
        if (originMarker) {
          originMarker.setMap(null);
          originMarker = null;
        }
        if (destinationMarker) {
          destinationMarker.setMap(null);
          destinationMarker = null;
        }

        // Re-add green search marker if origin exists
        if (originPlace) {
          if (!searchMarker) {
            searchMarker = new AdvancedMarkerElementClass({
              map,
              content: greenPin.element,
              position: originPlace.location,
            });
          } else {
            searchMarker.position = originPlace.location;
            searchMarker.setMap(map);
          }
        }
      }
      directionsRenderer.setDirections({ routes: [] }); // clear route
      card.removeChild(removeBtn);
      card.appendChild(addBtn);
    });
  });
};

const getCity = (components) => {
  return (
    getComponent(components, "locality") ||
    getComponent(components, "administrative_area_level_3") ||
    getComponent(components, "administrative_area_level_2") ||
    "N/A"
  );
};

const getRegion = (components) => {
  return getComponent(components, "administrative_area_level_1") || "N/A";
};

const getComponent = (components, type) => {
  if (!Array.isArray(components)) {
    return null;
  }

  const comp = components.find(
    (c) => Array.isArray(c.types) && c.types.includes(type)
  );
  return comp?.longText || comp?.long_name || null;
};

const isVatNumberDifferent = (fiscal_code, vat_number) => {
  return vat_number && vat_number !== fiscal_code;
};

const onNodeExpand = async (event) => {
  try {

    if (!event) {
      console.error("Evento di espansione nodo non definito");
      return;
    }

    const node = event;

    if (!node.key) {
      console.error("Chiave nodo mancante nell'evento di espansione");
      return;
    }

    if (!node.children) {
      node.children = [];
    }

    if (node.children.length > 0) {
      return;
    }


    if (!node.key.includes("-")) {
      try {
        const response = await apiClient.get(`${store.api}/ateco/${node.key}`, {
          headers: {
            Authorization: `Bearer ${store.token}`,
          },
        });

        if (
          response.data?.data &&
          Array.isArray(response.data.data) &&
          response.data.data.length > 0
        ) {
          const primaryNodes = response.data.data.map((primary) => ({
            key: `${node.key}-${primary.id}`,
            label: primary.id,
            data: primary,
            selectable: true,
            children: [],
            leaf: false,
            parentCode: node.key,
            primaryCode: primary.id,
          }));

          node.children = primaryNodes;
        } else {
          node.children = [
            {
              key: `empty-${Date.now()}`,
              label: "Nessun dato disponibile",
              selectable: false,
              leaf: true,
            },
          ];
        }
      } catch (innerError) {
        console.error(
          `Errore durante il caricamento dei codici primari per ${node.key}:`,
          innerError
        );
        node.children = [
          {
            key: `error-${Date.now()}`,
            label: "Errore di caricamento",
            selectable: false,
            leaf: true,
          },
        ];
      }
    } else if (node.key.includes("-")) {
      try {
        const parts = node.key.split("-");
        if (parts.length < 2) {
          console.error(`Formato chiave nodo non valido: ${node.key}`);
          node.children = [
            {
              key: `error-${Date.now()}`,
              label: "Formato chiave non valido",
              selectable: false,
              leaf: true,
            },
          ];
          return;
        }

        const mainCode = parts[0];
        const primaryCode = parts[1];

        const response = await apiClient.get(
          `${store.api}/ateco/${mainCode}/${primaryCode}`,
          {
            headers: {
              Authorization: `Bearer ${store.token}`,
            },
          }
        );

        if (
          response.data?.data &&
          Array.isArray(response.data.data) &&
          response.data.data.length > 0
        ) {
          const secondaryNodes = response.data.data.map((secondary) => ({
            key: `${node.key}-${secondary.code}`,
            label: secondary.code,
            data: secondary,
            selectable: true,
            children: [],
            leaf: true,
          }));

          node.children = secondaryNodes;
        } else {
          node.children = [
            {
              key: `empty-${Date.now()}`,
              label: "Nessun dato disponibile",
              selectable: false,
              leaf: true,
            },
          ];
        }
      } catch (innerError) {
        console.error(
          `Errore durante il caricamento dei codici secondari per ${node.key}:`,
          innerError
        );
        node.children = [
          {
            key: `error-${Date.now()}`,
            label: "Errore di caricamento",
            selectable: false,
            leaf: true,
          },
        ];
      }
    }
  } catch (error) {
    console.error(
      `Errore durante il caricamento dei dati per l'evento di espansione:`,
      error
    );
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
  fetchClients();
};

const onSort = (event) => {
  sortField.value = event.sortField;
  sortOrder.value = event.sortOrder;
  fetchClients();
};

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
.clients-page {
  background-color: var(--surface-50);
}

.p-datatable-customers {
  width: 100%;
}

/* :deep(.p-treeselect-label) {
  max-width: 80px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

:deep(.p-treeselect-items) .p-treeselect-item .p-treeselect-item-content {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 250px;
} */

@media screen and (max-width: 600px) {
  .action-buttons {
    flex-direction: column;
    align-items: flex-end;
    width: 100%;
    gap: 0.5rem !important;
  }

  .responsive-button {
    width: auto;
    font-size: 0.85rem;
    padding: 0.4rem 0.6rem !important;
  }

  .responsive-button .p-button-label {
    font-size: 0.85rem;
  }

  .responsive-button .p-button-icon {
    font-size: 0.85rem;
  }
}

@media screen and (max-width: 640px) {
  .action-buttons {
    align-items: stretch;
  }

  .responsive-button {
    width: 100%;
    justify-content: flex-start;
  }
}

.pac-card {
  background-color: #fff;
  border: 0;
  border-radius: 2px;
  box-shadow: 0 1px 4px -1px rgba(0, 0, 0, 0.3);
  margin: 10px;
  padding: 0 0.5em;
  font: 400 18px Roboto, Arial, sans-serif;
  overflow: hidden;
  font-family: Roboto;
  padding: 0;
  color: black;
}

#pac-container {
  padding-bottom: 12px;
  margin-right: 12px;
}

.pac-controls {
  display: inline-block;
  padding: 5px 11px;
}

.pac-controls label {
  font-family: Roboto;
  font-size: 13px;
  font-weight: 300;
  color: black;
}

#pac-input {
  margin-top: 12px;
  background-color: #fff;
  font-family: Roboto;
  font-size: 15px;
  font-weight: 400;
  margin-left: 12px;
  padding: 8px 11px 8px 30px;
  text-overflow: ellipsis;
  width: 400px;
  color: black;
  border: 2px solid #5e6061;
  border-radius: 4px;
  text-overflow: ellipsis;
  box-shadow: 0 1px 4px -1px rgba(0, 0, 0, 0.3);
}

@media screen and (max-width: 768px) {
  #pac-input {
    width: calc(100% - 24px);
    margin-left: 12px;
    margin-right: 12px;
  }
}

.icon-left {
  background: url("https://static.thenounproject.com/png/101791-200.png")
    no-repeat left;
  background-size: 20px;
  background-position: 5px center;
}

.hidden-cls {
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.3s ease-in-out;
}

.map-container {
  position: relative;
  width: 100%;
}

.controls {
  position: absolute;
  top: 50px;
  left: 10px;
  z-index: 1000;
  margin-top: 12px;
  background-color: #fff;
  font-family: Roboto;
  font-size: 15px;
  font-weight: 400;
  padding: 8px 11px 8px 30px;
  text-overflow: ellipsis;
  width: 30%;
  color: black;
  border: 2px solid #5e6061;
  border-radius: 4px;
  box-shadow: 0 1px 4px -1px rgba(0, 0, 0, 0.3);
}

@media screen and (max-width: 990px) {
  .controls {
    width: 99%;
    left: 0.5%;
  }
}

@media screen and (max-width: 500px) {
  .action-buttons {
    flex-direction: row !important;
    justify-content: flex-end !important;
    align-items: center;
    gap: 0.1rem !important;
  }

  .responsive-button {
    width: auto !important;
    padding: 0.4rem !important;
    justify-content: center !important;
    min-width: 2.2rem !important;
    margin: 0 !important;
  }

  .responsive-button .p-button-label {
    display: none !important;
    visibility: hidden !important;
    width: 0 !important;
    height: 0 !important;
    overflow: hidden !important;
    position: absolute !important;
    opacity: 0 !important;
    pointer-events: none !important;
  }

  .responsive-button .p-button-icon {
    margin-right: 0 !important;
    font-size: 1rem !important;
  }

  .responsive-button.p-button-outlined {
    min-width: 0 !important;
    margin-left: 0.1rem !important;
    margin-right: 0.1rem !important;
  }

  .text-xl {
    white-space: nowrap;
  }
}

@media screen and (max-width: 640px) {
  .clients-page {
    padding-left: 0.5rem;
    padding-right: 0.5rem;
  }
}
</style>
