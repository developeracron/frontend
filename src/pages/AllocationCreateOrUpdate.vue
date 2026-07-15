<template>
  <Dialog
    header="Aggiungi o Modifica Pratica"
    v-model:visible="props.showDialog"
    :modal="true"
    :closable="false"
    :style="{ width: '75rem' }"
  >
    <div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div :class="isEditing ? 'md:col-span-2' : 'md:col-span-3'">
          <div class="grid grid-cols-2 gap-3 mt-1">
            <div
              v-for="field in allocationFormFields"
              :key="field.key"
              :class="field.class"
            >
              <Editor
                v-if="field.type === 'editor'"
                :id="field.key"
                v-model="newAllocation[field.key]"
                :placeholder="field.label"
                class="w-full"
                :class="{ 'p-invalid': v$[field.key]?.$error }"
              />
              <FloatLabel v-else variant="on">
                <InputText
                  v-if="field.type === 'text'"
                  :id="field.key"
                  v-model="newAllocation[field.key]"
                  class="w-full"
                  :class="{ 'p-invalid': v$[field.key]?.$error }"
                />
                <Select
                  v-if="field.type === 'select'"
                  :id="field.key"
                  v-model="newAllocation[field.key]"
                  :options="field.options"
                  optionLabel="label"
                  optionValue="value"
                  filter
                  showClear
                  class="w-full"
                  panelClass="select-allocation"
                  :class="{ 'p-invalid': v$[field.key]?.$error }"
                />
                <DatePicker
                  v-if="field.type === 'date'"
                  :id="field.key"
                  v-model="newAllocation[field.key]"
                  dateFormat="dd.mm.yy"
                  class="w-full"
                  :class="{
                    'p-invalid': v$[field.key]?.$error,
                    'p-warning': allocationWarnings?.some(
                      (w) => w.field === field.key
                    ),
                  }"
                />
                <label v-if="field.type !== 'button'" :for="field.key">{{
                  field.label
                }}</label>
              </FloatLabel>
              <small
                v-for="(warning, index) in allocationWarnings.filter(
                  (w) => w.field === field.key
                )"
                :key="index"
                class="p-warning"
                style="display: block"
              >
                {{ warning.message }}
              </small>
              <small
                v-if="v$[field.key]?.$error"
                class="p-invalid"
                style="display: block"
                >{{ field.error_msg }}</small
              >

              <div v-if="field.key === 'participants'" class="pt-4">
                <div
                  v-for="(participant, relatedIndex) in participants"
                  :key="relatedIndex"
                  class="pt-4 pb-8 px-4 mb-6 border rounded-xl bg-surface-100"
                >
                  <div class="flex justify-between items-center pb-2">
                    <div class="text-surface-500 text-lg">
                      Partecipante {{ relatedIndex + 1 }}
                    </div>
                    <Button
                      icon="pi pi-times"
                      :disabled="
                        isEditing &&
                        participant.id &&
                        !canManageParticipant(participant)
                      "
                      @click="
                        isEditing && participant.id
                          ? confirmDeleteParticipant(
                              newAllocation['id'],
                              participant
                            )
                          : removeParticipant(relatedIndex)
                      "
                      severity="danger"
                      outlined
                    />
                  </div>

                  <!-- Participant form -->
                  <div
                    class="flex flex-col gap-4 mt-1"
                    :class="{
                      'pointer-events-none opacity-60':
                        isEditing &&
                        participant.id &&
                        !canManageParticipant(participant),
                    }"
                  >
                    <!-- Radio buttons -->
                    <div class="flex flex-col gap-2">
                      <div class="flex items-center gap-2">
                        <RadioButton
                          v-model="participant.type"
                          :inputId="'registered_' + relatedIndex"
                          value="registered"
                        />
                        <label :for="'registered_' + relatedIndex"
                          >Utente registrato</label
                        >
                      </div>
                      <div class="flex items-center gap-2">
                        <RadioButton
                          v-model="participant.type"
                          :inputId="'external_' + relatedIndex"
                          value="external"
                        />
                        <label :for="'external_' + relatedIndex"
                          >Utente esterno</label
                        >
                      </div>
                    </div>

                    <!-- Role -->
                    <div>
                      <FloatLabel variant="on" class="w-full">
                        <Select
                          v-model="participant.role"
                          :inputId="'select_role_' + relatedIndex"
                          :options="allocationRoles"
                          class="w-full"
                          :class="{
                            'p-invalid': participantErrors[relatedIndex]?.role,
                          }"
                        />
                        <label :for="'select_role_' + relatedIndex"
                          >Ruolo</label
                        >
                      </FloatLabel>
                      <small
                        v-if="participantErrors[relatedIndex]?.role"
                        class="p-invalid"
                      >
                        {{ participantErrors[relatedIndex].role }}
                      </small>
                    </div>

                    <!-- Registered User -->
                    <div v-if="participant.type === 'registered'">
                      <FloatLabel variant="on" class="w-full">
                        <Select
                          v-model="participant.user_id"
                          :options="userOptions"
                          optionLabel="label"
                          optionValue="value"
                          showClear
                          class="w-full"
                          :class="{
                            'p-invalid': participantErrors[relatedIndex]?.user,
                          }"
                        />
                        <label>Utente</label>
                      </FloatLabel>
                      <small
                        v-if="participantErrors[relatedIndex]?.user"
                        class="p-invalid"
                      >
                        {{ participantErrors[relatedIndex].user }}
                      </small>
                    </div>

                    <!-- External User -->
                    <div
                      v-if="participant.type === 'external'"
                      class="flex flex-col gap-4"
                    >
                      <div>
                        <FloatLabel variant="on" class="w-full">
                          <InputText
                            v-model="participant.external_name"
                            class="w-full"
                            :class="{
                              'p-invalid':
                                participantErrors[relatedIndex]?.external_name,
                            }"
                          />
                          <label>Nome utente esterno</label>
                        </FloatLabel>
                        <small
                          v-if="participantErrors[relatedIndex]?.external_name"
                          class="p-invalid"
                        >
                          {{ participantErrors[relatedIndex].external_name }}
                        </small>
                      </div>

                      <div>
                        <FloatLabel variant="on" class="w-full">
                          <InputText
                            v-model="participant.external_email"
                            type="email"
                            class="w-full"
                            :class="{
                              'p-invalid':
                                participantErrors[relatedIndex]?.external_email,
                            }"
                          />
                          <label>Email utente esterno</label>
                        </FloatLabel>
                        <small
                          v-if="participantErrors[relatedIndex]?.external_email"
                          class="p-invalid"
                        >
                          {{ participantErrors[relatedIndex].external_email }}
                        </small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div v-if="field.type === 'button'" class="flex">
                <Button
                  :label="field.label"
                  :icon="field.icon"
                  @click="field.action"
                  class="mt-2"
                  outlined
                  :severity="field?.severity"
                />
              </div>
            </div>
          </div>
          <div
            v-if="showWorkflowRefreshSwitch"
            class="p-3 mt-4 border border-yellow-300 rounded-md bg-yellow-50"
          >
            <div class="flex items-center gap-2 mb-2">
              <span class="text-sm font-medium text-surface-700">
                Regole di sincronizzazione
              </span>
              <i
                class="pi pi-info-circle text-surface-500 cursor-help"
                v-tooltip.top="{
                  value:
                    'Aggiorna solo questa pratica alla versione workflow più recente. Le modifiche locali restano se compatibili, i dati non compatibili possono essere rimossi.',
                  showDelay: 120,
                }"
              ></i>
            </div>
            <div class="flex items-start gap-2">
              <i class="pi pi-exclamation-triangle text-yellow-600 mt-1"></i>
              <span class="text-yellow-800 text-sm leading-6">
                Se aggiorni alla versione più recente del workflow, tutte le fasi
                e i segmenti della pratica verranno riallineati. Alcuni dati già
                compilati possono andare persi.
              </span>
            </div>

            <div class="flex items-center gap-2 mt-3">
              <InputSwitch
                v-model="update_workflow"
                inputId="update_workflow"
                class="warning-checkbox"
              />
              <label for="update_workflow" class="text-sm text-surface-700">
                Usa la versione più recente
              </label>
            </div>
          </div>
        </div>
        <div v-if="isEditing && canNotesView" class="mt-1">
          <Notes
            :showEdit="canNotesManage"
            :entity="newAllocation"
            :entity_type="'Allocation'"
            :entity_download="'allocations'"
            @reloadEntity="onReloadEntity"
          />
        </div>
      </div>
      <div class="flex justify-end mt-4 gap-2">
        <Button
          label="Annulla"
          severity="danger"
          icon="pi pi-times"
          text
          @click="cancelAllocation"
        />
        <Button
          label="Salva"
          icon="pi pi-check"
          class="p-button-primary"
          @click="submitAllocation"
        />
      </div>
      <div
        v-if="props.saving"
        class="absolute inset-0 flex items-center justify-center bg-white/50 z-10 rounded-md"
      >
        <ProgressSpinner style="width: 50px; height: 50px" strokeWidth="4" />
      </div>
    </div>
  </Dialog>
</template>

<script setup>
import { ref, computed, watch, onMounted, toRaw } from "vue";
import { useVuelidate } from "@vuelidate/core";
import { required, maxLength, helpers } from "@vuelidate/validators";
import Dialog from "primevue/dialog";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import Select from "primevue/select";
import DatePicker from "primevue/datepicker";
import FloatLabel from "primevue/floatlabel";
import Editor from "primevue/editor";
import { useToast } from "primevue/usetoast";
import apiService from "@/services/apiService";
import { useStore } from "@/store";
import InputGroup from "primevue/inputgroup";
import Notes from "@/components/Notes.vue";
import { useConfirm } from "primevue/useconfirm";
import ProgressSpinner from "primevue/progressspinner";
import RadioButton from "primevue/radiobutton";
import InputSwitch from "primevue/inputswitch";
import apiClient from "@/router/apiClient";
import { usePermissions } from "@/composables/usePermissions";

const props = defineProps({
  isEditing: Boolean,
  newAllocation: Object,
  showDialog: Boolean,
  saving: Boolean,
});

const confirm = useConfirm();

const isEditingReactive = computed(() => props.isEditing);

const emit = defineEmits(["save", "cancel", "reload-allocation"]);

function onReloadEntity() {
  emit("reload-allocation", props.newAllocation.id);
}

const toast = useToast();

const store = useStore();
const { can } = usePermissions();
const canNotesView = computed(() => can("notes.view"));
const canNotesManage = computed(() => can("notes.manage"));
const canUsersView = computed(() => can("users.view"));
const canAllocationsDelete = computed(() => can("allocations.full"));
const clientOptions = ref([]);
const userOptions = ref([]);
const tenderOptions = ref([]);
const workflowOptions = ref([]);
const allocationRoles = ref(store.defaults.allocation_participant_roles);
const participants = ref([]);
const update_workflow = ref(false);
const participantErrors = ref([]);
const latestWorkflowVersionId = (workflowId) => {
  if (!workflowId) return null;
  const workflow = workflowOptions.value.find(
    (w) => Number(w.value) === Number(workflowId)
  );
  if (!workflow || !workflow.latest_version_id) return null;
  return Number(workflow.latest_version_id);
};

const showWorkflowRefreshSwitch = computed(() => {
  if (!props.isEditing || !props.newAllocation?.workflow_id) return false;

  const current = props.newAllocation?.workflow_version_id
    ? Number(props.newAllocation.workflow_version_id)
    : null;
  const latest = latestWorkflowVersionId(props.newAllocation.workflow_id);

  if (!current || !latest) return false;
  return current !== latest;
});

const canManageParticipant = (participant) =>
  canAllocationsDelete.value || participant?.can_manage === true;

watch(
  () => props.newAllocation?.participants,
  () => {
    participants.value = props.newAllocation.participants.map((p) => ({
      ...p,
      type: p.user_id ? "registered" : "external",
    }));
  },
  { deep: true }
);

const fetchClients = async () => {
  try {
    const params = {
      by: "legal_name",
      desc: 0,
    };
    clientOptions.value = await apiService.getWithAuth("clients", {
      params,
      transform: (data) =>
        data.map((client) => ({
          label: client.legal_name,
          value: client.id,
        })),
    });

  } catch (error) {
    console.error("Error fetching clients:", error.message);
  }
};

const fetchUsers = async () => {
  try {
    userOptions.value = await apiService.getWithAuth("users", {
      transform: (data) =>
        data.map((user) => ({
          label: `${user.name}${
            user.internal_code ? " - " + user.internal_code : ""
          }`,
          value: user.id,
        })),
    });
  } catch (error) {
    console.error("Error fetching users:", error.message);
  }
};

const fetchTenders = async () => {
  try {
    const params = {
      by: "name",
      desc: 0,
    };
    tenderOptions.value = await apiService.getWithAuth("tenders", {
      params,
      transform: (data) =>
        data.map((tender) => ({
          label: tender.name,
          value: tender.id,
          start_date: tender.start_date,
          end_date: tender.end_date,
        })),
    });
  } catch (error) {
    console.error("Error fetching tenders:", error.message);
  }
};

function checkTenderDateConflict(allocation) {
  const tenderOptionsValue = toRaw(tenderOptions.value);
  const formatDate = (d) => new Date(d).toLocaleDateString("sv-SE");

  const warnings = [];

  if (!Array.isArray(tenderOptionsValue)) {
    return {
      warning: true,
      warnings: [
        {
          field: "start_date",
          message: "⚠️ Opzioni bando non valide.",
        },
      ],
    };
  }

  const tender = tenderOptionsValue.find(
    (t) => t.value === allocation.tender_id
  );

  if (tender) {
    const tenderStartDate = new Date(tender.start_date);
    const tenderEndDate = new Date(tender.end_date);
    const allocationStartDate = new Date(allocation.start_date);
    const allocationEndDate = new Date(allocation.end_date);

    if (allocation.start_date && allocationStartDate > tenderEndDate) {
      warnings.push({
        field: "start_date",
        message: `⚠️ La data di inizio (${formatDate(
          allocationStartDate
        )}) è successiva alla fine del bando (${formatDate(tenderEndDate)}).`,
      });
    }

    if (allocation.end_date && allocationEndDate < tenderStartDate) {
      warnings.push({
        field: "end_date",
        message: `⚠️ La data di fine (${formatDate(
          allocationEndDate
        )}) è precedente all'inizio del bando (${formatDate(
          tenderStartDate
        )}).`,
      });
    }
  }

  return {
    warning: warnings.length > 0,
    warnings,
  };
}

const fetchWorkflows = async () => {
  try {
    const params = {
      by: "name",
      desc: 0,
    };
    workflowOptions.value = await apiService.getWithAuth("phases/workflows", {
      params,
      transform: (data) =>
        data.map((workflow) => ({
          label: workflow.name,
          value: workflow.id,
          latest_version_id: workflow.latest_version_id,
        })),
    });
  } catch (error) {
    console.error("Error fetching workflows:", error.message);
  }
};

watch(
  () => props.newAllocation?.tender_id,
  (newVal) => {
    if (newVal) {
      props.newAllocation.workflow_id = "";
    }
  }
);

watch(
  () => props.newAllocation?.workflow_id,
  (newVal) => {
    if (newVal) {
      props.newAllocation.tender_id = "";
    }
  }
);

watch(
  () => props.showDialog,
  (isOpen) => {
    if (!isOpen) {
      update_workflow.value = false;
    }
  }
);

watch(showWorkflowRefreshSwitch, (visible) => {
  if (!visible) {
    update_workflow.value = false;
  }
});

watch(
  () => participants.value,
  (newParticipants) => {
    newParticipants.forEach((participant) => {
      watch(
        () => participant.user_id,
        (newUserId) => {
          if (newUserId) {
            participant.external_name = null;
          }
        }
      );

      watch(
        () => participant.external_name,
        (newExternalName) => {
          if (newExternalName) {
            participant.user_id = null;
          }
        }
      );

      watch(
        () => participant.external_email,
        (newEmail) => {
          if (newEmail && !participant.external_name) {
            participant.user_id = null;
          }
        }
      );
    });
  },
  { deep: true, immediate: true }
);

watch(
  () => [
    props.newAllocation?.tender_id,
    props.newAllocation?.start_date,
    props.newAllocation?.end_date,
  ],
  () => {
    const result = checkTenderDateConflict(props.newAllocation);
    if (result.warning && Array.isArray(result.warnings)) {
      allocationWarnings.value = result.warnings;
    } else {
      allocationWarnings.value = [];
    }
  },
  { deep: true }
);

onMounted(async () => {
  await fetchClients();
  if (canUsersView.value) {
    await fetchUsers();
  }
  await fetchTenders();
  await fetchWorkflows();
});

const allocationFormFields = ref([
  {
    key: "client_id",
    label: "Seleziona Cliente",
    type: "select",
    class: "col-span-2  mt-1",
    options: clientOptions,
    validation: { required },
    error_msg: "Cliente obbligatorio.",
  },
  {
    key: "tender_id",
    label: "Seleziona Bando",
    type: "select",
    options: tenderOptions,
    validation: {
      $validator: () =>
        props.newAllocation.tender_id || props.newAllocation.workflow_id,
      $message: "Devi selezionare un bando o un gruppo delle fasi.",
    },
    error_msg: "Bando o il gruppo delle fasi obbligatorio.",
  },
  {
    key: "workflow_id",
    label: "Seleziona Gruppo delle fasi",
    type: "select",
    options: workflowOptions,
    validation: {
      $validator: () =>
        props.newAllocation.workflow_id || props.newAllocation.tender_id,
      $message: "Devi selezionare un gruppo delle fasi o un bando.",
    },
    error_msg: "Il gruppo delle fasi o bando obbligatorio.",
  },
  {
    key: "id",
    label: "Id Pratica",
    type: "text",
    class: "hidden",
  },
  {
    key: "name",
    label: "Nome",
    type: "text",
    class: "col-span-2",
    validation: { required, maxLength: maxLength(255) },
    error_msg: "Il nome è obbligatorio.",
  },
  {
    key: "description",
    label: "Descrizione",
    type: "editor",
    class: "col-span-2",
    validation: { maxLength: maxLength(1000) },
    error_msg: "Descrizione troppo lunga.",
  },
  {
    key: "start_date",
    label: "Data Inizio",
    type: "date",
    validation: {},
    error_msg: "Data inizio obbligatoria.",
  },
  {
    key: "end_date",
    label: "Data Fine",
    type: "date",
    validation: {
      minValue: helpers.withParams(
        { message: "Data inizio successiva a data fine." },
        (val) =>
          !val || new Date(val) > new Date(props.newAllocation.start_date)
      ),
    },
    error_msg: "Data inizio successiva a data fine.",
  },
  {
    key: "participants",
    label: "Aggiungi partecipanti",
    type: "button",
    class: "col-span-2",
    severity: "success",
    icon: "pi pi-plus",
    action: () => addParticipant(),
  },
]);

const addParticipant = () => {
  participants.value.push({
    role: "",
    user_id: "",
    external_name: "",
    external_email: "",
    type: "registered",
  });
};
const removeParticipant = (index) => {
  confirm.require({
    message: "Sei sicuro di voler rimuovere questo partecipante?",
    header: "Conferma eliminazione",
    icon: "pi pi-exclamation-triangle",
    acceptLabel: "Sì",
    acceptClass: "p-button-danger",
    rejectClass: "p-button-secondary",
    rejectLabel: "Annulla",
    accept: () => {
      participants.value.splice(index, 1);
    },
  });
};

const confirmDeleteParticipant = (allocationId, participant) => {
  confirm.require({
    message: "Sei sicuro di voler rimuovere questo partecipante?",
    header: "Conferma eliminazione",
    icon: "pi pi-exclamation-triangle",
    acceptLabel: "Sì",
    acceptClass: "p-button-danger",
    rejectClass: "p-button-secondary",
    rejectLabel: "Annulla",
    accept: () => {
      deleteParticipant(allocationId, participant.id);
    },
  });
};

const deleteParticipant = (allocationId, participantId) => {
  apiClient
    .delete(
      `${store.api}/allocations/${allocationId}/participants/${participantId}`,
      { headers: { Authorization: `Bearer ${store.token}` } }
    )
    .then(async () => {
      participants.value = participants.value.filter(
        (p) => p.id !== participantId
      );
      toast.add({
        severity: "success",
        summary: "Partecipante eliminato",
        detail: "Il partecipante è stato eliminato con successo.",
        life: 3000,
      });
    })
    .catch((error) => handleApiError(error));
};

// Handle API error
const handleApiError = (error) => {
  console.error("Error during the API request:", error.response || error);
  toast.add({
    severity: "error",
    summary: "Errore di server",
    detail: "Si è verificato un errore interno del server. Riprova più tardi.",
    life: 3000,
  });
};

watch(
  isEditingReactive,
  (newVal) => {
    const nameField = allocationFormFields.value.find(
      (field) => field.key === "name"
    );
    if (nameField) {
      nameField.class = newVal ? "col-span-1" : "col-span-2";
    }
    const idField = allocationFormFields.value.find(
      (field) => field.key === "id"
    );
    if (idField) {
      idField.class = newVal ? "disabled-field" : "disabled-field hidden";
    }
  },
  { immediate: true }
);

const generateValidationRules = () => {
  const rules = {};

  allocationFormFields.value.forEach((field) => {
    if (field.validation) rules[field.key] = field.validation;
  });

  return rules;
};

let rules = generateValidationRules();
let v$ = useVuelidate(rules, props.newAllocation, { $scope: false });
const allocationWarnings = ref([]);

watch(
  () => props.showDialog,
  (isOpen) => {
    if (isOpen && props.isEditing) {
      rules = generateValidationRules();
      v$ = useVuelidate(rules, props.newAllocation);
      v$.value.$reset();
      v$.value.$validate();
    }
    if (!props.isEditing) {
      rules = generateValidationRules();
      v$ = useVuelidate(rules, props.newAllocation);
      v$.value.$reset();
    }
  }
);

const validateParticipant = (participant, index) => {
  participantErrors.value[index] = {};

  if (!participant.role) {
    participantErrors.value[index].role = "Il ruolo è obbligatorio.";
  }

  if (participant.type === "external") {
    if (!participant.external_name) {
      participantErrors.value[index].external_name =
        "Nome esterno obbligatorio.";
    }

    if (!participant.external_email) {
      participantErrors.value[index].external_email = "L'email è obbligatoria.";
    }
  }

  if (participant.type === "registered") {
    if (!participant.user_id) {
      participantErrors.value[index].user = "Utente obbligatorio.";
    }
  }

  if (participant.external_email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(participant.external_email)) {
      participantErrors.value[index].external_email = "Email non valida.";
    }
  }

  const hasErrors = Object.keys(participantErrors.value[index]).length > 0;
  if (hasErrors) {
    toast.add({
      severity: "warn",
      summary: "Errore di Validazione",
      detail: "Correggi gli errori nei partecipanti.",
      life: 3000,
    });
  }

  return !hasErrors;
};

const submitAllocation = async () => {
  const isValid = await v$.value.$validate();
  if (!isValid) {
    let message = null;
    if (!props.newAllocation.tender_id && !props.newAllocation.workflow_id) {
      message = "Devi selezionare un bando o un gruppo delle fasi.";
    }
    toast.add({
      severity: "error",
      summary: "Errore",
      detail: message || "Correggi gli errori.",
      life: 3000,
    });
    return;
  }

  for (const [index, participant] of participants.value.entries()) {
    const valid = validateParticipant(participant, index);
    if (!valid) return;
  }

  props.newAllocation["participants"] = [];
  props.newAllocation.participants = participants.value.filter(
    (p) => p.role && (p.user_id || (p.external_name && p.external_email))
  );

  if (props.isEditing && update_workflow.value && props.newAllocation?.id) {
    const previewPayload = {
      ...props.newAllocation,
      refresh_workflow_version: true,
      preview_workflow_refresh: true,
    };

    try {
      const previewResponse = await apiClient.put(
        `${store.api}/allocations/${props.newAllocation.id}`,
        previewPayload,
        { headers: { Authorization: `Bearer ${store.token}` } }
      );

      const preview = previewResponse?.data?.preview || {};
      const details = [
        `Fasi create: ${preview.phases_created || 0}`,
        `Fasi eliminate: ${preview.phases_deleted || 0}`,
        `Segmenti creati: ${preview.segments_created || 0}`,
        `Segmenti spostati: ${preview.segments_moved || 0}`,
        `Valori rimossi: ${preview.values_cleared || 0}`,
        `File eliminati: ${preview.files_deleted || 0}`,
      ].join("\n");

      confirm.require({
        header: "Conferma aggiornamento workflow",
        message: `Stai per riallineare tutta la pratica alla versione più recente del workflow.\n\n${details}\n\nVuoi continuare?`,
        icon: "pi pi-exclamation-triangle",
        acceptLabel: "Sì, aggiorna",
        rejectLabel: "Annulla",
        acceptClass: "p-button-danger",
        rejectClass: "p-button-secondary",
        accept: () => {
          props.newAllocation.refresh_workflow_version = true;
          props.newAllocation.preview_workflow_refresh = false;
          emit("save", props.newAllocation);
        },
      });

      return;
    } catch (error) {
      toast.add({
        severity: "error",
        summary: "Errore",
        detail:
          error.response?.data?.message ||
          "Impossibile calcolare l'anteprima di aggiornamento workflow.",
        life: 3500,
      });
      return;
    }
  }

  props.newAllocation.refresh_workflow_version = !!update_workflow.value;
  props.newAllocation.preview_workflow_refresh = false;
  emit("save", props.newAllocation);
};

const cancelAllocation = () => {
  emit("cancel");
};
</script>
