<template>
  <div class="flex flex-col md:flex-row justify-between gap-4">
    <div class="card grid grid-cols-1 md:grid-cols-2 gap-x-4 pt-2">
      <template v-for="(field, index) in clientFormFields" :key="field.key">
        <div
          v-if="field.type === 'separator' && hasSectionData(index)"
          :class="field.class"
        >
          <div>{{ field.text }}</div>
        </div>

        <div
          v-else-if="field.type === 'text' && clientData[field.key]"
          :class="field.class"
          class="pb-4 pl-4 two-cols"
        >
          <div class="flex items-center gap-2">
            <i :class="field?.icon || 'pi pi-info'"></i>
            <strong>{{ field.label }}:</strong>
          </div>
          <li class="ml-6">
            {{ clientData[field.key] }}
          </li>
        </div>

        <div
          v-else-if="field.key === 'ateco' && clientData.ateco"
          class="pb-4 pl-4 col-span-2"
        >
          <div class="flex items-center gap-2">
            <i :class="field?.icon || 'pi pi-info'"></i>
            <strong>{{ field.label }}:</strong>
          </div>
          <li class="ml-6">
            {{ clientData.ateco.label }}
          </li>
        </div>

        <div
          v-else-if="
            field.key === 'ateco_primary' &&
            clientData.ateco_primary &&
            !field.hidden
          "
          class="pb-4 pl-4 col-span-2"
        >
          <div class="flex items-center gap-2">
            <i :class="field?.icon || 'pi pi-info'"></i>
            <strong>{{ field.label }}:</strong>
          </div>
          <li class="ml-6">
            {{ clientData.ateco_primary.label }}
          </li>
        </div>

        <div
          v-else-if="
            field.key === 'ateco_secondary' &&
            clientData.ateco_secondary &&
            !field.hidden
          "
          class="pb-4 pl-4 col-span-2"
        >
          <div class="flex items-center gap-2">
            <i :class="field?.icon || 'pi pi-info'"></i>
            <strong>{{ field.label }}:</strong>
          </div>
          <li class="ml-6">
            {{ clientData.ateco_secondary.label }}
          </li>
        </div>

        <!-- All other option fields (except ATECO) -->
        <div
          v-else-if="
            field.type === 'option' &&
            clientData[field.key] &&
            !['ateco', 'ateco_primary', 'ateco_secondary'].includes(field.key)
          "
          class="pb-4 pl-4 two-cols"
        >
          <div class="flex items-center gap-2">
            <i :class="field?.icon || 'pi pi-info'"></i>
            <strong>{{ field.label }}:</strong>
          </div>
          <li class="ml-6">
            {{ clientData[field.key].label }}
          </li>
        </div>

        <div
          v-else-if="field.type === 'array' && clientData[field.key]?.length"
          class="pb-4 pl-4 two-cols"
        >
          <div class="flex items-center gap-2">
            <i :class="field?.icon || 'pi pi-info'"></i>
            <strong>{{ field.label }}:</strong>
          </div>
          <div v-for="(item, index) in clientData[field.key]" :key="index">
            <li class="ml-6">
              {{ item.label ? item.label : item }}
            </li>
          </div>
        </div>

        <div
          v-else-if="field.type === 'ibans' && clientData[field.key]?.length"
          class="pb-4 col-span-2"
        >
          <Panel header="IBAN" toggleable>
            <div
              v-for="(item, index) in clientData[field.key]"
              :key="index"
              class="grid grid-cols-2 pl-4"
            >
              <div class="text-surface-500 text-lg col-span-2 pb-4 -ml-3">
                IBAN {{ index + 1 }}
              </div>
              <div class="flex items-center gap-2">
                <i class="pi pi-home"></i>
                <strong>Istituto di credito:</strong>
              </div>
              <div class="flex items-center gap-2">
                <i class="pi pi-building"></i>
                <strong>⁠Filiale di:</strong>
              </div>
              <li class="ml-6 pb-4">{{ item.bank_name }}</li>
              <li class="ml-6 pb-4">{{ item.branch }}</li>
              <div class="flex items-center gap-2">
                <i class="pi pi-credit-card"></i>
                <strong>IBAN:</strong>
              </div>
              <div class="flex items-center gap-2">
                <i class="pi pi-money-bill"></i>
                <strong>Importo:</strong>
              </div>
              <li class="ml-6 pb-4">{{ item.iban }}</li>
              <li class="ml-6 pb-4">{{ item.import }}</li>
            </div>
          </Panel>
        </div>

        <div
          v-else-if="
            field.type === 'annual_billings' && clientData[field.key]?.length
          "
          class="pb-4 col-span-2"
        >
          <Panel header="Fatturazione Annuale" toggleable>
            <div
              v-for="(item, index) in clientData[field.key]"
              :key="index"
              class="grid grid-cols-2 md:grid-cols-4 gap-4 border p-3 rounded-lg mb-2 bg-surface-50"
            >
              <div>
                <strong>Anno:</strong>
                <div>{{ item.year }}</div>
              </div>

              <div>
                <strong>Fatturato:</strong>
                <div>€{{ formatNumber(item.revenue) }}K</div>
              </div>

              <div>
                <strong>Dipendenti:</strong>
                <div>{{ item.employee_count }}</div>
              </div>

              <div>
                <strong>Attivo:</strong>
                <div>€{{ formatNumber(item.assets) }}K</div>
              </div>
            </div>
          </Panel>
        </div>

        <div
          v-else-if="
            field.type === 'client_contacts' && clientData[field.key]?.length
          "
          class="pb-4 col-span-2"
        >
          <Panel header="Referente aziendale" toggleable>
            <div
              v-for="(item, index) in clientData[field.key]"
              :key="index"
              class="grid grid-cols-2 pl-4"
            >
              <div class="text-surface-500 text-lg col-span-2 pb-4 -ml-3">
                Referente {{ index + 1 }}
              </div>
              <div class="flex items-center gap-2">
                <i class="pi pi-key"></i>
                <strong>Nome:</strong>
              </div>
              <div class="flex items-center gap-2">
                <i class="pi pi-tag"></i>
                <strong>Cognome:</strong>
              </div>
              <li class="ml-6 pb-4">{{ item.name }}</li>
              <li class="ml-6 pb-4">
                {{ item.surname }}
              </li>
              <div class="flex items-center gap-2">
                <i class="pi pi-id-card"></i>
                <strong>Telefono:</strong>
              </div>
              <div class="flex items-center gap-2">
                <i class="pi pi-at"></i>
                <strong>Email:</strong>
              </div>
              <div class="flex flex-col gap-2 pb-4">
                <li
                  v-for="(item, index) in item.phones"
                  :key="index"
                  class="ml-6"
                >
                  {{ item }}
                </li>
              </div>
              <div class="flex flex-col gap-2 pb-4">
                <li
                  v-for="(item, index) in item.emails"
                  :key="index"
                  class="ml-6"
                >
                  {{ item }}
                </li>
              </div>
              <div class="flex items-center gap-2 col-span-2">
                <i class="pi pi-id-card"></i>
                <strong>Ruolo:</strong>
              </div>
              <div class="flex flex-col gap-2 pb-4 col-span-2">
                <li
                  v-for="(item, index) in item.roles"
                  :key="index"
                  class="ml-6"
                >
                  {{ item }}
                </li>
              </div>
            </div>
          </Panel>
        </div>

        <div
          v-else-if="
            field.type === 'related_clients' && clientData[field.key]?.length
          "
          class="pb-4 col-span-2"
        >
          <Panel header="Le imprese" toggleable>
            <div
              v-for="(item, index) in clientData[field.key]"
              :key="index"
              class="grid grid-cols-1 md:grid-cols-2 gap-4 pl-4"
            >
              <!-- Title -->
              <div
                class="text-surface-500 text-lg col-span-1 md:col-span-2 pb-4 -ml-3"
              >
                Impresa {{ index + 1 }}
              </div>

              <!-- Codice fiscale -->
              <div>
                <div class="flex items-center gap-2 mb-1">
                  <i class="pi pi-key"></i>
                  <strong>Codice fiscale:</strong>
                </div>
                <div class="ml-6">{{ item.fiscal_code }}</div>
              </div>

              <!-- Partita IVA -->
              <div>
                <div class="flex items-center gap-2 mb-1">
                  <i class="pi pi-tag"></i>
                  <strong>Partita IVA:</strong>
                </div>
                <div class="ml-6">{{ item.vat_number || "-" }}</div>
              </div>

              <!-- Nome legale -->
              <div>
                <div class="flex items-center gap-2 mb-1">
                  <i class="pi pi-id-card"></i>
                  <strong>Nome legale:</strong>
                </div>
                <div class="ml-6">{{ item.legal_name }}</div>
              </div>

              <!-- Percentuale -->
              <div>
                <div class="flex items-center gap-2 mb-1">
                  <i class="pi pi-percentage"></i>
                  <strong>Percentuale:</strong>
                </div>
                <div class="ml-6">
                  {{
                    item.percentage ? formatNumber(item.percentage) + "%" : "-"
                  }}
                </div>
              </div>

              <!-- Annual billings -->
              <div class="flex items-center gap-2 col-span-1 md:col-span-2">
                <i class="pi pi-money-bill"></i>
                <strong>Fatturati annuali:</strong>
              </div>
              <div
                v-if="item.annual_billings && item.annual_billings.length"
                class="col-span-1 md:col-span-2"
              >
                <div
                  v-for="(billing, i) in item.annual_billings"
                  :key="i"
                  class="grid grid-cols-2 md:grid-cols-4 gap-4 border p-3 rounded-lg mb-2 bg-surface-50"
                >
                  <div>
                    <strong>Anno:</strong>
                    <div>{{ billing.year }}</div>
                  </div>
                  <div>
                    <strong>Fatturato:</strong>
                    <div>€{{ formatNumber(billing.revenue) }}K</div>
                  </div>
                  <div>
                    <strong>Dipendenti:</strong>
                    <div>{{ billing.employee_count }}</div>
                  </div>
                  <div>
                    <strong>Attivo:</strong>
                    <div>€{{ formatNumber(billing.assets) }}K</div>
                  </div>
                </div>
              </div>
              <div
                v-else
                class="ml-4 text-surface-400 text-sm italic mt-2 col-span-1 md:col-span-2"
              >
                Nessun dato di fatturato disponibile
              </div>
            </div>
          </Panel>
        </div>

        <div
          v-else-if="field.type === 'upload'"
          class="flex flex-col col-span-2"
        >
          <div v-if="clientData.files.length">
            <div class="flex items-center gap-2 pl-4 mb-4">
              <i class="pi pi-file"></i>
              <strong>⁠File:</strong>
            </div>
            <div
              class="flex justify-between mb-4 ml-6"
              v-for="file in clientData.files"
              :key="file.id"
            >
              <div>
                <img
                  v-if="isImage(file?.link)"
                  :src="file?.link"
                  alt="Preview"
                  class="w-16 h-16 object-cover"
                />
                <div v-else class="flex items-center gap-1 ml-6">
                  <li class="file-name !max-w-[30rem]">{{ file?.name }}</li>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          v-else-if="field.type === 'parameters' && canDownloadClient"
          class="col-span-2"
        >
          <Button
            label="Scarica"
            icon="pi pi-download"
            @click="downloadFile"
            :disabled="downloading"
            outlined
            class="w-full"
          />
        </div>
      </template>
    </div>
    <div class="w-full md:w-4/12" v-if="canViewNoteClient">
      <Notes
        :showEdit="canManageNoteClient"
        :entity="clientData"
        :entity_type="'Client'"
        :entity_download="'clients'"
        @reloadEntity="fetchClient(clientData.id)"
        class="h-fit"
      />
    </div>
  </div>
</template>



<script setup>
import { onMounted, ref, watch, computed } from "vue";
import apiClient from "@/router/apiClient";
import { useStore } from "@/store";
import { useToast } from "primevue/usetoast";
import Button from "primevue/button";
import { Loader } from "@googlemaps/js-api-loader";
import Panel from "primevue/panel";
import Notes from "@/components/Notes.vue";
import { usePermissions } from "@/composables/usePermissions";

const props = defineProps({
  mode: {
    type: String,
    default: "create",
  },
  existingClientData: {
    type: Object,
    default: () => ({}),
  },
});

const toast = useToast();
const store = useStore();
const token = store.token;

const clientFormFields = ref([]);

const atecoList = ref([]);
const atecoPrimaryList = ref([]);
const atecoSecondaryList = ref([]);

const { can } = usePermissions();

const canDownloadClient = computed(() => can("clients.view"));
const canViewNoteClient = computed(() => can("notes.view"));
const canManageNoteClient = computed(() => can("notes.manage"));

const clientData = ref({
  ...props.existingClientData,
  emails: props.existingClientData.emails || [],
  phones: props.existingClientData.phones || [],
  websites: props.existingClientData.websites || [],
  ibans: props.existingClientData.ibans || [],
  client_contacts: (props.existingClientData?.contacts || []).map(
    (contact) => ({
      id: contact.id,
      name: contact.name || "",
      surname: contact.surname || "",
      phones: contact.phones || [""],
      emails: contact.emails || [""],
      roles: contact.roles || [""],
    })
  ),
  files: props.existingClientData.files || [],
  notes: props.existingClientData.notes || [],
  ateco: null,
  ateco_primary: null,
  ateco_secondary: null,
});

const isImage = (url) => {
  return /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(url);
};

// Funzione per formattare i numeri con punto per le migliaia e virgola per i decimali
const formatNumber = (value) => {
  if (value === null || value === undefined || isNaN(Number(value)))
    return value;

  return Number(value).toLocaleString("it-IT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

clientFormFields.value = [
  {
    key: "section1",
    type: "separator",
    text: "Sezione 1: Informazioni Primarie",
    class: "col-span-2 mb-2 text-lg font-bold text-surface-700",
  },
  {
    key: "fiscal_code",
    label: "Codice fiscale",
    type: "text",
    icon: "pi pi-id-card",
    class: "fiscal-code-field",
  },
  {
    key: "vat_number",
    label: "Partita IVA",
    type: "text",
    icon: "pi pi-copy",
    class: "vat-number-field",
  },
  {
    key: "section2",
    type: "separator",
    text: "Sezione 2: Informazioni Personali",
    class: "col-span-2 mb-2 text-lg font-bold text-surface-700",
  },
  {
    key: "legal_name",
    label: "Denominazione sociale",
    type: "text",
    class: "col-span-2",
    icon: "pi pi-info-circle",
  },
  {
    key: "sector",
    label: "Settore",
    type: "text",
    options: store.defaults.sectors,
    icon: "pi pi-chart-pie",
  },
  {
    key: "company_type",
    label: "Tipo di azienda",
    type: "text",
    options: store.defaults.company_types,
    icon: "pi pi-building",
  },
  {
    key: "company_type_other",
    label: "Altro tipo di azienda",
    type: "text",
    icon: "pi pi-building",
    class: "hidden",
  },
  {
    key: "type",
    label: "Tipo di cliente",
    type: "text",
    options: store.defaults.client_types,
    icon: "pi pi-briefcase",
  },
  {
    key: "type_other",
    label: "Altro tipo di cliente",
    type: "text",
    icon: "pi pi-briefcase",
    class: "hidden",
  },
  {
    key: "company_size",
    label: "Dimensione aziendale",
    type: "text",
    options: store.defaults.size_categories,
    icon: "pi pi-chart-bar",
    class: "col-span-2",
  },
  {
    key: "explanation",
    label: "Spiegazione",
    type: "text",
    class: "col-span-2",
    icon: "pi pi-info",
  },
  {
    key: "ateco",
    label: "ATECO",
    type: "option",
    class: "col-span-2",
    icon: "pi pi-hashtag",
  },
  {
    key: "ateco_primary",
    label: "ATECO secondario",
    type: "option",
    placeholder: "Seleziona un ATECO secondario",
    class: "col-span-2",
    hidden: true,
    icon: "pi pi-hashtag",
  },
  {
    key: "ateco_secondary",
    label: "ATECO terziario",
    type: "option",
    placeholder: "Seleziona un ATECO terziario",
    class: "col-span-2",
    hidden: true,
    icon: "pi pi-hashtag",
  },
  {
    key: "section3",
    type: "separator",
    text: "Sezione 3: Informazioni Aggiuntive",
    class: "col-span-2 mb-2 text-lg font-bold text-surface-700",
  },
  {
    key: "legal_address",
    label: "Indirizzo (sede legale)",
    type: "array",
    class: "col-span-2",
    icon: "pi pi-envelope",
  },
  {
    key: "addresses",
    label: "Indirizzo (sede operativa)",
    type: "array",
    class: "col-span-2 addresses",
    icon: "pi pi-envelope",
  },
  {
    key: "emails",
    label: "Email",
    type: "array",
    multiple: true,
    size: 1,
    class: "col-span-2",
    icon: "pi pi-at",
  },
  {
    key: "phones",
    label: "Telefono",
    type: "array",
    class: "col-span-2",
    icon: "pi pi-phone",
  },
  {
    key: "websites",
    label: "Sito Web",
    type: "array",
    class: "col-span-2",
    icon: "pi pi-globe",
  },
  {
    key: "ibans",
    label: "Iban",
    type: "ibans",
    size: 1,
    class: "col-span-2",
  },
  {
    key: "section4",
    type: "separator",
    text: "Sezione 4: Fatturazione Annuale",
    class: "col-span-2 mb-2 text-lg font-bold text-surface-700",
  },
  {
    key: "annual_billings",
    label: "Fatturazione Annuale",
    type: "annual_billings",
    form: [
      {
        key: "year",
        hidden: true,
      },
      {
        key: "revenue",
        label: "Fatturato",
        type: "text",
        class: "basis-1/3",
        icon: "pi pi-receipt",
      },
      {
        key: "employee_count",
        label: "Numero Dipendenti",
        type: "text",
        class: "basis-1/3",
        icon: "pi pi-user",
      },
      {
        key: "assets",
        label: "Attivo",
        type: "text",
        class: "basis-1/3",
        icon: "pi pi-euro",
      },
    ],
    class: "col-span-2",
  },
  {
    key: "section5",
    type: "separator",
    text: "Sezione 5: Referente aziendale",
    class: "col-span-2 mb-2 text-lg font-bold text-surface-700",
  },
  {
    key: "client_contacts",
    type: "client_contacts",
    class: "col-span-2",
  },
  {
    key: "section6",
    type: "separator",
    text: "Sezione 6: Le imprese",
    class: "col-span-2 mb-2 text-lg font-bold text-surface-700",
  },
  {
    key: "related_clients",
    label: "Aggiungi impresa",
    type: "related_clients",
    class: "col-span-2",
    severity: "success",
    icon: "pi pi-plus",
    action: () => addRelatedClient(),
  },
  {
    key: "section7",
    type: "separator",
    text: "Sezione 7: La visura",
    class: "col-span-2 mb-2 text-lg font-bold text-surface-700",
  },
  {
    key: "file",
    type: "upload",
    severity: "success",
    class: "col-span-2",
  },
  {
    key: "section8",
    type: "separator",
    text: "Sezione 8: Parametri dimensionali",
    class: "col-span-2  mb-2 text-lg font-bold text-surface-700",
  },
  {
    key: "btn",
    type: "parameters",
  },
];

watch(
  () => clientData.value.ateco,
  async (newCode) => {
    if (newCode.value || clientData.value.ateco.value !== newCode.value) {
      try {
        const response = await apiClient.get(
          `${store.api}/ateco/${newCode.value}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        atecoPrimaryList.value = response.data.data.map((item) => ({
          value: item.id,
          label: `${item.id} - ${item.description}`,
        }));

        clientFormFields.value.forEach((field) => {
          if (field.key === "ateco_primary") {
            field.options = atecoPrimaryList.value;
            field.hidden = false;
          }

          if (field.key === "ateco_secondary") {
            field.hidden = true;
          }
        });

        const existingPrimary = atecoPrimaryList.value.find(
          (item) => item.value === clientData.value.ateco_primary_code
        );
        if (existingPrimary) {
          clientData.value.ateco_primary = existingPrimary;
        } else {
          clientData.value.ateco_primary = "";
        }

        clientData.value.ateco_secondary = "";
      } catch (error) {
        console.error("Error fetching ATECO primary data:", error);
      }
    }
  }
);

const fetchPlaceDetails = async (placeId) => {
  try {
    const loader = new Loader({
      apiKey: import.meta.env.VITE_APP_GOOGLE_MAPS_API_KEY,
      libraries: ["places", "marker"],
      language: "it",
      region: "IT",
    });

    const Places = await loader.importLibrary("places");
    const service = new Places.PlacesService(document.createElement("div"));

    return new Promise((resolve, reject) => {
      service.getDetails({ placeId }, (result, status) => {
        if (status === Places.PlacesServiceStatus.OK) {
          resolve({
            label: result.formatted_address,
            value: placeId,
          });
        } else {
          reject("Failed to fetch address");
        }
      });
    });
  } catch (error) {
    console.error("Error fetching place details:", error);
    return null;
  }
};

onMounted(async () => {
  fetchAtecoPrimary();

  try {
    if (
      Array.isArray(clientData.value.legal_address) &&
      clientData.value.legal_address[0]
    ) {
      const placeDetails = await Promise.all(
        clientData.value.legal_address.map(async (placeId) => {
          if (placeId) {
            return await fetchPlaceDetails(placeId);
          }
          return { label: "", value: "" };
        })
      );
      if (placeDetails) {
        clientData.value.legal_address = placeDetails.filter(
          (address) => address !== null
        );
      }
    }

    if (
      !Array.isArray(clientData.value.addresses) ||
      clientData.value.addresses.length === 0
    ) {
      clientData.value.addresses = [];
    } else {
      const fullAddresses = clientData.value.addresses.map((addr) => {
        if (addr && addr.formatted_address) {
          return {
            label: addr.formatted_address,
            value: addr.google_place_id,
          };
        }
        return { label: "", value: "" };
      });

      clientData.value.addresses = fullAddresses;
    }
  } catch (error) {
    console.error("Error processing addresses:", error);
  }
});

const fetchAtecoPrimary = async () => {
  try {
    const response = await apiClient.get(`${store.api}/ateco`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    atecoList.value = response.data.data.map((item) => ({
      value: item.code,
      label: `${item.code} - (${item.primary_codes}) - ${item.description}`,
    }));

    clientFormFields.value.forEach((field) => {
      if (field.key === "ateco") {
        field.options = atecoList.value;
      }
    });

    const existingAteco = atecoList.value.find(
      (item) => item.value === clientData.value.ateco_code
    );
    if (existingAteco) {
      clientData.value.ateco = existingAteco;
    }
  } catch (error) {
    console.error("Error fetching ATECO data:", error);
  }
};

watch(
  () => clientData.value.ateco_primary,
  async (newId) => {
    if (newId && newId.value) {
      try {
        const response = await apiClient.get(
          `${store.api}/ateco/${clientData.value.ateco.value}/${newId.value}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        atecoSecondaryList.value = response.data.data.map((item) => ({
          value: item.code,
          label: `${item.code} - ${item.description}`,
        }));

        clientFormFields.value.forEach((field) => {
          if (field.key === "ateco_secondary") {
            field.options = atecoSecondaryList.value;
            field.hidden = false;
          }
        });

        const existingSecondary = atecoSecondaryList.value.find(
          (item) => item.value === clientData.value.ateco_secondary_code
        );
        if (existingSecondary) {
          clientData.value.ateco_secondary = existingSecondary;
        } else {
          clientData.value.ateco_secondary = "";
        }
      } catch (error) {
        console.error("Error fetching ATECO secondary data:", error);
      }
    }
  }
);

const downloading = ref(false);
let lastToastProgress = -1;

const downloadFile = async () => {
  try {
    downloading.value = true;
    lastToastProgress = -1;

    const clientId = clientData.value.id;

    // 1) Start generation (POST)
    const jobId = await store.startClientDownload(clientId);

    toast.add({
      severity: "info",
      summary: "Generazione avviata",
      detail: "Sto preparando il documento… (0%)",
      life: 2500,
    });

    // Listen progress (SSE) and show toasts (throttled)
    const unsub = store.on("docgen", (p) => {
      if (p.jobId !== String(jobId)) return;

      const prog = Number(p.progress ?? 0);

      // throttle to avoid spamming (every 10%)
      if (prog >= lastToastProgress + 10 && p.status !== "ready") {
        lastToastProgress = prog;
        toast.add({
          severity: "info",
          summary: "Download",
          detail: `Generazione in corso… (${prog}%)`,
          life: 1500,
        });
      }

      if (p.status === "failed") {
        toast.add({
          severity: "error",
          summary: "Errore",
          detail: p.error || "Generazione fallita",
          life: 4000,
        });
      }

      if (p.status === "ready") {
        toast.add({
          severity: "success",
          summary: "Pronto",
          detail: "Documento pronto. Avvio download…",
          life: 2000,
        });
      }
    });

    // 2) Wait ready (SSE + polling fallback)
    await store.waitForDownloadReady(jobId, {
      timeoutMs: 180000,
      pollEveryMs: 2000,
    });

    unsub?.();

    // 3) Download the file (GET /downloads/{id}/file)
    await store.downloadGeneratedFile(jobId);
  } catch (error) {
    console.error("Download flow error:", error);
    toast.add({
      severity: "error",
      summary: "Errore",
      detail: error?.message || "Impossibile scaricare il file. Riprova.",
      life: 4000,
    });
  } finally {
    downloading.value = false;
  }
};

const hasSectionData = (separatorIndex) => {
  const nextSeparatorIndex = clientFormFields.value.findIndex(
    (field, idx) => idx > separatorIndex && field.type === "separator"
  );

  const endIndex =
    nextSeparatorIndex === -1
      ? clientFormFields.value.length
      : nextSeparatorIndex;

  const sectionFields = clientFormFields.value.slice(
    separatorIndex + 1,
    endIndex
  );

  return sectionFields.some((field) => {
    if (["separator", "parameters", "upload"].includes(field.type)) {
      return field.type === "upload"
        ? clientData.value.files && clientData.value.files.length > 0
        : false;
    }

    if (
      field.type === "array" ||
      field.type === "ibans" ||
      field.type === "annual_billings" ||
      field.type === "client_contacts" ||
      field.type === "related_clients"
    ) {
      return (
        Array.isArray(clientData.value[field.key]) &&
        clientData.value[field.key].length > 0
      );
    }

    if (field.type === "option") {
      return clientData.value[field.key] && !field.hidden;
    }

    return !!clientData.value[field.key];
  });
};

const fetchClient = async (id) => {
  try {
    const response = await apiClient.get(`${store.api}/clients/${id}`, {
      headers: { Authorization: `Bearer ${store.token}` },
    });
    const client = response.data.data || {};
    clientData.value.notes = client.notes ?? [];
  } catch (error) {
    console.error("Error fetching client:", error.message);
    toast.add({
      severity: "error",
      summary: "Errore",
      detail: "Impossibile caricare i dettagli del cliente",
      life: 3000,
    });
  }
};
</script>

<style scoped>
@media (max-width: 500px) {
  .fiscal-code-field,
  .vat-number-field,
  .two-cols {
    grid-column: span 2;
  }
}
</style>
