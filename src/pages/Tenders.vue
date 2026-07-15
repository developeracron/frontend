<template>
  <div class="flex px-5 pt-5 !mb-0" v-bind="$attrs">
    <div class="w-full mx-auto">
      <Card class="w-full">
        <template #title>
          <div class="flex justify-between items-center">
            <div class="text-xl font-bold">Bandi</div>

            <div class="flex justify-end items-center gap-2 action-buttons">
              <IconField>
                <InputIcon class="pi pi-search" />
                <InputText
                  v-model="filters.global"
                  placeholder="Cerca su bandi..."
                  type="search"
                  @input="onFilter()"
                  class="w-44 md:w-64"
                />
              </IconField>
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
                v-if="canCreateTender"
                label="Aggiungi nuovo"
                @click="(newTenderModal = true), resetTender()"
                severity="success"
                icon="pi pi-plus"
                class="p-button-primary responsive-button"
                outlined
              />
            </div>
          </div>
        </template>
        <template #content>
          <TreeTable
            :value="tenders"
            :lazy="true"
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
            removableSort
            v-model:expandedKeys="expandedKeys"
            :resizableColumns="true"
            :scrollable="true"
            scrollDirection="both"
            :loading="loading"
            scrollHeight="calc(100vh - 300px)"
            :rowHover="true"
          >
            <Column field="name" header="Nome" sortable>
              <template #filter>
                <InputText
                  v-if="toggleFilters"
                  v-model="filters.name"
                  type="search"
                  placeholder="Filtra per nome..."
                  @input="debouncedFilter(onFilter)"
                />
              </template>
            </Column>
            <Column field="description" header="Descrizione" sortable>
              <template #filter>
                <InputText
                  v-if="toggleFilters"
                  v-model="filters.description"
                  type="search"
                  @input="debouncedFilter(onFilter)"
                  placeholder="Filtra per descrizione..."
                />
              </template>
            </Column>
            <Column field="start_date" header="Data Inizio" sortable>
              <template #filter>
                <div class="relative inline-block w-full max-w-xs">
                  <DatePicker
                    v-if="toggleFilters"
                    v-model="filters.start_date"
                    dateFormat="dd.mm.yy"
                    placeholder="Filtra per data inizio..."
                    @update:modelValue="onFilter"
                    class="w-full min-w-44"
                  />
                  <button
                    v-if="filters.start_date"
                    @click="clearFilter('start_date')"
                    class="absolute right-4 top-1/2 -translate-y-1/2 text-[22px] font-bold text-blue-900"
                    type="button"
                  >
                    ×
                  </button>
                </div>
              </template>
              <template #body="slotProps">
                {{ formatDate(slotProps.node.data.start_date) }}
              </template>
            </Column>
            <Column field="end_date" header="Data Fine" sortable>
              <template #filter>
                <div class="relative inline-block w-full max-w-xs">
                  <DatePicker
                    v-if="toggleFilters"
                    v-model="filters.end_date"
                    dateFormat="dd.mm.yy"
                    placeholder="Filtra per data fine..."
                    @update:modelValue="onFilter"
                    class="w-full min-w-44"
                  />
                  <button
                    v-if="filters.end_date"
                    @click="clearFilter('end_date')"
                    class="absolute right-4 top-1/2 -translate-y-1/2 text-[22px] font-bold text-blue-900"
                    type="button"
                  >
                    ×
                  </button>
                </div>
              </template>
              <template #body="slotProps">
                {{ formatDate(slotProps.node.data.end_date) }}
              </template>
            </Column>
            <Column field="workflow_name" header="Flusso di lavoro" sortable>
              <template #filter>
                <InputText
                  v-if="toggleFilters"
                  v-model="filters.workflow_name"
                  type="search"
                  @input="debouncedFilter(onFilter)"
                  placeholder="Filtra per flusso..."
                />
              </template>
              <template #body="slotProps">
                {{ slotProps.node.data.workflow?.name }}
              </template>
            </Column>
            <Column
              v-if="showTenderActionsColumn"
              header="Azioni"
              :style="{ width: '12rem' }"
            >
              <template #body="slotProps">
                <Button
                  v-if="canViewTender"
                  type="button"
                  icon="pi pi-eye"
                  severity="info"
                  text
                  @click="showTender(slotProps.node)"
                />
                <Button
                  v-if="canUpdateTender"
                  type="button"
                  icon="pi pi-pencil"
                  severity="secondary"
                  text
                  @click="editTender(slotProps.node)"
                />
                <Button
                  v-if="canDeleteTender"
                  type="button"
                  icon="pi pi-trash"
                  severity="danger"
                  text
                  @click="confirmDeleteTender(slotProps.node)"
                />
              </template>
            </Column>
            <template #empty>
              <div v-if="message">{{ message }}</div>
            </template>
          </TreeTable>
        </template>
      </Card>
      <br />
      <!-- Show Tender Modal -->
      <Dialog
        :header="'Dettagli bando ' + selectedTender?.data?.name"
        v-model:visible="showTenderModal"
        :modal="true"
        :closable="true"
        :style="{ width: '60rem' }"
      >
        <div class="flex flex-col md:flex-row gap-4">
          <div
            class="w-full md:w-8/12"
            :class="{ 'md:w-full': !canViewNoteTender }"
          >
            <div class="flex gap-4 mb-4 items-center">
              <div
                v-if="
                  selectedTender?.data?.start_date ||
                  selectedTender?.data?.end_date
                "
                class="flex gap-4 rounded-sm border py-[5px] px-3 text-sm"
              >
                <p v-if="selectedTender?.data?.start_date">
                  {{ formatDate(selectedTender?.data?.start_date) }}
                </p>
                <div
                  v-if="
                    selectedTender?.data?.start_date &&
                    selectedTender?.data?.end_date
                  "
                >
                  <i
                    class="pi pi-arrow-right text-surface-400"
                    style="font-size: 12px"
                  ></i>
                </div>
                <p v-if="selectedTender?.data?.end_date">
                  {{ formatDate(selectedTender?.data?.end_date) }}
                </p>
                <div>
                  <i
                    class="pi pi-calendar text-surface-400"
                    style="font-size: 12px"
                  ></i>
                </div>
              </div>

              <Reminder
                v-if="selectedTender?.data?.end_date && canCreateReminderTender"
                :entity="selectedTender?.data"
                :entity_type="'tenders'"
              />
            </div>
            <div>
              <div
                v-if="selectedTender?.data?.description"
                class="p-4 rounded-lg bg-teal-50 mb-6"
              >
                <div class="text-lg font-semibold">Descrizione</div>
                <div class="indent-4 pt-1">
                  {{ selectedTender?.data?.description }}
                </div>
              </div>
              <!-- <Panel header="Descrizione" toggleable>
              <div id="show-description">
                {{ selectedTender?.data?.description }}
              </div>
            </Panel> -->
              <Panel header="File" toggleable v-if="canViewFileTender">
                <div class="flex flex-col">
                  <div v-if="selectedTender?.data?.files">
                    <Files
                      :showActions="canManageFileTender"
                      :entityFiles="selectedTender.data.files"
                      @reloadFiles="(id) => handleReloadFiles(id)"
                    ></Files>
                  </div>
                  <div class="flex justify-between">
                    <FileUpload
                      v-if="canUploadFileTender"
                      mode="basic"
                      name="file"
                      :maxFileSize="1000000"
                      :multiple="true"
                      customUpload
                      chooseLabel="Carica altri file"
                      class="p-button-outlined"
                      @select="
                        (event) => onFileSelect(event, selectedTender.key)
                      "
                      auto
                      severity="secondary"
                    />
                  </div>
                </div>
              </Panel>
              <Panel
                v-if="
                  selectedTender?.data?.workflow &&
                  selectedTender?.data?.workflow?.phases
                "
                header="Fasi del workflow"
                class="mt-6"
                toggleable
              >
                <Accordion
                  multiple
                  expandIcon="pi pi-plus"
                  collapseIcon="pi pi-minus"
                >
                  <AccordionPanel
                    v-for="phase in selectedTender.data.workflow.phases"
                    :key="phase.id"
                    :value="phase.id"
                  >
                    <AccordionHeader>
                      <span class="flex items-center gap-2 w-full">
                        <span class="font-bold whitespace-nowrap">{{
                          phase.name
                        }}</span>
                        <Badge
                          :value="phase.segments.length"
                          class="ml-auto mr-2"
                        />
                      </span>
                    </AccordionHeader>
                    <AccordionContent>
                      <ul>
                        <li v-for="segment in phase.segments" :key="segment.id">
                          {{ segment.name }} ({{ segment.type }})
                        </li>
                      </ul>
                    </AccordionContent>
                  </AccordionPanel>
                </Accordion>
              </Panel>
            </div>
          </div>
          <Notes
            v-if="canViewNoteTender"
            :showEdit="canManageNoteTender"
            :entity="selectedTender?.data"
            :entity_type="'Tender'"
            :entity_download="'tenders'"
            @reloadEntity="fetchSingleTender(selectedTender?.data?.id)"
            class="w-full md:w-4/12 h-fit"
          />
        </div>
      </Dialog>

      <!-- New Tender Modal -->
      <Dialog
        v-model:visible="newTenderModal"
        header="Crea nuovo bando"
        :modal="true"
        :mask="true"
      >
        <div class="card grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div class="flex gap-4 col-span-2">
            <div class="flex flex-col flex-1 gap-1">
              <FloatLabel variant="on" class="w-full">
                <InputText
                  id="name"
                  class="w-full"
                  v-model="newTender.name"
                  :class="{ 'p-invalid': v$.name.$error }"
                />
                <label for="name">Nome</label>
              </FloatLabel>
              <span v-if="v$.name.$error" class="text-red-500 text-sm">
                {{ v$.name.$errors[0].$message }}
              </span>
            </div>
          </div>

          <div class="flex items-center gap-4 col-span-2">
            <FloatLabel variant="on" class="w-full">
              <Textarea
                id="description"
                class="w-full"
                v-model="newTender.description"
                rows="5"
                cols="30"
                style="resize: none"
              />
              <label for="description">Descrizione</label>
            </FloatLabel>
          </div>

          <div class="flex gap-4 col-span-2">
            <div class="flex flex-col gap-1">
              <div class="flex items-center gap-4">
                <FloatLabel variant="on">
                  <DatePicker
                    id="start_date"
                    v-model="newTender.start_date"
                    dateFormat="dd.mm.yy"
                  />
                  <label for="start_date">Data Inizio</label>
                </FloatLabel>
                <FloatLabel variant="on">
                  <DatePicker
                    id="end_date"
                    v-model="newTender.end_date"
                    dateFormat="dd.mm.yy"
                    :class="{ 'p-invalid': v$.end_date.$error }"
                  />
                  <label for="end_date">Data Fine</label>
                </FloatLabel>
                <!--
                <div v-if="newTender.end_date">
                    <Reminder :entity="newTender" :entity_type="'tenders'" />
                    <Button
                    type="button"
                    icon="pi pi-bell"
                    outlined
                    @click="showReminderDialog = true"
                    </div>
                    />-->
              </div>
              <span v-if="v$.end_date.$error" class="text-red-500 text-sm">
                {{ v$.end_date.$errors[0].$message }}
              </span>
            </div>
          </div>

          <div class="flex items-center gap-4 col-span-2">
            <FloatLabel class="w-full" variant="on">
              <Select
                id="workflow_id"
                v-model="newTender.workflow_id"
                showClear
                :options="workflows"
                optionLabel="name"
                optionValue="id"
                class="w-full"
              />
              <label for="workflow_id">Flusso di Lavoro</label>
            </FloatLabel>
          </div>

          <div class="flex justify-end gap-4 col-span-2">
            <Button
              label="Crea bando"
              icon="pi pi-check"
              @click="saveNewTender"
            />
          </div>
          <div
            v-if="saving"
            class="absolute inset-0 flex items-center justify-center bg-white/50 z-10 rounded-md"
          >
            <ProgressSpinner />
          </div>
        </div>
      </Dialog>

      <!-- Edit Tender Modal -->
      <Dialog
        v-model:visible="editTenderModal"
        header="Modifica Bando"
        :modal="true"
        :mask="true"
      >
        <div class="card grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div class="flex gap-4 col-span-2">
            <div class="flex flex-col flex-1 gap-1">
              <FloatLabel variant="on" class="w-full">
                <InputText
                  id="name"
                  class="w-full"
                  v-model="selectedTender.data.name"
                  :class="{ 'p-invalid': v$.name.$error }"
                />
                <label for="name">Nome</label>
              </FloatLabel>
              <span v-if="v$.name.$error" class="text-red-500 text-sm">
                {{ v$.name.$errors[0].$message }}
              </span>
            </div>
          </div>

          <div class="flex items-center gap-4 col-span-2">
            <FloatLabel variant="on" class="w-full">
              <Textarea
                id="description"
                class="w-full"
                v-model="selectedTender.data.description"
                rows="5"
                cols="30"
                style="resize: none"
              />
              <label for="description">Descrizione</label>
            </FloatLabel>
          </div>

          <div class="flex gap-4 col-span-2">
            <div class="flex flex-col gap-1">
              <div class="flex items-center gap-4">
                <FloatLabel variant="on">
                  <DatePicker
                    id="start_date"
                    v-model="selectedTender.data.start_date"
                    dateFormat="dd.mm.yy"
                  />
                  <label for="start_date">Data Inizio</label>
                </FloatLabel>
                <FloatLabel variant="on">
                  <DatePicker
                    id="end_date"
                    v-model="selectedTender.data.end_date"
                    dateFormat="dd.mm.yy"
                    :class="{ 'p-invalid': v$.end_date.$error }"
                  />
                  <label for="end_date">Data Fine</label>
                </FloatLabel>
                <!--
                <div v-if="selectedTender.data.end_date">
                  <Reminder
                    :entity="selectedTender?.data"
                    :entity_type="'tenders'"
                  />
                </div>
                -->
              </div>
              <span v-if="v$.end_date.$error" class="text-red-500 text-sm">
                {{ v$.end_date.$errors[0].$message }}
              </span>
            </div>
          </div>

          <!--
          <div class="flex gap-4 col-span-2">
            <div class="flex items-center gap-4">
              <FloatLabel variant="on">
                <DatePicker
                  id="start_date"
                  v-model="selectedTender.data.start_date"
                  dateFormat="dd.mm.yy"
                />
                <label for="start_date">Data Inizio</label>
              </FloatLabel>
            </div>

            <div class="flex items-center gap-4">
              <FloatLabel variant="on">
                <DatePicker
                  id="end_date"
                  v-model="selectedTender.data.end_date"
                  dateFormat="dd.mm.yy"
                />
                <label for="end_date">Data Fine</label>
              </FloatLabel>
            </div>

            <div v-if="selectedTender.data.end_date" class="mr-2">
              <Reminder
                :entity="selectedTender?.data"
                :entity_type="'tenders'"
              />
               <Button
                type="button"
                icon="pi pi-bell"
                outlined
                @click="(showReminderDialog = true), setMinMaxDate()"
              />
            </div>
          </div>
        -->

          <div class="flex items-center gap-4 col-span-2">
            <FloatLabel class="w-full" variant="on">
              <Select
                id="workflow_id"
                v-model="selectedTender.data.workflow_id"
                showClear
                :options="workflows"
                optionLabel="name"
                optionValue="id"
                class="w-full"
              />
              <label for="workflow_id">Flusso di Lavoro</label>
            </FloatLabel>
          </div>

          <div
            v-if="showWorkflowRefreshSwitch"
            class="col-span-2 p-3 border border-yellow-300 rounded-md bg-yellow-50"
          >
            <div class="flex items-center gap-2 mb-2">
              <span class="text-sm font-medium text-surface-700">
                Regole di sincronizzazione
              </span>
              <i
                class="pi pi-info-circle text-surface-500 cursor-help"
                v-tooltip.top="{
                  value:
                    'Il bando può essere riallineato all ultima versione del workflow. Se scegli anche le pratiche collegate, l aggiornamento viene applicato a tutte.',
                  showDelay: 120,
                }"
              ></i>
            </div>
            <div class="flex items-start gap-2">
              <i class="pi pi-exclamation-triangle text-yellow-600 mt-1"></i>
              <span class="text-yellow-800 text-sm leading-6">
                È disponibile una nuova versione del gruppo di fasi.
              </span>
            </div>

            <div class="flex items-center gap-2 mt-3">
              <Checkbox
                v-model="update_workflow"
                binary
                inputId="update_workflow"
                class="warning-checkbox"
              />
              <label for="update_workflow" class="text-sm text-surface-700">
                Usa la versione più recente
              </label>
            </div>

            <div v-if="update_workflow" class="flex items-center gap-2 mt-2">
              <Checkbox
                v-model="update_related_allocations"
                binary
                inputId="update_related_allocations"
                class="warning-checkbox"
              />
              <label
                for="update_related_allocations"
                class="text-sm text-surface-700"
              >
                Aggiorna anche tutte le pratiche collegate
              </label>
            </div>

            <div
              v-if="update_workflow && update_related_allocations"
              class="mt-3 p-2 border border-red-300 rounded bg-red-50 text-red-700 text-sm"
            >
              Attenzione: questa azione aggiornerà tutte le pratiche collegate a
              questo bando.
            </div>
          </div>

          <div class="col-span-2">
            <div v-if="selectedTender.data.files">
              <Files
                :entityFiles="selectedTender.data.files"
                @reloadFiles="(id) => handleReloadFiles(id)"
              ></Files>
            </div>
            <div class="flex justify-start">
              <FileUpload
                v-if="canUploadFileTender"
                mode="basic"
                name="file"
                :maxFileSize="1000000"
                :multiple="true"
                customUpload
                chooseLabel="Carica altri file"
                class="p-button-outlined"
                @select="(event) => onFileSelect(event, selectedTender.key)"
                auto
                severity="secondary"
              />
            </div>
          </div>

          <div class="flex justify-end gap-4 col-span-2">
            <Button
              label="Aggiorna bando"
              icon="pi pi-check"
              @click="saveEditedTender"
            />
          </div>
        </div>
        <div
          v-if="saving"
          class="absolute inset-0 flex items-center justify-center bg-white/50 z-10 rounded-md"
        >
          <ProgressSpinner />
        </div>
      </Dialog>

      <Dialog
        v-model:visible="showReminderDialog"
        :modal="true"
        header="Aggiungi promemoria"
      >
        <div class="w-[25rem] pb-4">
          Scegli una data prima del fine del bando per aggiungere un promemoria
          al calendario
        </div>
        <div class="flex justify-center">
          <DatePicker
            inline
            id="reminder_date"
            dateFormat="yy-mm-dd"
            v-model="reminderDate"
            :minDate="minDate"
            :maxDate="maxDate"
          />
        </div>
        <div class="flex justify-end mt-4">
          <Button
            label="Salva"
            severity="success"
            outlined
            icon="pi pi-check"
            class="p-button-primary"
            @click="saveReminderDate"
          />
        </div>
      </Dialog>

      <!--      <Dialog-->
      <!--    :header="'Note bando'"-->
      <!--    v-model:visible="showNotesDialog"-->
      <!--    :modal="true"-->
      <!--    :closable="false"-->
      <!--    :style="{ width: '60vw' }"-->
      <!--  >-->
      <!--    <div class="w-full flex justify-end flex-col">-->
      <!--      <div class="card flex justify-center w-full">-->
      <!--        {{ selectedTender.data.notes }}-->
      <!--        <Listbox-->
      <!--          v-model="selectedNote"-->
      <!--          :options="notes"-->
      <!--          optionLabel="label"-->
      <!--          class="w-full"-->
      <!--        />-->
      <!--      </div>-->
      <!--      <div class="w-full m flex flex-col p-4">-->
      <!--        <p>Nuova nota:</p>-->
      <!--        <Textarea v-model="newNote" rows="3" cols="30" />-->
      <!--        <div class="w-full flex justify-end">-->
      <!--          <Button-->
      <!--            label="Aggiungi nota +"-->
      <!--            icon="pi pi-clipboard"-->
      <!--            class="p-button-secondary"-->
      <!--            @click="-->
      <!--              () => {-->
      <!--                selectedTender.data.notes.push({ label: newNote, value: newNote });-->
      <!--                newNote = null;-->
      <!--              }-->
      <!--            "-->
      <!--          />-->
      <!--        </div>-->
      <!--      </div>-->
      <!--      <div class="w-full flex justify-end p-4">-->
      <!--        <Button-->
      <!--          label="Torna alla pratica"-->
      <!--          icon="pi pi-clipboard"-->
      <!--          class="p-button-secondary"-->
      <!--          @click="-->
      <!--            () => {-->
      <!--              showTenderModal = false;-->
      <!--              showPhasesDialog = true;-->
      <!--            }-->
      <!--          "-->
      <!--        />-->
      <!--      </div>-->
      <!--    </div>-->
      <!--  </Dialog>-->
    </div>
  </div>
</template>

<script setup>
defineOptions({
  inheritAttrs: false,
});

import { ref, onMounted, watch, reactive, computed } from "vue";
import TreeTable from "primevue/treetable";
import Column from "primevue/column";
import Button from "primevue/button";
import Dialog from "primevue/dialog";
import InputText from "primevue/inputtext";
import Textarea from "primevue/textarea";
import DatePicker from "primevue/datepicker";
import Select from "primevue/select";
import Accordion from "primevue/accordion";
import AccordionPanel from "primevue/accordionpanel";
import AccordionHeader from "primevue/accordionheader";
import AccordionContent from "primevue/accordioncontent";
import FloatLabel from "primevue/floatlabel";
import Badge from "primevue/badge";
import { useStore } from "@/store";
import apiClient from "@/router/apiClient";
import { useConfirm } from "primevue/useconfirm";
import FileUpload from "primevue/fileupload";
import { useToast } from "primevue/usetoast";
import Notes from "@/components/Notes.vue";
import Reminder from "@/components/Reminder.vue";
import Card from "primevue/card";
import { useRoute, useRouter } from "vue-router";
import Files from "@/components/Files.vue";
import Panel from "primevue/panel";
import { formatDate, formatDateIso } from "@/utils/dateUtils";
import IconField from "primevue/iconfield";
import useVuelidate from "@vuelidate/core";
import { required, helpers } from "@vuelidate/validators";
import InputIcon from "primevue/inputicon";
import ProgressSpinner from "primevue/progressspinner";
import Checkbox from "primevue/checkbox";
import { usePermissions } from "@/composables/usePermissions";

const store = useStore();
const tenders = ref([]);
const totalRecords = ref(0);
const perPage = ref(20);
const first = ref(0);
const sortField = ref(null);
const sortOrder = ref(null);
const message = ref("");
const expandedKeys = ref({});
const toggleFilters = ref(true);
const update_workflow = ref(false);
const update_related_allocations = ref(false);
const filters = reactive({
  global: "",
  name: "",
  description: "",
  workflow_name: "",
  start_date: null,
  end_date: null,
});
const loading = ref(false);
const workflows = ref([]);
const toast = useToast();
const showTenderModal = ref(false);
const reminderDate = ref("");
const showReminderDialog = ref(false);
const minDate = ref(null);
const maxDate = ref(null);
// const showNotesDialog = ref(false)
const newTenderModal = ref(false);
const editTenderModal = ref(false);
const selectedTender = ref(null);
const confirm = useConfirm();
const isMobile = ref(false);
const saving = ref(false);

const route = useRoute();
const router = useRouter();

const checkScreenSize = () => {
  isMobile.value = window.innerWidth < 500;
};

const clearFilter = (key) => {
  filters[key] = null;
  first.value = 0;
  onFilter();
};

const confirmDeleteTender = (tender) => {
  selectedTender.value = tender;
  confirm.require({
    message: "Sei sicuro di voler eliminare questo bando?",
    header: "Conferma eliminazione",
    icon: "pi pi-exclamation-triangle",
    acceptClass: "p-button-danger",
    rejectClass: "p-button-secondary",
    acceptLabel: "Sì",
    rejectLabel: "Annulla",
    accept: () => {
      deleteTender(tender);
    },
  });
};

const newTender = ref({
  name: "",
  description: "",
  start_date: null,
  end_date: null,
  workflow_id: null,
});

const endDateAfterStart = helpers.withMessage(
  "La data di fine deve essere successiva alla data di inizio.",
  (value, vm) => {
    if (!value || !vm.start_date) return true;
    return new Date(value) > new Date(vm.start_date);
  }
);

const rules = {
  name: {
    required: helpers.withMessage(
      "Il nome del bando è obbligatorio.",
      required
    ),
  },
  end_date: {
    endDateAfterStart,
  },
};

const vNewTender = useVuelidate(rules, newTender);
const vSelectedTender = useVuelidate(
  rules,
  computed(() => selectedTender.value?.data || {})
);

const v$ = computed(() =>
  newTenderModal.value ? vNewTender.value : vSelectedTender.value
);

const resetTender = () => {
  newTender.value = {
    name: "",
    description: "",
    start_date: null,
    end_date: null,
    workflow_id: null,
  };
  v$.value.$reset();
};

const fetchSingleTender = async (tenderId) => {
  try {
    const response = await apiClient.get(`${store.api}/tenders/${tenderId}`, {
      headers: { Authorization: `Bearer ${store.token}` },
    });

    const updatedTender = response.data.data;

    const index = tenders.value.findIndex((tender) => tender.key === tenderId);

    if (index !== -1) {
      tenders.value[index].data = {
        id: updatedTender.id,
        name: updatedTender.name,
        description: updatedTender.description,
        start_date: updatedTender.start_date
          ? new Date(updatedTender.start_date)
          : null,
        end_date: updatedTender.end_date
          ? new Date(updatedTender.end_date)
          : null,
        files: updatedTender.files,
        created_at: updatedTender.created_at,
        updated_at: updatedTender.updated_at,
        workflow: updatedTender.workflow,
        workflow_data: updatedTender.workflow_data,
        workflow_id: updatedTender.workflow_id,
        workflow_version_id: updatedTender.workflow_version_id,
        notes: updatedTender.notes,
      };

      if (selectedTender.value && selectedTender.value.key === tenderId) {
        selectedTender.value.data = tenders.value[index].data;
      }
    }
  } catch (error) {
    console.error("Error fetching single tender:", error);
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
  fetchTenders();
};

const onSort = (event) => {
  sortField.value = event.sortField;
  sortOrder.value = event.sortOrder;
  fetchTenders();
};

const onFilter = () => {
  loading.value = true;
  first.value = 0;
  fetchTenders();
};

const fetchTenders = async () => {
  if (!canViewTender.value) {
    tenders.value = [];
    totalRecords.value = 0;
    message.value = "Non hai i permessi per visualizzare i bandi.";
    loading.value = false;
    return;
  }

  const page = Math.floor(first.value / perPage.value) + 1;
  const params = {
    search: filters.global || null,
    name: filters.name || null,
    description: filters.description || null,
    workflow_name: filters.workflow_name || null,
    start_date: formatDateIso(filters.start_date) || null,
    end_date: formatDateIso(filters.end_date) || null,
    per_page: perPage.value,
    page: page,
    by: sortField.value || null,
    desc: sortOrder.value === -1 ? 1 : 0,
  };
  try {
    const response = await apiClient.get(`${store.api}/tenders`, {
      params,
      headers: { Authorization: `Bearer ${store.token}` },
    });

    if (response.data.data.length === 0) {
      message.value = "Nessun dato sui bandi ancora disponibile.";
      tenders.value = [];
    } else {
      tenders.value = response.data.data.map((tender) => ({
        key: tender.id,
        data: {
          id: tender.id,
          name: tender.name,
          description: tender.description,
          start_date: tender.start_date ? new Date(tender.start_date) : null,
          end_date: tender.end_date ? new Date(tender.end_date) : null,
          files: tender.files,
          created_at: tender.created_at,
          updated_at: tender.updated_at,
          workflow: tender.workflow,
          workflow_data: tender.workflow_data,
          workflow_id: tender.workflow_id,
          workflow_version_id: tender.workflow_version_id,
          notes: tender.notes,
        },
      }));
      totalRecords.value = response.data.meta.total;
    }
  } catch (error) {
    if (error.response && error.response.status === 404) {
      message.value = "Nessun dato sui bandi ancora disponibile.";
    } else {
      console.error("Error fetching tenders:", error);
    }
  }
  loading.value = false;
};

const fetchWorkflows = async () => {
  if (!canViewWorkflow.value) {
    workflows.value = [];
    return;
  }

  try {
    const response = await apiClient.get(`${store.api}/phases/workflows`, {
      headers: { Authorization: `Bearer ${store.token}` },
    });

    workflows.value = response.data.data;
  } catch (error) {
    console.error("Error fetching workflows:", error);
  }
};

onMounted(async () => {
  loading.value = true;
  checkScreenSize();
  await fetchTenders();
  await fetchWorkflows();
  // Check if there's an ID parameter in the URL
  if (route.params.id && canViewTender.value) {
    try {
      const response = await apiClient.get(
        `${store.api}/tenders/${route.params.id}`,
        {
          headers: { Authorization: `Bearer ${store.token}` },
        }
      );

      selectedTender.value = response?.data;

      // If the tender was found, show the dialog
      if (selectedTender.value) {
        showTenderModal.value = true;
      } else {
        // Handle case where tender with provided ID doesn't exist
        toast.add({
          severity: "error",
          summary: "Errore",
          detail: "Bando non trovato",
          life: 3000,
        });
        // Redirect to the main allocations page
        router.replace({ path: "/tenders", query: route.query });
      }
    } catch (error) {
      console.error("Error fetching tender by ID:", error.message);
      toast.add({
        severity: "error",
        summary: "Errore",
        detail: "Impossibile caricare i dettagli del bando",
        life: 3000,
      });
      router.replace({ path: "/tenders", query: route.query });
    }
  }
});

const updateUrlForTender = (tenderId = null) => {
  if (tenderId) {
    router.replace({ path: `/tenders/${tenderId}`, query: route.query });
  } else {
    router.replace({ path: "/tenders", query: route.query });
  }
};

watch(showTenderModal, (newValue) => {
  if (!newValue) updateUrlForTender();
});

watch(
  () => newTender.value?.start_date,
  (newVal) => {
    if (newVal) {
      minDate.value = new Date(newVal);
    }
    if (newVal == null) {
      if (newTender.value?.end_date) {
        const min = new Date(newTender.value?.end_date);
        min.setDate(min.getDate() - 30);
        minDate.value = min;
      } else {
        minDate.value = null;
      }
    }
  }
);

watch(
  () => newTender.value?.end_date,
  (newVal) => {
    if (newVal) {
      const max = new Date(newVal);
      max.setDate(max.getDate() - 3);
      maxDate.value = max;
      if (!newTender.value?.start_date) {
        const min = new Date(newVal);
        min.setDate(min.getDate() - 30);
        minDate.value = min;
      }
    }
  }
);

const showTender = (tender) => {
  selectedTender.value = tender;
  showTenderModal.value = true;
  updateUrlForTender(tender.key);
};

const saveNewTender = async () => {
  const isValid = await v$.value.$validate();
  if (!isValid) return;
  saving.value = true;
  const payload = {
    ...newTender.value,
    start_date: formatDateIso(newTender.value.start_date),
    end_date: formatDateIso(newTender.value.end_date),
  };
  try {
    await apiClient.post(`${store.api}/tenders`, payload, {
      headers: { Authorization: `Bearer ${store.token}` },
    });
    await fetchTenders();
    newTenderModal.value = false;
  } catch (error) {
    console.error("Error saving new tender:", error);
  } finally {
    saving.value = false;
  }
};

const editTender = (tender) => {
  selectedTender.value = tender;
  update_workflow.value = false;
  update_related_allocations.value = false;
  editTenderModal.value = true;
};

const latestWorkflowVersionId = (workflowId) => {
  if (!workflowId) return null;
  const workflow = workflows.value.find(
    (w) => Number(w.id) === Number(workflowId)
  );
  if (!workflow || !workflow.latest_version_id) return null;
  return Number(workflow.latest_version_id);
};

const showWorkflowRefreshSwitch = computed(() => {
  const tender = selectedTender.value?.data;
  if (!tender?.workflow_id || !tender?.workflow_version_id) return false;

  const latest = latestWorkflowVersionId(tender.workflow_id);
  if (!latest) return false;

  return Number(tender.workflow_version_id) !== latest;
});

watch(update_workflow, (enabled) => {
  if (!enabled) {
    update_related_allocations.value = false;
  }
});

watch(showWorkflowRefreshSwitch, (visible) => {
  if (!visible) {
    update_workflow.value = false;
    update_related_allocations.value = false;
  }
});

const persistEditedTender = async () => {
  saving.value = true;
  const payload = {
    ...selectedTender.value.data,
    start_date: formatDateIso(selectedTender.value.data.start_date),
    end_date: formatDateIso(selectedTender.value.data.end_date),
    refresh_workflow_version: !!update_workflow.value,
    refresh_related_allocations:
      !!update_workflow.value && !!update_related_allocations.value,
  };
  await apiClient.put(`${store.api}/tenders/${selectedTender.value.key}`, payload, {
    headers: { Authorization: `Bearer ${store.token}` },
  });

  await fetchTenders();
  editTenderModal.value = false;
  update_workflow.value = false;
  update_related_allocations.value = false;
  v$.value.$reset();
};

const saveEditedTender = async () => {
  const isValid = await v$.value.$validate();
  if (!isValid) return;
  try {
    if (update_workflow.value && update_related_allocations.value) {
      confirm.require({
        header: "Conferma aggiornamento globale",
        message:
          "Stai aggiornando il bando e tutte le pratiche collegate. L impatto sarà su tutte le pratiche legate a questo bando. Vuoi continuare?",
        icon: "pi pi-exclamation-triangle",
        acceptLabel: "Sì, continua",
        rejectLabel: "Annulla",
        acceptClass: "p-button-danger",
        rejectClass: "p-button-secondary",
        accept: async () => {
          try {
            await persistEditedTender();
          } catch (error) {
            console.error("Error saving tender:", error);
          } finally {
            saving.value = false;
          }
        },
      });
      return;
    }

    await persistEditedTender();
  } catch (error) {
    console.error("Error saving tender:", error);
  } finally {
    saving.value = false;
  }
};

const deleteTender = async () => {
  try {
    await apiClient.delete(`${store.api}/tenders/${selectedTender.value.key}`, {
      headers: { Authorization: `Bearer ${store.token}` },
    });

    await fetchTenders();
  } catch (error) {
    console.error("Error deleting tender:", error);
  }
};

const handleReloadFiles = (fileId) => {
  selectedTender.value.data.files = selectedTender.value.data.files.filter(
    (file) => file.id !== fileId
  );
};

const MAX_FILE_SIZE = 2048 * 1024 * 1024;

const onFileSelect = async (event, tenderId) => {
  const files = event.files;
  const formData = new FormData();

  if (files.length > 0) {
    const originalEvent = event.originalEvent;
    const selectedFiles = originalEvent?.target?.files || [];
    const validFiles = [];
    const invalidFiles = [];

    for (const file of selectedFiles) {
      if (file.size > MAX_FILE_SIZE) {
        invalidFiles.push(file);
      } else {
        validFiles.push(file);
      }
    }

    if (invalidFiles.length) {
      toast.add({
        severity: "error",
        summary: "Alcuni file erano troppo grandi",
        detail: `Caricamento non riuscito per ${invalidFiles.length} file.`,
        life: 4000,
      });
    }

    files.forEach((file, index) => {
      formData.append(`files[${index}]`, file);
    });

    try {
      const response = await apiClient.post(
        `${store.api}/tenders/${tenderId}/files`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${store.token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      response.data.data.forEach((file) => {
        if (!selectedTender.value.data.files) {
          selectedTender.value.data.files = [];
        }
        selectedTender.value.data.files.push({
          id: file.id,
          link: file.link,
          name: file.name,
        });
      });

      toast.add({
        severity: "success",
        summary: "Successo",
        detail: `Caricamento riuscito per ${validFiles.length} file.`,
        life: 3000,
      });
    } catch (error) {
      console.error(
        "Error uploading file:",
        error.response?.data?.message || error.message
      );
      toast.add({
        severity: "error",
        summary: "Errore",
        detail: error.response?.data?.message || error.message,
        life: 3000,
      });
    }
  }
};

const confirmDeleteTenderFile = (tenderId, fileId) => {
  confirm.require({
    message: "Sei sicuro di voler procedere?",
    header: "Conferma",
    accept: () => deleteTenderFile(tenderId, fileId),
  });
};

const deleteTenderFile = async (tenderId, fileId) => {
  try {
    await apiClient.delete(`${store.api}/files/${fileId}`, {
      headers: { Authorization: `Bearer ${store.token}` },
    });

    const tender = tenders.value.find((t) => t.key === tenderId);

    if (tender) {
      tender.data.file = null;
    }

    toast.add({
      severity: "success",
      summary: "Successo",
      detail: `File eliminato con successo!`,
      life: 3000,
    });

    await fetchTenders();
  } catch (error) {
    console.error("Error deleting tender file:", error.message);
    toast.add({
      severity: "error",
      summary: "Errore",
      detail: `Eliminazione del file fallita.`,
      life: 3000,
    });
  }
};

const isImage = (url) => {
  return /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(url);
};

const saveReminderDate = async () => {
  // try {
  //   await apiService.postOrPutWithAuth(
  //     `allocations/${currentAllocation.value.id}/upload`,
  //     currentAllocation.value.workflow_data,
  //     false,
  //     {
  //       successMessage: "Dati delle fasi salvati con successo.",
  //       errorMessage: "Errore durante il salvataggio dei dati delle fasi.",
  //     }
  //   );
  // } catch (error) {
  //   console.error("Error saving phases data:", error.message);
  // }
};

const setMinMaxDate = () => {
  if (selectedTender.value.data.end_date) {
    const min = new Date(selectedTender.value.data.end_date);
    min.setDate(min.getDate() - 30);
    const max = new Date(selectedTender.value.data.end_date);
    max.setDate(max.getDate() - 3);

    minDate.value = selectedTender.value.data.start_date
      ? new Date(selectedTender.value.data.start_date)
      : min;
    maxDate.value = max < minDate.value ? minDate.value : max;
  }
};

let filterTimeout = null;

const debouncedFilter = (onFilter) => {
  if (filterTimeout) {
    clearTimeout(filterTimeout);
  }
  filterTimeout = setTimeout(() => {
    onFilter();
  }, 1000);
};

const { can, canAny } = usePermissions();

const canViewTender = computed(() => can("tenders.view"));
const canViewWorkflow = computed(() => can("workflows.view"));
const canManageTender = computed(() => can("tenders.manage"));
const canCreateTender = computed(() => canManageTender.value);
const canUpdateTender = computed(() => canManageTender.value);
const canDeleteTender = computed(() => can("tenders.full"));

const showTenderActionsColumn = computed(() =>
  canAny(["tenders.view", "tenders.manage", "tenders.full"])
);

const canCreateReminderTender = computed(() => can("reminders.manage"));
const canViewFileTender = computed(() => can("files.view"));
const canUploadFileTender = computed(() => can("files.manage"));
const canManageFileTender = computed(() => can("files.delete"));
const canViewNoteTender = computed(() => can("notes.view"));
const canManageNoteTender = computed(() => can("notes.manage"));
</script>

<style>
.content-page {
  padding: 20px;
  width: 100%;
}

/* Add media queries as needed */
@media (max-width: 768px) {
  .content-page {
    padding: 10px;
  }
}

.file-name {
  max-width: 150px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.p-treetable-column-header-content {
  align-items: flex-start !important;
}

.warning-checkbox .p-checkbox-box {
  border-color: #f59e0b !important;
}

.warning-checkbox.p-checkbox-checked .p-checkbox-box {
  background-color: #f59e0b !important;
  border-color: #f59e0b !important;
}

.warning-checkbox .p-checkbox-box::after {
  background-color: white !important;
  border-color: white !important;
  color: white !important;
}

@media screen and (max-width: 900px) {
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

@media screen and (max-width: 500px) {
  .header-container {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    width: 100%;
  }

  .action-buttons {
    flex-direction: row;
    align-items: center;
    gap: 0.5rem !important;
  }

  .responsive-button {
    width: auto;
    padding: 0.5rem !important;
  }

  .responsive-button .p-button-label {
    display: none;
  }

  .responsive-button .p-button-icon {
    margin-right: 0;
    font-size: 1rem;
  }
}
</style>
