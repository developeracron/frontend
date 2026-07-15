<template>
  <div class="content-page">
    <div class="card-container">
      <!-- WORKFLOWS -->
      <div class="card-item">
        <Card>
          <template #title>
            <div class="flex justify-between align-items-center">
              <div class="text-xl font-bold">Gruppi di Fasi</div>

              <!-- create workflow -->
              <Button
                v-if="canCreateWorkflow"
                label="Aggiungi gruppo"
                severity="success"
                @click="newPhaseGroupModal = true"
                icon="pi pi-plus"
                outlined
              />
            </div>
          </template>

          <template #content>
            <TreeTable
              :value="workflows"
              v-model:expandedKeys="expandedWorkflowsKeys"
              :resizableColumns="true"
              :loading="loadingWorkflows"
            >
              <Column field="name" header="Nome" expander />

              <!-- actions column only if user can do something -->
              <Column
                v-if="showWorkflowActionsColumn"
                header="Azioni"
                style="width: 10rem"
              >
                <template #body="slotProps">
                  <div v-if="slotProps.node.children" class="flex gap-1">
                    <button
                      v-if="canUpdateWorkflow"
                      @click="editPhaseGroup(slotProps.node)"
                    >
                      <Button
                        type="button"
                        icon="pi pi-pencil"
                        severity="secondary"
                        text
                      />
                    </button>

                    <button
                      v-if="canDeleteWorkflow"
                      @click="deleteWorkflow(slotProps.node)"
                    >
                      <Button
                        type="button"
                        icon="pi pi-trash"
                        severity="danger"
                        text
                      />
                    </button>
                  </div>
                </template>
              </Column>

              <template #empty>
                <div v-if="workflowMessage">{{ workflowMessage }}</div>
              </template>
            </TreeTable>
          </template>
        </Card>
      </div>

      <!-- PHASES -->
      <div class="card-item">
        <Card>
          <template #title>
            <div class="flex justify-between align-items-center">
              <div class="text-xl font-bold">Fasi</div>

              <!-- create phase -->
              <Button
                v-if="canCreatePhase"
                label="Aggiungi fase"
                severity="success"
                @click="addNewPhase"
                icon="pi pi-plus"
                outlined
              />
            </div>
          </template>

          <template #content>
            <TreeTable
              :value="phases"
              v-model:expandedKeys="expandedKeys"
              :resizableColumns="true"
              :loading="loadingPhases"
              tableStyle="table-layout: auto; width: 100%;"
            >
              <Column
                field="name"
                header="Nome"
                expander
                :style="{ minWidth: '350px' }"
              >
                <template #body="slotProps">
                  <div
                    v-if="
                      (slotProps.node.isNew && canCreatePhase) ||
                      (slotProps.node.isEdit && canUpdatePhase) ||
                      (slotProps.node.isNew &&
                        !slotProps.node.children &&
                        canCreateSegment) ||
                      (slotProps.node.isEdit &&
                        !slotProps.node.children &&
                        canUpdateSegment)
                    "
                  >
                    <FloatLabel
                      v-if="!slotProps.node.children"
                      variant="on"
                      class="w-full"
                    >
                      <InputText
                        id="segment_name"
                        v-model="slotProps.node.data.name"
                        class="w-full"
                      />
                      <label for="segment_name">Nome del nuovo segmento</label>
                    </FloatLabel>

                    <FloatLabel v-else variant="on">
                      <InputText
                        v-model="slotProps.node.data.name"
                        class="w-full"
                        @keydown.left.stop
                        @keydown.right.stop
                      />
                      <label>{{
                        slotProps.node.isEdit
                          ? "Modifica nome della fase"
                          : "Nome della nuova fase"
                      }}</label>
                    </FloatLabel>
                  </div>

                  <div v-else>
                    {{ slotProps.node.data.name }}
                  </div>
                </template>
              </Column>

              <Column header="Tipo">
                <template #body="slotProps">
                  <span v-if="!slotProps.node.children">
                    <FloatLabel
                      v-if="
                        (slotProps.node.isNew && canCreateSegment) ||
                        (slotProps.node.isEdit && canUpdateSegment)
                      "
                      class="w-full md:w-56 min-w-44"
                      variant="on"
                    >
                      <Select
                        v-model="slotProps.node.data.type"
                        inputId="select_new_segment_type"
                        :options="phaseSegmentTypes"
                        class="w-full min-w-20"
                      />
                      <label for="select_new_segment_type"
                        >Tipo di segmento</label
                      >
                    </FloatLabel>

                    <span v-else>{{ slotProps.node.data.type }}</span>
                  </span>
                </template>
              </Column>

              <Column header="Obbligatorio" style="width: 15%">
                <template #body="slotProps">
                  <div
                    v-if="!slotProps.node.children"
                    class="flex flex-1 justify-center"
                  >
                    <Checkbox
                      v-if="
                        (slotProps.node.isNew && canCreateSegment) ||
                        (slotProps.node.isEdit && canUpdateSegment)
                      "
                      v-model="slotProps.node.data.required"
                      binary
                      size="large"
                      name="required"
                    />
                    <span v-else>
                      <i
                        :class="
                          slotProps.node.data.required
                            ? 'pi pi-check'
                            : 'pi pi-times'
                        "
                      ></i>
                    </span>
                  </div>
                </template>
              </Column>

              <!-- actions column only if user can do something -->
              <Column
                v-if="showPhaseActionsColumn"
                header="Azioni"
                style="min-width: 150px"
              >
                <template #body="slotProps">
                  <!-- NEW SEGMENT (inline) -->
                  <div
                    v-if="
                      slotProps.node.isEdit &&
                      slotProps.node.isNew &&
                      !slotProps.node.children
                    "
                    class="flex gap-1"
                  >
                    <button
                      v-if="canCreateSegment"
                      @click="saveSegment(slotProps.node)"
                    >
                      <Button
                        type="button"
                        icon="pi pi-check"
                        severity="success"
                        text
                      />
                    </button>
                    <button
                      v-if="canCreateSegment"
                      @click="cancelSegment(slotProps.node)"
                    >
                      <Button
                        type="button"
                        icon="pi pi-times"
                        severity="danger"
                        text
                      />
                    </button>
                  </div>

                  <!-- NEW PHASE -->
                  <div v-else-if="slotProps.node.isNew" class="flex gap-1">
                    <button
                      v-if="slotProps.node.children && canCreatePhase"
                      @click="savePhase(slotProps.node)"
                    >
                      <Button
                        type="button"
                        icon="pi pi-check"
                        severity="success"
                        text
                      />
                    </button>
                    <button
                      v-if="slotProps.node.children && canCreatePhase"
                      @click="cancelPhase(slotProps.node)"
                    >
                      <Button
                        type="button"
                        icon="pi pi-times"
                        severity="danger"
                        text
                      />
                    </button>
                  </div>

                  <!-- EDIT MODE -->
                  <div v-else-if="slotProps.node.isEdit" class="flex gap-1">
                    <!-- phase edit -->
                    <div v-if="slotProps.node.children" class="flex gap-1">
                      <button
                        v-if="canUpdatePhase"
                        @click="updatePhase(slotProps.node)"
                      >
                        <Button
                          type="button"
                          icon="pi pi-check"
                          severity="success"
                          text
                        />
                      </button>
                      <button
                        v-if="canUpdatePhase"
                        @click="cancelPhaseUpdate(slotProps.node)"
                      >
                        <Button
                          type="button"
                          icon="pi pi-times"
                          severity="danger"
                          text
                        />
                      </button>
                    </div>

                    <!-- segment edit -->
                    <div v-else class="flex gap-1">
                      <button
                        v-if="canUpdateSegment"
                        @click="updateSegment(slotProps.node)"
                      >
                        <Button
                          type="button"
                          icon="pi pi-check"
                          severity="success"
                          text
                        />
                      </button>
                      <button
                        v-if="canUpdateSegment"
                        @click="cancelSegmentUpdate(slotProps.node)"
                      >
                        <Button
                          type="button"
                          icon="pi pi-times"
                          severity="danger"
                          text
                        />
                      </button>
                    </div>
                  </div>

                  <!-- DEFAULT ACTIONS -->
                  <div v-else class="flex gap-1">
                    <!-- phase row actions -->
                    <div v-if="slotProps.node.children" class="flex gap-1">
                      <button
                        v-if="canUpdatePhase"
                        @click="editPhase(slotProps.node)"
                      >
                        <Button
                          type="button"
                          icon="pi pi-pencil"
                          severity="secondary"
                          text
                        />
                      </button>

                      <button
                        v-if="canDeletePhase"
                        @click="deletePhase(slotProps.node)"
                      >
                        <Button
                          type="button"
                          icon="pi pi-trash"
                          severity="danger"
                          text
                        />
                      </button>

                      <button
                        v-if="canCreateSegment"
                        @click="addSegment(slotProps.node)"
                      >
                        <Button
                          type="button"
                          icon="pi pi-plus"
                          severity="info"
                          text
                        />
                      </button>
                    </div>

                    <!-- segment row actions -->
                    <div v-else class="flex gap-1">
                      <button
                        v-if="canUpdateSegment"
                        @click="editSegment(slotProps.node)"
                      >
                        <Button
                          type="button"
                          icon="pi pi-pencil"
                          severity="secondary"
                          text
                        />
                      </button>

                      <button
                        v-if="canDeleteSegment"
                        @click="deleteSegment(slotProps.node)"
                      >
                        <Button
                          type="button"
                          icon="pi pi-trash"
                          severity="danger"
                          text
                        />
                      </button>
                    </div>
                  </div>
                </template>
              </Column>

              <template #empty>
                <div v-if="phaseMessage">{{ phaseMessage }}</div>
              </template>
            </TreeTable>
          </template>
        </Card>
      </div>
    </div>

    <!-- New Phase Group Modal -->
    <Dialog
      v-model:visible="newPhaseGroupModal"
      header="Crea nuovo gruppo"
      :mask="true"
      class="phase-group-dialog"
      :closable="true"
      :modal="true"
    >
      <div class="pt-2 pb-4">
        <FloatLabel variant="on" class="w-full">
          <InputText id="name" class="w-full" v-model="newWorkflow.data.name" />
          <label for="name">Nome</label>
        </FloatLabel>
      </div>

      <div class="pb-4">
        <MultiSelect
          id="on_label"
          v-model="newWorkflow.children[0].data.selectedPhases"
          @change="onSelectGroupPhases"
          :options="availablePhases"
          optionLabel="name"
          :maxSelectedLabels="4"
          display="chip"
          filter
          placeholder="Seleziona Fasi"
          class="w-full"
        />
      </div>

      <div
        class="pl-1 pb-4 text-lg font-bold text-surface-400"
        v-if="newWorkflow.tableData?.length"
      >
        L'ordine delle fasi:
      </div>

      <DataTable
        v-if="newWorkflow.tableData?.length"
        :value="newWorkflow.tableData"
        @rowReorder="onRowReorder"
        responsiveLayout="scroll"
        scrollable
        scrollHeight="250px"
        class="pb-4"
      >
        <Column rowReorder headerStyle="display: none" style="width: 16px" />
        <Column field="name" headerStyle="display: none">
          <template #body="slotProps">
            {{ slotProps.data.order }}. {{ slotProps.data.name }}
          </template>
        </Column>
      </DataTable>

      <div class="flex justify-end gap-4 col-span-2">
        <Button
          v-if="canCreateWorkflow"
          label="Crea gruppo"
          icon="pi pi-check"
          @click="saveNewPhaseGroup"
        />
      </div>

      <div
        v-if="saving"
        class="absolute inset-0 flex items-center justify-center bg-white/50 z-10 rounded-md"
      >
        <ProgressSpinner style="width: 50px; height: 50px" strokeWidth="4" />
      </div>
    </Dialog>

    <!-- Edit Phase Group Modal -->
    <Dialog
      v-model:visible="editPhaseGroupModal"
      header="Modifica gruppo"
      class="phase-group-dialog"
      @hide="onEditPhaseGroupModalClose"
      :closable="true"
      :modal="true"
      :mask="true"
    >
      <div class="pt-2 pb-4">
        <FloatLabel variant="on" class="w-full">
          <InputText
            id="name"
            class="w-full"
            v-model="selectedPhaseGroup.data.name"
          />
          <label for="name">Nome</label>
        </FloatLabel>
      </div>

      <div class="pb-4">
        <MultiSelect
          id="on_label"
          v-model="selectedPhaseGroup.children[0].data.selectedPhases"
          @change="onSelectGroupPhases"
          :options="availablePhases"
          optionLabel="name"
          :maxSelectedLabels="4"
          display="chip"
          filter
          placeholder="Modifica Fasi"
          class="w-full"
        />
      </div>

      <div
        class="pl-1 pb-4 text-lg font-bold text-surface-400"
        v-if="selectedPhaseGroup.tableData?.length"
      >
        L'ordine delle fasi:
      </div>

      <DataTable
        v-if="selectedPhaseGroup.tableData?.length"
        :value="selectedPhaseGroup.tableData"
        @rowReorder="onRowReorder"
        responsiveLayout="scroll"
        scrollable
        scrollHeight="250px"
        class="pb-4"
      >
        <Column rowReorder headerStyle="display: none" style="width: 16px" />
        <Column field="name" headerStyle="display: none">
          <template #body="slotProps">
            {{ slotProps.data.order }}. {{ slotProps.data.name }}
          </template>
        </Column>
      </DataTable>

      <div class="flex justify-end gap-4 col-span-2">
        <Button
          v-if="canUpdateWorkflow"
          label="Aggiorna gruppo"
          icon="pi pi-check"
          @click="updatePhaseGroup"
        />
      </div>

      <div
        v-if="saving"
        class="absolute inset-0 flex items-center justify-center bg-white/50 z-10 rounded-md"
      >
        <ProgressSpinner style="width: 50px; height: 50px" strokeWidth="4" />
      </div>
    </Dialog>
  </div>
</template>

<script setup>
import { onMounted, ref, watch, computed } from "vue";
import TreeTable from "primevue/treetable";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import Button from "primevue/button";
import FloatLabel from "primevue/floatlabel";
import Select from "primevue/select";
import InputText from "primevue/inputtext";
import { useToast } from "primevue/usetoast";
import { useStore } from "@/store";
import apiClient from "@/router/apiClient";
import MultiSelect from "primevue/multiselect";
import Checkbox from "primevue/checkbox";
import Dialog from "primevue/dialog";
import Card from "primevue/card";
import ProgressSpinner from "primevue/progressspinner";
import { usePermissions } from "@/composables/usePermissions";

const store = useStore();
const toast = useToast();

const phases = ref([]);
const workflows = ref([]);
const phaseSegmentTypes = ref([]);
const expandedKeys = ref({});
const expandedWorkflowsKeys = ref({});
const phaseMessage = ref("");
const workflowMessage = ref("");
const availablePhases = ref([]);

const newPhaseGroupModal = ref(false);
const editPhaseGroupModal = ref(false);
const selectedPhaseGroup = ref(null);

const orderMap = new Map();
const loadingPhases = ref(false);
const loadingWorkflows = ref(false);
const saving = ref(false);

const { can, canAny } = usePermissions();

// phases permissions (backend: phases.view/manage/full)
const canViewPhase = computed(() => can("phases.view"));
const canCreatePhase = computed(() => can("phases.manage"));
const canUpdatePhase = computed(() => can("phases.manage"));
const canDeletePhase = computed(() => can("phases.full"));

// segments permissions (backend: segments.view/manage/full)
const canCreateSegment = computed(() => can("segments.manage"));
const canUpdateSegment = computed(() => can("segments.manage"));
const canDeleteSegment = computed(() => can("segments.full"));

// workflows permissions (backend: workflows.view/manage/full)
const canViewWorkflow = computed(() => can("workflows.view"));
const canCreateWorkflow = computed(() => can("workflows.manage"));
const canUpdateWorkflow = computed(() => can("workflows.manage"));
const canDeleteWorkflow = computed(() => can("workflows.full"));

// Columns visibility (avoid showing empty "Azioni" columns)
const showPhaseActionsColumn = computed(() =>
  canAny([
    "phases.manage",
    "phases.full",
    "segments.manage",
    "segments.full",
  ]),
);

const showWorkflowActionsColumn = computed(() =>
  canAny(["workflows.manage", "workflows.full"]),
);

// ------------------------------------
// DATA
// ------------------------------------
const newWorkflow = ref({
  key: `new-workflow-${Date.now()}`,
  isNew: true,
  data: { name: "" },
  children: ref([
    {
      key: `new-phase-${Date.now()}`,
      isNew: true,
      isNewPhase: true,
      data: { name: "", selectedPhases: [] },
    },
  ]),
  tableData: [],
});

const normalizeWorkflowPhase = (phase, fallbackPhase = null) => ({
  id: phase?.id ?? fallbackPhase?.id,
  name: phase?.name ?? fallbackPhase?.name ?? "",
  segments: Array.isArray(phase?.segments)
    ? phase.segments
    : Array.isArray(fallbackPhase?.segments)
      ? fallbackPhase.segments
      : [],
  order: phase?.order,
});

const buildWorkflowPayload = (phases) =>
  phases.map((phase, index) => {
    const normalizedPhase = normalizeWorkflowPhase(phase);

    return {
      id: normalizedPhase.id,
      order: phase?.order ?? index + 1,
      segments: normalizedPhase.segments.map((segment) => ({
        id: segment.id,
        required: segment.required ?? false,
      })),
    };
  });

onMounted(() => {
  loadingPhases.value = true;
  loadingWorkflows.value = true;
  fetchPhases();
  fetchWorkflows();
  phaseSegmentTypes.value = store.defaults.phase_segment_types;
});

// ------------------------------------
// API
// ------------------------------------
const fetchPhases = async () => {
  if (!canViewPhase.value) {
    phases.value = [];
    availablePhases.value = [];
    phaseMessage.value = "Non hai i permessi per visualizzare le fasi.";
    loadingPhases.value = false;
    return;
  }

  try {
    const response = await apiClient.get(`${store.api}/phases`, {
      headers: { Authorization: `Bearer ${store.token}` },
    });

    if (response.data.data.length === 0) {
      phaseMessage.value = "Nessun dato sulle fasi ancora disponibile.";
    } else {
      phases.value = response.data.data.map((phase) => ({
        key: phase.id,
        data: {
          name: phase.name,
          created_at: phase.created_at,
          updated_at: phase.updated_at,
        },
        children: phase.segments.map((segment) => ({
          key: segment.id,
          data: {
            name: segment.name,
            type: segment.type,
            required: segment.required,
            phase_id: segment.phase_id,
            created_at: segment.created_at,
            updated_at: segment.updated_at,
          },
        })),
      }));

      availablePhases.value = response.data.data.map((phase) => ({
        id: phase.id,
        name: phase.name,
        segments: Array.isArray(phase.segments) ? phase.segments : [],
      }));
    }
  } catch (error) {
    if (error.response && error.response.status === 404) {
      phaseMessage.value = "Nessun dato sulle fasi ancora disponibile.";
    } else {
      console.error("Error fetching phases:", error);
    }
  } finally {
    loadingPhases.value = false;
  }
};

const fetchWorkflows = async () => {
  if (!canViewWorkflow.value) {
    workflows.value = [];
    workflowMessage.value =
      "Non hai i permessi per visualizzare i gruppi di fasi.";
    loadingWorkflows.value = false;
    return;
  }

  try {
    const response = await apiClient.get(`${store.api}/phases/workflows`, {
      headers: { Authorization: `Bearer ${store.token}` },
    });

    if (response.data.data.length === 0) {
      workflowMessage.value =
        "Nessun dato sui gruppi di fasi ancora disponibile.";
    } else {
      workflows.value = response.data.data.map((workflow) => ({
        key: workflow.id,
        data: {
          id: workflow.id,
          deleteKey: workflow.id,
          name: workflow.name,
          originalName: workflow.name,
          created_at: workflow.created_at,
          updated_at: workflow.updated_at,
        },
        children: workflow.phases.map((phase) => ({
          key: phase.id,
          data: {
            id: phase.id,
            deleteKey: workflow.id,
            name: phase.name,
            order: phase.order,
            segments: Array.isArray(phase.segments) ? phase.segments : [],
          },
        })),
        tableData: workflow.phases.map((phase) => normalizeWorkflowPhase(phase)),
      }));
    }
  } catch (error) {
    if (error.response && error.response.status === 404) {
      workflowMessage.value =
        "Nessun dato sui gruppi di fasi ancora disponibile.";
    } else {
      console.error("Error fetching workflows:", error);
    }
  } finally {
    loadingWorkflows.value = false;
  }
};

// ------------------------------------
// PHASES CRUD (guarded)
// ------------------------------------
const addNewPhase = () => {
  if (!canCreatePhase.value) return;

  const newPhaseKey = `new-${Date.now()}`;
  const newPhase = {
    key: newPhaseKey,
    isNew: true,
    data: { name: "", type: "" },
    children: ref([
      {
        key: `new-segment-${Date.now()}`,
        isNew: true,
        data: { name: "", type: "", required: false },
      },
    ]),
  };

  phases.value.unshift(newPhase);
  expandedKeys.value = { ...expandedKeys.value, [newPhaseKey]: true };

  watch(
    () => newPhase.children.value.map((child) => child.data.name),
    () => {
      const last = newPhase.children.value[newPhase.children.value.length - 1];
      if (last.data.name && !last.isNewAdded) {
        last.isNewAdded = true;
        newPhase.children.value.push({
          key: `new-segment-${Date.now()}`,
          isNew: true,
          data: { name: "", type: "", required: false },
        });
      }
    },
  );
};

const validateSegments = (children) => {
  for (const child of children) {
    const segment = child.data;
    if (
      (segment.name !== "" && segment.type === "") ||
      (segment.name === "" && segment.type !== "")
    ) {
      toast.add({
        severity: "warn",
        summary: "Errore di Validazione",
        detail: "Nome e tipo del segmento sono obbligatori.",
        life: 3000,
      });
      return false;
    }
  }
  return true;
};

const savePhase = async (node) => {
  if (!canCreatePhase.value) return;

  if (!node.data.name) {
    toast.add({
      severity: "warn",
      summary: "Errore di Validazione",
      detail: "Il nome della fase è obbligatorio.",
      life: 3000,
    });
    return;
  }

  const children = node.children || [];
  if (!validateSegments(children)) return;

  const segments = children
    .map((child) => child.data)
    .filter((segment) => segment.name && segment.type);

  try {
    await apiClient.post(
      `${store.api}/phases`,
      { name: node.data.name, segments },
      { headers: { Authorization: `Bearer ${store.token}` } },
    );

    toast.add({
      severity: "success",
      summary: "Successo",
      detail: "Fase salvata con successo.",
      life: 3000,
    });

    await fetchPhases();
  } catch (error) {
    toast.add({
      severity: "error",
      summary: "Errore",
      detail: "Salvataggio della fase fallito. Riprova.",
      life: 3000,
    });
    console.error(
      "Error saving phase:",
      error.response?.data?.message || error.message,
    );
  }
};

const cancelPhase = (node) => {
  if (!canCreatePhase.value) return;
  phases.value = phases.value.filter((phase) => phase.key !== node.key);
};

const editPhase = (phase) => {
  if (!canUpdatePhase.value) return;
  phase.isEdit = true;
};

const cancelPhaseUpdate = (node) => {
  if (!canUpdatePhase.value) return;
  node.isEdit = false;
};

const updatePhase = async (phase) => {
  if (!canUpdatePhase.value) return;

  if (!phase.data.name) {
    toast.add({
      severity: "warn",
      summary: "Errore di Validazione",
      detail: "Il nome della fase è obbligatorio.",
      life: 3000,
    });
    return;
  }

  try {
    await apiClient.put(
      `${store.api}/phases/${phase.key}`,
      { name: phase.data.name },
      { headers: { Authorization: `Bearer ${store.token}` } },
    );

    toast.add({
      severity: "success",
      summary: "Successo",
      detail: "Fase aggiornata con successo.",
      life: 3000,
    });

    phase.isEdit = false;
  } catch (error) {
    toast.add({
      severity: "error",
      summary: "Errore",
      detail: "Salvataggio della fase fallito. Riprova.",
      life: 3000,
    });
    console.error(
      "Error updating phase:",
      error.response?.data?.message || error.message,
    );
  }
};

const deletePhase = async (phase) => {
  if (!canDeletePhase.value) return;

  try {
    const response = await apiClient.delete(`${store.api}/phases/${phase.key}`, {
      headers: { Authorization: `Bearer ${store.token}` },
    });

    if (response.data.success) {
      phases.value = phases.value.filter((p) => p.key !== phase.key);
      toast.add({
        severity: "success",
        summary: "Successo",
        detail: "Fase eliminata con successo.",
        life: 3000,
      });
    }
  } catch (error) {
    toast.add({
      severity: "error",
      summary: "Errore",
      detail: "Eliminazione della fase fallita. Riprova.",
      life: 3000,
    });
    console.error(
      "Error deleting phase:",
      error.response?.data?.message || error.message,
    );
  }
};

// ------------------------------------
// SEGMENTS CRUD (guarded)
// ------------------------------------
const addSegment = (phase) => {
  if (!canCreateSegment.value) return;

  const newSegmentKey = `new-segment-${Date.now()}`;
  const newSegment = {
    key: newSegmentKey,
    isNew: true,
    isEdit: true,
    data: {
      name: "",
      type: "file",
      required: false,
      phase_id: phase.key,
    },
  };

  if (!phase.children) phase.children = [];
  phase.children.unshift(newSegment);
  expandedKeys.value = { ...expandedKeys.value, [newSegmentKey]: true };
};

const saveSegment = async (segment) => {
  if (!canCreateSegment.value) return;

  if (!segment.data.name || !segment.data.type) {
    toast.add({
      severity: "warn",
      summary: "Errore di Validazione",
      detail: "Il nome e il tipo del segmento sono obbligatori.",
      life: 3000,
    });
    return;
  }

  try {
    await apiClient.post(
      `${store.api}/phases/segments`,
      {
        phase_id: segment.data.phase_id,
        name: segment.data.name,
        type: segment.data.type,
        required: segment.data.required,
      },
      { headers: { Authorization: `Bearer ${store.token}` } },
    );

    toast.add({
      severity: "success",
      summary: "Successo",
      detail: "Segmento aggiunto con successo.",
      life: 3000,
    });

    await fetchPhases();
  } catch (error) {
    toast.add({
      severity: "error",
      summary: "Errore",
      detail: "Salvataggio del segmento di fase fallito. Riprova.",
      life: 3000,
    });
    console.error(
      "Error saving segment:",
      error.response?.data?.message || error.message,
    );
  }
};

const cancelSegment = (segment) => {
  if (!canCreateSegment.value) return;

  phases.value = phases.value.map((phase) => {
    if (phase.key === segment.data.phase_id) {
      return {
        ...phase,
        children: phase.children.filter((child) => child.key !== segment.key),
      };
    }
    return phase;
  });
};

const editSegment = (segment) => {
  if (!canUpdateSegment.value) return;
  segment.isEdit = true;
};

const cancelSegmentUpdate = (segment) => {
  if (!canUpdateSegment.value) return;
  segment.isEdit = false;
};

const updateSegment = async (segment) => {
  if (!canUpdateSegment.value) return;

  if (!segment.data.name || !segment.data.type) {
    toast.add({
      severity: "warn",
      summary: "Errore di Validazione",
      detail: "Il nome e il tipo del segmento sono obbligatori.",
      life: 3000,
    });
    return;
  }

  try {
    await apiClient.put(
      `${store.api}/phases/segments/${segment.key}`,
      {
        name: segment.data.name,
        type: segment.data.type,
        required: segment.data.required,
        phase_id: segment.data.phase_id,
      },
      { headers: { Authorization: `Bearer ${store.token}` } },
    );

    toast.add({
      severity: "success",
      summary: "Successo",
      detail: "Segmento di fase aggiornato con successo.",
      life: 3000,
    });

    segment.isEdit = false;
  } catch (error) {
    toast.add({
      severity: "error",
      summary: "Errore",
      detail: "Salvataggio del segmento di fase fallita. Riprova.",
      life: 3000,
    });
    console.error(
      "Error updating segment:",
      error.response?.data?.message || error.message,
    );
  }
};

const deleteSegment = async (segment) => {
  if (!canDeleteSegment.value) return;

  try {
    const response = await apiClient.delete(
      `${store.api}/phases/segments/${segment.key}`,
      {
        headers: { Authorization: `Bearer ${store.token}` },
      },
    );

    if (response.data.success) {
      phases.value = phases.value.map((phase) => ({
        ...phase,
        children: phase.children?.filter((child) => child.key !== segment.key),
      }));

      toast.add({
        severity: "success",
        summary: "Successo",
        detail: "Segmento di fase eliminato con successo.",
        life: 3000,
      });
    }
  } catch (error) {
    toast.add({
      severity: "error",
      summary: "Errore",
      detail: "Eliminazione del segmento di fase fallita. Riprova.",
      life: 3000,
    });
    console.error(
      "Error deleting segment:",
      error.response?.data?.message || error.message,
    );
  }
};

// ------------------------------------
// WORKFLOWS (guarded)
// ------------------------------------
const updatePhaseOrder = (currentSelectedPhases, tableDataRef) => {
  currentSelectedPhases.forEach((phase) => {
    if (!orderMap.has(phase.id)) {
      orderMap.set(phase.id, orderMap.size + 1);
    }
  });

  orderMap.forEach((_, id) => {
    if (!currentSelectedPhases.some((phase) => phase.id === id)) {
      orderMap.delete(id);
    }
  });

  tableDataRef.length = 0;

  currentSelectedPhases
    .sort((a, b) => orderMap.get(a.id) - orderMap.get(b.id))
    .forEach((phase, index) => {
      orderMap.set(phase.id, index + 1);
      tableDataRef.push({
        ...normalizeWorkflowPhase(phase),
        order: index + 1,
      });
    });
};

const onSelectGroupPhases = () => {
  if (newPhaseGroupModal.value) {
    updatePhaseOrder(
      newWorkflow.value.children[0].data.selectedPhases,
      newWorkflow.value.tableData,
    );
  }

  if (editPhaseGroupModal.value) {
    updatePhaseOrder(
      selectedPhaseGroup.value.children[0].data.selectedPhases,
      selectedPhaseGroup.value.tableData,
    );
  }
};

const updateReorderedPhases = (event, tableDataRef) => {
  event.value.forEach((item, index) => {
    orderMap.set(item.id, index + 1);
  });

  tableDataRef.length = 0;
  event.value.forEach((item, index) => {
    tableDataRef.push({
      ...normalizeWorkflowPhase(item),
      order: index + 1,
    });
  });
};

const onRowReorder = (event) => {
  if (newPhaseGroupModal.value)
    updateReorderedPhases(event, newWorkflow.value.tableData);
  if (editPhaseGroupModal.value)
    updateReorderedPhases(event, selectedPhaseGroup.value.tableData);
};

const saveNewPhaseGroup = async () => {
  if (!canCreateWorkflow.value) return;

  if (!newWorkflow.value.data.name) {
    toast.add({
      severity: "warn",
      summary: "Errore di Validazione",
      detail: "Il nome del gruppo di fasi è obbligatorio.",
      life: 3000,
    });
    return;
  }

  if (!newWorkflow.value.children[0].data.selectedPhases.length) {
    toast.add({
      severity: "warn",
      summary: "Errore di Validazione",
      detail: "Deve essere selezionata almeno una fase.",
      life: 3000,
    });
    return;
  }

  saving.value = true;

  const phasesData = buildWorkflowPayload(newWorkflow.value.tableData);

  try {
    await apiClient.post(
      `${store.api}/phases/workflows`,
      { name: newWorkflow.value.data.name, phases: phasesData },
      { headers: { Authorization: `Bearer ${store.token}` } },
    );

    toast.add({
      severity: "success",
      summary: "Successo",
      detail: "Gruppo di fasi salvato con successo.",
      life: 3000,
    });

    await fetchWorkflows();
    newPhaseGroupModal.value = false;
  } catch (error) {
    toast.add({
      severity: "error",
      summary: "Errore",
      detail: "Salvataggio del gruppo di fasi fallito. Riprova.",
      life: 3000,
    });
    console.error(
      "Error saving workflow:",
      error.response?.data?.message || error.message,
    );
  } finally {
    saving.value = false;
  }
};

const onEditPhaseGroupModalClose = () => {
  selectedPhaseGroup.value.data.name =
    selectedPhaseGroup.value.data.originalName;
};

const editPhaseGroup = (workflow) => {
  if (!canUpdateWorkflow.value) return;

  workflow.data.name = workflow.data.originalName;
  workflow.children = Array.isArray(workflow.children) ? workflow.children : [];
  workflow.tableData = Array.isArray(workflow.tableData) ? workflow.tableData : [];

  if (!workflow.children.length) {
    workflow.children = [
      {
        key: `workflow-${workflow.key}-selector`,
        data: { selectedPhases: [] },
      },
    ];
  }

  if (!workflow.children[0].data) {
    workflow.children[0].data = { selectedPhases: [] };
  }

  workflow.children[0].data.selectedPhases = workflow.children
    .filter((child) => child?.data?.id)
    .map((child) => {
      const phase = availablePhases.value.find((p) => p.id === child.data.id);
      // Keep workflow editing stable even when a phase is not in the fetched phase list.
      return normalizeWorkflowPhase(child.data, phase);
    });

  selectedPhaseGroup.value = workflow;

  updatePhaseOrder(
    selectedPhaseGroup.value.children[0].data.selectedPhases,
    selectedPhaseGroup.value.tableData,
  );

  editPhaseGroupModal.value = true;
};

const updatePhaseGroup = async () => {
  if (!canUpdateWorkflow.value) return;

  if (!selectedPhaseGroup.value.data.name) {
    toast.add({
      severity: "warn",
      summary: "Errore di Validazione",
      detail: "Il nome del gruppo di fasi è obbligatorio.",
      life: 3000,
    });
    return;
  }

  if (!selectedPhaseGroup.value.children[0].data.selectedPhases.length) {
    toast.add({
      severity: "warn",
      summary: "Errore di Validazione",
      detail: "Deve essere selezionata almeno una fase.",
      life: 3000,
    });
    return;
  }

  saving.value = true;

  const phasesData = buildWorkflowPayload(selectedPhaseGroup.value.tableData);

  try {
    await apiClient.put(
      `${store.api}/phases/workflows/${selectedPhaseGroup.value.key}`,
      { name: selectedPhaseGroup.value.data.name, phases: phasesData },
      { headers: { Authorization: `Bearer ${store.token}` } },
    );

    toast.add({
      severity: "success",
      summary: "Successo",
      detail: "Fase del gruppo aggiornata con successo.",
      life: 3000,
    });

    await fetchWorkflows();
    editPhaseGroupModal.value = false;
  } catch (error) {
    toast.add({
      severity: "error",
      summary: "Errore",
      detail: "Aggiornamento della fase del gruppo fallito. Riprova.",
      life: 3000,
    });
    console.error(
      "Error updating workflow:",
      error.response?.data?.message || error.message,
    );
  } finally {
    saving.value = false;
  }
};

const deleteWorkflow = async (workflow) => {
  if (!canDeleteWorkflow.value) return;

  try {
    const response = await apiClient.delete(
      `${store.api}/phases/workflows/${workflow.key}`,
      {
        headers: { Authorization: `Bearer ${store.token}` },
      },
    );

    if (response.data.success) {
      workflows.value = workflows.value.filter((w) => w.key !== workflow.key);
      toast.add({
        severity: "success",
        summary: "Successo",
        detail: "Gruppo di fasi eliminato con successo.",
        life: 3000,
      });
    }
  } catch (error) {
    toast.add({
      severity: "error",
      summary: "Errore",
      detail: "Eliminazione del gruppo di fasi fallita. Riprova.",
      life: 3000,
    });
    console.error(
      "Error deleting workflow:",
      error.response?.data?.message || error.message,
    );
  }
};
</script>

<style scoped>
.content-page {
  padding: 1rem;
}

.card-container {
  display: flex;
  gap: 1rem;
  width: 100%;
}

.card-item {
  flex: 1;
}

@media (max-width: 1199px) {
  .card-container {
    flex-direction: column;
  }

  .card-item {
    width: 100%;
  }
}

:deep(.phase-group-dialog) {
  width: 30vw;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
}

:deep(.p-dialog-mask.p-component-overlay) {
  background-color: rgba(0, 0, 0, 0.4);
}

@media (max-width: 990px) {
  :deep(.phase-group-dialog) {
    width: 90vw !important;
    max-width: 90vw !important;
  }
}

@media (min-width: 991px) and (max-width: 1400px) {
  :deep(.phase-group-dialog) {
    width: 50vw !important;
    max-width: 50vw !important;
  }
}

:deep(.p-multiselect) {
  max-width: 100%;
}

:deep(.p-multiselect-label) {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  max-height: 80px;
  overflow-y: auto;
}
</style>
