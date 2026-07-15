<template>
  <div class="p-1 w-full text-[13px]">
    <div class="flex flex-col md:flex-row gap-4 mb-4">
      <div
        class="w-full md:w-2/3 bg-white rounded-lg shadow-md overflow-hidden"
      >
        <TreeTable
          :value="allocations"
          :lazy="true"
          :paginator="true"
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
          currentPageReportTemplate="Pagina {currentPage} di {totalPages}"
          paginatorPosition="bottom"
          :rows="perPageAllocations"
          :first="firstAllocations"
          :rowsPerPageOptions="[10, 20, 50, 100]"
          :totalRecords="totalRecordsAllocations"
          @page="onPageAllocations"
          @sort="onSortAllocations"
          removableSort
          scrollHeight="calc(100vh - 350px)"
          :rowHover="true"
          :resizableColumns="true"
          :scrollable="true"
          scrollDirection="both"
          :loading="loadingAllocations"
          class="flex flex-col w-full h-[400px]"
        >
          <Column field="client_name" header="Cliente" sortable>
            <template #body="slotProps">
              <button
                type="button"
                class="hover:underline cursor-pointer text-left bg-transparent border-none p-0"
                @click="getClientData(slotProps.node.data.client.id)"
              >
                {{ slotProps.node.data.client?.legal_name }}
              </button>
            </template>
          </Column>
          <Column field="name" header="Nome" sortable>
            <template #body="slotProps">
              <a
                :href="`/allocations/allocation-details/${slotProps.node.data?.id}`"
                class="hover:underline cursor-pointer"
              >
                {{ slotProps.node.data.name }}
              </a>
            </template>
          </Column>
          <Column field="start_date" header="Data inizio" sortable>
            <template #body="slotProps">
              {{ formatDate(slotProps.node.data.start_date) }}
            </template>
          </Column>
          <Column field="end_date" header="Data fine" sortable>
            <template #body="slotProps">
              {{ formatDate(slotProps.node.data.end_date) }}
            </template>
          </Column>
          <template #empty>
            <div v-if="allocationMessage">{{ allocationMessage }}</div>
          </template>
        </TreeTable>
      </div>
      <div
        class="w-full md:w-1/3 bg-white rounded-lg shadow-md flex flex-col h-[400px]"
      >
        <div class="flex-grow">
          <div
            v-show="!isLoading"
            id="map"
            class="w-full h-full rounded-lg"
          ></div>
          <div v-if="isLoading" class="flex items-center justify-center h-full">
            <ProgressSpinner />
          </div>
        </div>
      </div>
    </div>

    <div class="flex flex-col md:flex-row gap-4">
      <div
        class="w-full md:w-1/3 bg-white rounded-lg shadow-md overflow-hidden"
      >
        <TreeTable
          :value="tenders"
          :lazy="true"
          :paginator="true"
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
          currentPageReportTemplate="Pagina {currentPage} di {totalPages}"
          paginatorPosition="bottom"
          :rows="perPageTenders"
          :first="firstTenders"
          :rowsPerPageOptions="[10, 20, 50, 100]"
          :totalRecords="totalRecordsTenders"
          @page="onPageTenders"
          @sort="onSortTenders"
          removableSort
          :resizableColumns="true"
          :scrollable="true"
          scrollDirection="both"
          :loading="loadingTenders"
          scrollHeight="calc(100vh - 250px)"
          :rowHover="true"
          class="flex flex-col w-full h-[500px]"
        >
          <Column field="name" header="Nome" sortable>
            <template #body="slotProps">
              <a
                :href="`/tenders/${slotProps.node.data?.id}`"
                class="hover:underline cursor-pointer"
              >
                {{ slotProps.node.data.name }}
              </a>
            </template>
          </Column>
          <Column field="end_date" header="Data Fine" sortable>
            <template #body="slotProps">
              {{ formatDate(slotProps.node.data.end_date) }}
            </template>
          </Column>
          <template #empty>
            <div v-if="tenderMessage">{{ tenderMessage }}</div>
          </template>
        </TreeTable>
      </div>

      <div
        class="w-full md:w-2/3 bg-white rounded-lg shadow-md pt-2 h-[500px] flex flex-col relative"
      >
        <Calendar ref="child" class="w-full h-full" :hideToday="true" />
      </div>
    </div>
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
  <!-- <div class="dashboard-cards-container">
      <Card class="dashboard-card mb-6">
        <template #content>
          <h1 class="font-bold mb-4 text-center">BANDI</h1>

          <div class="col-span-1 flex justify-center items-center">
            <Chart
              type="bar"
              :data="chartData"
              :options="chartOptions"
              class="h-[30rem] w-full"
            />
          </div>
        </template>
      </Card>

      <Card class="dashboard-card mb-6">
        <template #content>
          <h1 class="font-bold mb-4 text-center">CLIENTI PER TIPOLOGIE</h1>

          <div class="col-span-1 flex justify-center items-center">
            <Chart
              type="pie"
              :data="chartData2"
              :options="chartOptions2"
              class="h-[30rem] w-full max-w-[30rem]"
            />
          </div>
        </template>
      </Card>
    </div> -->

  <!--      <GMapMap-->
  <!--          :center="{lat: 41.8719, lng: 12.5674}"-->
  <!--          :zoom="6"-->
  <!--          style="width: 100%; height: 500px;">-->
  <!--        <GMapMarker-->
  <!--            v-for="client in clients"-->
  <!--            :key="client.id"-->
  <!--            :position="getClientLocation(client.legal_address)"-->
  <!--            :clickable="true"-->
  <!--            :draggable="false">-->
  <!--          <GMapInfoWindow>-->
  <!--            <div>-->
  <!--              <h3>{{ client.legal_name }}</h3>-->
  <!--              <p>{{ getAddressString(client.legal_address) }}</p>-->
  <!--            </div>-->
  <!--          </GMapInfoWindow>-->
  <!--        </GMapMarker>-->
  <!--      </GMapMap>-->
  <!-- </div> -->
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import Card from "primevue/card";
import Chart from "primevue/chart";
import { useStore } from "@/store";
import apiClient from "@/router/apiClient";
import apiService from "@/services/apiService";
//import { Calendar } from "@fullcalendar/core/index.js";
import Calendar from "@/pages/Calendar.vue";
import TreeTable from "primevue/treetable";
import Column from "primevue/column";
import Dialog from "primevue/dialog";
import ProgressSpinner from "primevue/progressspinner";
import { Loader } from "@googlemaps/js-api-loader";
import { formatDate } from "@/utils/dateUtils";
import ClientDetails from "./ClientDetails.vue";
import { useToast } from "primevue/usetoast";

const store = useStore();
const clients = ref([]);
const toast = useToast();

const toggleSizeAllocations = ref(false);

const showCalendar = ref(false);
const isLoading = ref(true);
const mapInstance = ref(null);
const placesService = ref(null);
const markersAdded = ref(false);

const fetchClients = async () => {
  try {
    const response = await apiClient.get(`${store.api}/clients`, {
      headers: { Authorization: `Bearer ${store.token}` },
    });
    clients.value = response.data.data;
    isLoading.value = false;
    if (clients.value.length) {
      addAddressType();
      await fetchPlaceDetailsForClients();
    }
  } catch (error) {
    console.error("Error fetching clients:", error);
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

const fetchPlaceDetailsForClients = async () => {
  const loader = new Loader({
    apiKey: import.meta.env.VITE_APP_GOOGLE_MAPS_API_KEY,
    libraries: ["places", "marker"],
    language: "it",
    region: "IT",
  });

  const Places = await loader.importLibrary("places");
  const service = new Places.PlacesService(document.createElement("div"));
  placesService.value = service;

  const Maps = await loader.importLibrary("maps");
  const map = new Maps.Map(document.getElementById("map"), {
    center: { lat: 45.0703, lng: 7.6869 },
    zoom: 9,
    mapId: "DEMO_MAP_ID",
  });

  mapInstance.value = map;

  const { AdvancedMarkerElement } = await loader.importLibrary("marker");

  if (mapInstance.value && clients.value.length > 0) {
    clients.value.forEach((client) => {
      processClientAddresses(client);
    });
  }
};

const processClientAddresses = (client) => {
  if (Array.isArray(client.legal_address) && client.legal_address.length) {
    client.legal_address.forEach((address) => processAddress(address, client));
  }

  if (Array.isArray(client.addresses) && client.addresses.length) {
    client.addresses.forEach((address) => processAddress(address, client));
  }
};

const processAddress = (placeId, client) => {
  placesService.value.getDetails({ placeId }, (place, status) => {
    if (status === google.maps.places.PlacesServiceStatus.OK) {
      client.region = getRegion(place.address_components);
      client.city = getCity(place.address_components);
      // new google.maps.marker.AdvancedMarkerElement({
      //   position: {
      //     lat: place.geometry.location.lat(),
      //     lng: place.geometry.location.lng(),
      //   },
      //   map: mapInstance.value,
      //   title: client.legal_name,
      // });
      new google.maps.Marker({
        position: {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        },
        map: mapInstance.value,
        title: client.legal_name,
      });
    } else {
      client.region = "N/A";
      client.city = "N/A";
    }
  });
};

const getRegion = (addressComponents) => {
  const regionComponent = addressComponents.find((component) =>
    component.types.includes("administrative_area_level_1")
  );
  return regionComponent ? regionComponent.long_name : "N/A";
};

const getCity = (addressComponents) => {
  const cityComponent = addressComponents.find((component) =>
    component.types.includes("locality")
  );
  return cityComponent ? cityComponent.long_name : "N/A";
};
const getClientLocation = (legalAddress) => {
  const localityComponent = legalAddress.find((component) =>
    component.types.includes("locality")
  );
  const countryComponent = legalAddress.find((component) =>
    component.types.includes("country")
  );
  if (
    localityComponent &&
    countryComponent &&
    countryComponent.short_name === "IT"
  ) {
    return { lat: 45.0703, lng: 7.6869 };
  }
  return null;
};

const getAddressString = (legalAddress) => {
  return legalAddress.map((component) => component.long_name).join(", ");
};

const chartData = ref();
const chartOptions = ref();

const setChartData = () => {
  const documentStyle = getComputedStyle(document.documentElement);

  return {
    labels: [
      "Gennaio",
      "Febbraio",
      "Marzo",
      "Aprile",
      "Maggio",
      "Giugno",
      "Luglio",
    ],
    datasets: [
      {
        type: "bar",
        label: "Bandi attivati",
        backgroundColor: documentStyle.getPropertyValue("--p-cyan-500"),
        data: [50, 25, 12, 48, 90, 76, 42],
      },
      {
        type: "bar",
        label: "Bandi conclusi",
        backgroundColor: documentStyle.getPropertyValue("--p-gray-500"),
        data: [21, 84, 24, 75, 37, 65, 34],
      },
    ],
  };
};
const setChartOptions = () => {
  const documentStyle = getComputedStyle(document.documentElement);
  const textColor = documentStyle.getPropertyValue("--p-text-color");
  const textColorSecondary = documentStyle.getPropertyValue(
    "--p-text-muted-color"
  );
  const surfaceBorder = documentStyle.getPropertyValue(
    "--p-content-border-color"
  );

  return {
    maintainAspectRatio: false,
    aspectRatio: 0.8,
    plugins: {
      tooltips: {
        mode: "index",
        intersect: false,
      },
      legend: {
        labels: {
          color: textColor,
        },
      },
    },
    scales: {
      x: {
        stacked: true,
        ticks: {
          color: textColorSecondary,
        },
        grid: {
          color: surfaceBorder,
        },
      },
      y: {
        stacked: true,
        ticks: {
          color: textColorSecondary,
        },
        grid: {
          color: surfaceBorder,
        },
      },
    },
  };
};

const chartData2 = ref();
const chartOptions2 = ref();

const setChartData2 = () => {
  const documentStyle = getComputedStyle(document.body);

  return {
    labels: ["Agricolo", "Commerciale", "Turistico"],
    datasets: [
      {
        data: [77, 209, 178],
        backgroundColor: [
          documentStyle.getPropertyValue("--p-slate-400"),
          documentStyle.getPropertyValue("--p-rose-400"),
          documentStyle.getPropertyValue("--p-orange-400"),
        ],
        hoverBackgroundColor: [
          documentStyle.getPropertyValue("--p-slate-300"),
          documentStyle.getPropertyValue("--p-rose-300"),
          documentStyle.getPropertyValue("--p-orange-300"),
        ],
      },
    ],
  };
};

const setChartOptions2 = () => {
  const documentStyle = getComputedStyle(document.documentElement);
  const textColor = documentStyle.getPropertyValue("--p-text-color");

  return {
    plugins: {
      legend: {
        labels: {
          usePointStyle: true,
          color: textColor,
        },
      },
    },
  };
};

const loadingAllocations = ref(false);
const allocations = ref([]);
const allocationMessage = ref("");
const perPageAllocations = ref(10);
const firstAllocations = ref(0);
const totalRecordsAllocations = ref(0);
const sortFieldAllocations = ref(null);
const sortOrderAllocations = ref(null);

const loadingTenders = ref(false);
const tenders = ref([]);
const tenderMessage = ref("");
const perPageTenders = ref(10);
const firstTenders = ref(0);
const totalRecordsTenders = ref(0);
const sortFieldTenders = ref(null);
const sortOrderTenders = ref(null);

const onPageAllocations = (event) => {
  loadingAllocations.value = true;
  if (event.rows !== perPageAllocations.value) {
    perPageAllocations.value = event.rows;
    firstAllocations.value = 0;
  } else {
    firstAllocations.value = event.first;
  }
  fetchAllocations();
};

const onSortAllocations = (event) => {
  sortFieldAllocations.value = event.sortField;
  sortOrderAllocations.value = event.sortOrder;
  fetchAllocations();
};

const onPageTenders = (event) => {
  loadingTenders.value = true;
  if (event.rows !== perPageTenders.value) {
    perPageTenders.value = event.rows;
    firstTenders.value = 0;
  } else {
    firstTenders.value = event.first;
  }
  fetchTenders();
};

const onSortTenders = (event) => {
  sortFieldTenders.value = event.sortField;
  sortOrderTenders.value = event.sortOrder;
  fetchTenders();
};

const isAdmin = computed(() => {
  return store.user?.role === "admin"
      || store.user?.roles?.includes("admin")
      || store.me?.role === "admin";
});

const fetchAllocations = async () => {
  const page =
    Math.floor(firstAllocations.value / perPageAllocations.value) + 1;

  const params = {
    per_page: perPageAllocations.value,
    page: page,
    by: sortFieldAllocations.value || null,
    desc: sortOrderAllocations.value === -1 ? 1 : 0,
    light: 1,
    only_my: isAdmin ? 0 : 1,
  };

  if (!sortFieldAllocations.value) {
    params.urgent = 1;
  }

  try {
    const response = await apiClient.get(`${store.api}/allocations`, {
      params,
      headers: { Authorization: `Bearer ${store.token}` },
    });
    if (response.data.data.length === 0) {
      allocationMessage.value =
        "Nessun dato sulle pratiche ancora disponibile.";
      allocations.value = [];
    } else {
      allocations.value = response?.data?.data?.map((allocation) => ({
        key: allocation.id,
        data: allocation,
      }));
      totalRecordsAllocations.value = response.data.meta.total;
    }
  } catch (error) {
    console.error("Error fetching allocations:", error.message);
  }
  loadingAllocations.value = false;
};

const fetchTenders = async () => {
  const page = Math.floor(firstTenders.value / perPageTenders.value) + 1;

  const params = {
    per_page: perPageTenders.value,
    page: page,
    by: sortFieldTenders.value || null,
    desc: sortOrderTenders.value === -1 ? 1 : 0,
    light: 1,
  };

  if (!sortFieldTenders.value) {
    params.urgent = 1;
  }
  try {
    const response = await apiClient.get(`${store.api}/tenders`, {
      params,
      headers: { Authorization: `Bearer ${store.token}` },
    });

    if (response.data.data.length === 0) {
      tenderMessage.value = "Nessun dato sui bandi ancora disponibile.";
      tenders.value = [];
    } else {
      tenders.value = response.data.data.map((tender) => ({
        key: tender.id,
        data: {
          id: tender.id,
          name: tender.name,
          end_date: tender.end_date ? new Date(tender.end_date) : null,
        },
      }));
      totalRecordsTenders.value = response.data.meta.total;
    }
  } catch (error) {
    if (error.response && error.response.status === 404) {
      tenderMessage.value = "Nessun dato sui bandi ancora disponibile.";
    } else {
      console.error("Error fetching tenders:", error);
    }
  }
  loadingTenders.value = false;
};

onMounted(() => {
  fetchClients();
  loadingAllocations.value = true;
  loadingTenders.value = true;
  fetchAllocations();
  fetchTenders();
  chartData.value = setChartData();
  chartOptions.value = setChartOptions();
  chartData2.value = setChartData2();
  chartOptions2.value = setChartOptions2();
});

const showClientDetailsModal = ref(false);
const currentClientData = ref({});

const getClientData = async (id) => {
  try {
    loadingAllocations.value = true;
    const response = await apiClient.get(`${store.api}/clients/${id}`, {
      headers: { Authorization: `Bearer ${store.token}` },
    });
    if (response.data.data.length === 0) {
      currentClientData.value = {};
    } else {
      currentClientData.value = response.data.data;
      showClientDetailsModal.value = true;
    }
  } catch (error) {
    console.error("Error fetching client:", error.message);
    toast.add({
      severity: "error",
      summary: "Errore",
      detail: "Impossibile caricare i dettagli del cliente",
      life: 3000,
    });
  } finally {
    loadingAllocations.value = false;
  }
};

const clientDetailsModalStyle = computed(() => {
  return {
    width: window.innerWidth < 990 ? "90vw" : "60vw",
  };
});
</script>

<style scoped>
.dashboard-cards-container {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 1rem;
  justify-content: space-between;
  width: 100%;
}

.dashboard-card {
  flex: 1 1 48%;
  max-width: 48%;
  min-width: 300px;
}

@media (max-width: 990px) {
  .dashboard-cards-container {
    flex-direction: column;
  }

  .dashboard-card {
    flex: 1 1 100%;
    max-width: 100%;
    min-width: 100%;
    width: 100%;
  }
}

::v-deep(.p-card-body) {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding-bottom: 0px;
}

::v-deep(.p-card-content) {
  height: 100%;
}

::v-deep(.p-treetable-header) {
  padding-top: 0px;
}
</style>
