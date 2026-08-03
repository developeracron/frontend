<template>
  <div class="h-full flex flex-col">
    <div
      v-if="isLoading"
      class="flex items-center justify-center w-full h-[95%]"
    >
      <ProgressSpinner />
    </div>
    <div
      v-if="isLoadingEvents"
      class="absolute inset-0 flex items-center justify-center bg-transparent z-10 rounded-md"
    >
      <ProgressSpinner />
    </div>
    <FullCalendar
      ref="calendarRef"
      class="h-full"
      :options="{ ...calendarOptions, events: events }"
    />

    <Dialog
      v-model:visible="isPopupVisible"
      header="Crea un nuovo evento"
      modal
    >
      <div class="card grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        <div class="flex items-start gap-4 col-span-2">
          <div class="flex flex-col flex-1 gap-1">
            <FloatLabel variant="on" class="w-full">
              <InputText
                v-model="eventForm.title"
                id="title"
                class="w-full"
                :class="{ 'p-invalid': v$.title.$error }"
              />
              <label for="name">Titolo</label>
            </FloatLabel>
            <span v-if="v$.title.$error" class="text-red-500 text-sm">
              <span v-for="err in v$.title.$errors" :key="err.$uid">
                {{ err.$message }}
              </span>
            </span>
          </div>
          <Button
            label="Colore"
            @click="openSelectColor"
            outlined
            severity="secondary"
            :style="{
              background: activeEventForm?.color || '#ffffff',
              'border-color': activeEventForm?.color || '#cccccc',
              color: '#334155',
            }"
          >
            <template #icon>
              <svg
                width="24"
                height="24"
                viewBox="0 0 64 64"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                class="py-2"
                style="transform: scale(2.7) translateY(0.4px)"
              >
                <circle
                  cx="32"
                  cy="22"
                  r="14"
                  stroke="#334155"
                  stroke-width="4"
                />
                <circle
                  cx="22"
                  cy="40"
                  r="14"
                  stroke="#334155"
                  stroke-width="4"
                />
                <circle
                  cx="42"
                  cy="40"
                  r="14"
                  stroke="#334155"
                  stroke-width="4"
                />
              </svg>
            </template>
          </Button>
        </div>
        <div class="flex flex-col gap-1">
          <FloatLabel variant="on" class="w-full">
            <DatePicker
              id="start_date"
              v-model="eventForm.start_date"
              showTime
              dateFormat="dd.mm.yy"
              :stepMinute="15"
              hourFormat="24"
              class="w-full"
              :class="{ 'p-invalid': v$.start_date.$error }"
            />
            <label for="start_date">Data di inizio</label>
          </FloatLabel>
          <span v-if="v$.start_date.$error" class="text-red-500 text-sm">
            Data di inizio è obbligatoria.
          </span>
        </div>
        <div class="flex flex-col gap-1">
          <FloatLabel variant="on" class="w-full">
            <DatePicker
              id="end_date"
              v-model="eventForm.end_date"
              showTime
              dateFormat="dd.mm.yy"
              :stepMinute="15"
              hourFormat="24"
              class="w-full"
              :class="{ 'p-invalid': v$.end_date.$error }"
            />
            <label for="end_date">Data di fine</label>
          </FloatLabel>
          <span v-if="v$.end_date.$error" class="text-red-500 text-sm">
            {{ v$.end_date.$errors[0].$message }}
          </span>
        </div>
        <div class="flex items-center gap-4 col-span-2">
          <Editor v-model="eventForm.description" placeholder="Descrizione" />
        </div>
        <div class="flex justify-end gap-4 col-span-2">
          <Button
            label="Annulla"
            icon="pi pi-times"
            severity="danger"
            text
            @click="isPopupVisible = false"
          />
          <Button label="Salva" icon="pi pi-check" @click="saveEvent" />
        </div>
      </div>
      <div
        v-if="saving"
        class="absolute inset-0 flex items-center justify-center bg-white/50 z-10 rounded-md"
      >
        <ProgressSpinner style="width: 50px; height: 50px" strokeWidth="4" />
      </div>
    </Dialog>

    <Dialog
      v-model:visible="isEventDetailsPopupVisible"
      :header="`${selectedEvent.title}`"
      class="min-w-[30%] max-w-[90%] md:max-w-[70%] pb-3 drop-shadow-2xl"
      modal
    >
      <div>
        <div v-if="selectedEvent.created_at" class="text-xs text-gray-400 mb-3">
          Creato il {{ selectedEvent.created_at }}
        </div>
        <div class="flex justify-between items-center">
          <div>
            <div
              v-if="
                formatDateCalendar(selectedEvent.start_date) ==
                formatDateCalendar(selectedEvent.end_date)
              "
              class="flex gap-1 items-center"
            >
              <i class="pi pi-calendar-times mr-1"></i>
              <strong class="inline first-letter:capitalize">
                {{ formatDateCalendar(selectedEvent.start_date) }}
              </strong>
              dalle
              <strong>{{ formatTime(selectedEvent.start_date) }}</strong> alle
              <strong>{{ formatTime(selectedEvent.end_date) }}</strong>
            </div>
            <div v-else>
              <i class="pi pi-calendar-times mr-1"></i>
              <strong class="inline first-letter:capitalize">
                {{ formatDateTimeCalendar(selectedEvent.start_date) }}
              </strong>
              -
              <strong class="inline first-letter:capitalize">
                {{ formatDateTimeCalendar(selectedEvent.end_date) }}
              </strong>
            </div>
            <div v-if="selectedEvent?.client?.name" class="mt-1">
              <Button
                  type="button"
                  icon="pi pi-user"
                  :label="selectedEvent.client.name"
                  severity="secondary"
                  class="header-button-link cursor-pointer"
                  text
                  :disabled="!canViewClients || !selectedEvent?.client?.id"
                  @click="goToClient(selectedEvent.client.id)"
                  v-tooltip.top="
                    !canViewClients
                      ? 'Non hai i permessi per aprire la scheda cliente'
                      : (!selectedEvent?.client?.id ? 'Cliente non disponibile' : null)
                  "
              />
            </div>
          </div>
          <div class="felx gap-2 min-w-fit">
            <Button
              v-if="canUpdateEvent"
              type="button"
              icon="pi pi-pencil"
              severity="secondary"
              text
              title="Modifica evento"
              @click="
                {
                  showEditEvent();
                }
              "
            />
            <Button
              v-if="canDeleteEvent"
              type="button"
              icon="pi pi-trash"
              severity="danger"
              text
              title="Elimina evento"
              @click="confirmDeleteEvent()"
            />

            <Button
              v-if="canExportEvent"
              type="button"
              icon="pi pi-google"
              text
              title="Esporta su Google Calendar"
              @click="exportEventToGoogle()"
            />
          </div>
        </div>
        <hr v-if="selectedEvent.description" class="my-6" />
        <div
          v-if="selectedEvent.description"
          class="flex gap-1 items-start mt-6"
        >
          <i class="pi pi-align-left mr-2 mt-1"></i>
          <div
            v-html="selectedEvent.description"
            class="pr-8 break-all whitespace-pre-wrap"
          ></div>
        </div>
        <hr v-if="canFilesView && selectedEvent.files.length" class="my-6" />
        <div v-if="canFilesView && selectedEvent.files.length">
          <Files
            :showActions="canFilesDelete"
            :entityFiles="selectedEvent?.files"
            @reloadFiles="(id) => handleReloadFiles(id)"
          ></Files>
        </div>
        <div
          v-if="saving"
          class="absolute inset-0 flex items-center justify-center bg-white/50 z-10 rounded-md"
        >
          <ProgressSpinner style="width: 50px; height: 50px" strokeWidth="4" />
        </div>
      </div>
    </Dialog>

    <Dialog
      v-model:visible="isEditEventVisible"
      :header="`Modifica ${selectedEvent.title}`"
      class="min-w-[30%] max-w-[90%] md:max-w-[70%] pb-3 drop-shadow-2xl"
      modal
    >
      <div class="card grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        <div class="flex items-start gap-4 col-span-2">
          <div class="flex flex-col flex-1 gap-1">
            <FloatLabel variant="on" class="w-full">
              <InputText
                v-model="selectedEvent.title"
                id="title"
                class="w-full"
                :class="{ 'p-invalid': vEditEvent.title.$error }"
              />
              <label for="name">Titolo</label>
            </FloatLabel>
            <span v-if="vEditEvent.title.$error" class="text-red-500 text-sm">
              <span v-for="err in vEditEvent.title.$errors" :key="err.$uid">
                {{ err.$message }}
              </span>
            </span>
          </div>
          <Button
            label="Colore"
            @click="openSelectColor"
            outlined
            severity="secondary"
            :style="{
              background: activeEventForm?.color || '#ffffff',
              'border-color': activeEventForm?.color || '#cccccc',
              color: '#334155',
            }"
          >
            <template #icon>
              <svg
                width="24"
                height="24"
                viewBox="0 0 64 64"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                class="py-2"
                style="transform: scale(2.7) translateY(0.4px)"
              >
                <circle
                  cx="32"
                  cy="22"
                  r="14"
                  stroke="#334155"
                  stroke-width="4"
                />
                <circle
                  cx="22"
                  cy="40"
                  r="14"
                  stroke="#334155"
                  stroke-width="4"
                />
                <circle
                  cx="42"
                  cy="40"
                  r="14"
                  stroke="#334155"
                  stroke-width="4"
                />
              </svg>
            </template>
          </Button>
        </div>
        <div class="flex flex-col gap-1">
          <FloatLabel variant="on" class="w-full">
            <DatePicker
              id="start_date"
              v-model="selectedEvent.start_date"
              showTime
              dateFormat="dd.mm.yy"
              :stepMinute="15"
              hourFormat="24"
              class="w-full"
              :class="{ 'p-invalid': vEditEvent.start_date.$error }"
            />
            <label for="start_date">Data di inizio</label>
          </FloatLabel>
          <span
            v-if="vEditEvent.start_date.$error"
            class="text-red-500 text-sm"
          >
            Data di inizio è obbligatoria.
          </span>
        </div>
        <div class="flex flex-col gap-1">
          <FloatLabel variant="on" class="w-full">
            <DatePicker
              id="end_date"
              v-model="selectedEvent.end_date"
              showTime
              dateFormat="dd.mm.yy"
              :stepMinute="15"
              hourFormat="24"
              class="w-full"
              :class="{ 'p-invalid': vEditEvent.end_date.$error }"
            />
            <label for="end_date">Data di fine</label>
          </FloatLabel>
          <span v-if="vEditEvent.end_date.$error" class="text-red-500 text-sm">
            {{ vEditEvent.end_date.$errors[0].$message }}
          </span>
        </div>
        <div class="flex items-center gap-4 col-span-2">
          <Editor
            v-model="selectedEvent.description"
            placeholder="Descrizione"
          />
        </div>
        <div
          v-if="canFilesView && selectedEvent?.files.length"
          class="max-h-[400px] overflow-auto"
        >
          <Files
            :showActions="canFilesDelete"
            :entityFiles="selectedEvent?.files"
            @reloadFiles="(id) => handleReloadFiles(id)"
          ></Files>
        </div>
        <div
          v-else
          class="text-sm w-full h-full flex justify-center items-center italic"
        >
          Nessun file allegato
        </div>
        <div v-if="canFilesManage" class="flex justify-between pt-2">
          <div
            class="min-h-[152px] w-full bg-[#00000005] border border-dashed border-[#D9D9D9] rounded-md flex items-center justify-center flex-col relative upload-style"
            :class="dragOver ? 'outline-dashed outline-teal-500' : ''"
            @dragover="onDragOver"
            @dragleave="onDragLeave"
            @drop="onDrop"
          >
            <i class="pi pi-inbox text-teal-500" style="font-size: 28px"></i>
            <div class="my-2 text-sm text-[#000000E0]">
              Trascina qui i tuoi file
            </div>
            <FileUpload
              mode="basic"
              name="file"
              :multiple="true"
              customUpload
              chooseLabel="Carica"
              chooseIcon="pi pi-upload !text-[12px]"
              class="p-button-outlined p-button-secondary !text-sm !bg-white !px-4 !py-[6px]"
              @select="onFileSelectEvent"
              auto
            />
          </div>
        </div>
        <div class="flex justify-end gap-4 col-span-2">
          <Button
            label="Annulla"
            icon="pi pi-times"
            severity="danger"
            text
            @click="isEditEventVisible = false"
          />
          <Button label="Salva" icon="pi pi-check" @click="saveEditEvent" />
        </div>
      </div>
    </Dialog>
    <Popover ref="op">
      <div class="flex flex-col gap-4">
        <div class="grid grid-cols-3 gap-2">
          <div
            v-for="color in colors"
            :key="color"
            :style="{ backgroundColor: color }"
            class="color-circle"
            :class="{ selected: color === activeEventForm.color }"
            @click="selectColor(color)"
          ></div>
        </div>
      </div>
    </Popover>
    <Popover ref="filtersPop">
      <div class="flex flex-col gap-4" style="min-width: 280px;">
        <!-- Toggle esistente: Tutti / I miei -->
        <div v-if="canViewAllEvents" class="flex justify-center">
          <div
            class="flex items-center gap-2 bg-[#e8e8e8] px-1 py-[0.3rem] rounded-full"
          >
            <span
              @click="
                showMyEventsOnly = false;
                reloadCurrentRange();
              "
              :class="[
                'px-3 py-2 text-sm font-medium rounded-full transition-all duration-300 ease-in-out',
                !showMyEventsOnly
                  ? 'bg-white text-black cursor-default pointer-events-none'
                  : 'text-black cursor-pointer',
              ]"
            >
              Tutti eventi
            </span>
            <span
              @click="
                showMyEventsOnly = true;
                reloadCurrentRange();
              "
              :class="[
                'cursor-pointer px-3 py-2 text-sm font-medium rounded-full transition-all duration-300 ease-in-out',
                showMyEventsOnly
                  ? 'bg-white text-black cursor-default pointer-events-none'
                  : 'text-black cursor-pointer',
              ]"
            >
              I miei eventi
            </span>
          </div>
        </div>

        <!-- Separatore -->
        <hr class="border-gray-200" />

        <!-- Ricerca testuale -->
        <div class="flex flex-col gap-1">
          <label class="text-xs text-gray-500 font-medium">Cerca</label>
          <InputText
            v-model="filterQ"
            placeholder="Titolo o descrizione..."
            size="small"
            class="w-full"
            @input="onFilterInput"
          />
        </div>

        <!-- Range date -->
        <div class="flex flex-col gap-1">
          <label class="text-xs text-gray-500 font-medium">Periodo</label>
          <div class="flex gap-2">
            <DatePicker
              v-model="filterDateFrom"
              placeholder="Da"
              dateFormat="dd/mm/yy"
              class="flex-1"
              @update:modelValue="runSearch"
            />
            <DatePicker
              v-model="filterDateTo"
              placeholder="A"
              dateFormat="dd/mm/yy"
              class="flex-1"
              @update:modelValue="runSearch"
            />
          </div>
        </div>

        <!-- Colori -->
        <div class="flex flex-col gap-1">
          <label class="text-xs text-gray-500 font-medium">Colore</label>
          <div class="flex flex-wrap gap-1">
            <button
              v-for="color in CALENDAR_SEARCH_COLORS"
              :key="color.value"
              type="button"
              :title="color.label"
              class="w-6 h-6 rounded-full border-2 transition-transform hover:scale-110"
              :style="{
                backgroundColor: color.value,
                borderColor: filterColors.includes(color.value) ? '#334155' : 'transparent',
              }"
              @click="toggleFilterColor(color.value)"
            />
          </div>
        </div>

        <!-- Reset -->
        <div v-if="hasActiveFilters" class="flex justify-end">
          <button
            type="button"
            class="text-xs text-blue-500 hover:underline cursor-pointer"
            @click="resetFilters"
          >
            Reset filtri
          </button>
        </div>
      </div>
    </Popover>
    <Dialog
      v-model:visible="googleSyncDialogVisible"
      header="Sincronizza Google Calendar"
      :modal="true"
      :style="{ width: '28rem' }"
    >
      <div class="flex flex-col gap-5">
        <div class="flex flex-col">
          <div class="flex items-center gap-3">
            <RadioButton inputId="sync-week" value="week" v-model="syncType" />
            <label for="sync-week" class="font-medium text-gray-800">
              Settimana corrente
            </label>
          </div>
          <small class="text-gray-500 pl-8 mt-1 text-sm">
            {{ formatDisplayDate(weekRange.from) }} –
            {{ formatDisplayDate(weekRange.to) }}
          </small>
        </div>

        <div class="flex flex-col">
          <div class="flex items-center gap-3">
            <RadioButton
              inputId="sync-month"
              value="month"
              v-model="syncType"
            />
            <label for="sync-month" class="font-medium text-gray-800">
              Mese corrente
            </label>
          </div>
          <small class="text-gray-500 pl-8 mt-1 text-sm">
            {{ formatDisplayDate(monthRange.from) }} –
            {{ formatDisplayDate(monthRange.to) }}
          </small>
        </div>

        <div class="flex flex-col">
          <div class="flex items-center gap-3">
            <RadioButton
              inputId="sync-custom"
              value="custom"
              v-model="syncType"
            />
            <label for="sync-custom" class="font-medium text-gray-800">
              Intervallo personalizzato
            </label>
          </div>

          <div
            v-if="syncType === 'custom'"
            class="grid grid-cols-2 gap-3 pl-8 mt-2"
          >
            <FloatLabel variant="on" class="w-full">
              <DatePicker
                id="sync_from"
                v-model="customRange.from"
                dateFormat="dd.mm.yy"
                class="w-full"
              />
              <label for="sync_from">Dal</label>
            </FloatLabel>

            <FloatLabel variant="on" class="w-full">
              <DatePicker
                id="sync_to"
                v-model="customRange.to"
                dateFormat="dd.mm.yy"
                class="w-full"
              />
              <label for="sync_to">Al</label>
            </FloatLabel>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-2">
          <Button
            label="Annulla"
            icon="pi pi-times"
            severity="danger"
            text
            @click="googleSyncDialogVisible = false"
          />
          <Button
            label="Sincronizza"
            icon="pi pi-check"
            @click="confirmGoogleSync"
          />
        </div>
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed, nextTick, watch } from "vue";
import { useRouter } from "vue-router";
import apiClient from "@/router/apiClient";
import FullCalendar from "@fullcalendar/vue3";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import itLocale from "@fullcalendar/core/locales/it";
import { useToast } from "primevue/usetoast";
import Dialog from "primevue/dialog";
import Editor from "primevue/editor";
import FloatLabel from "primevue/floatlabel";
import InputText from "primevue/inputtext";
import Button from "primevue/button";
import DatePicker from "primevue/datepicker";
import Popover from "primevue/popover";
import { useStore } from "@/store";
import ProgressSpinner from "primevue/progressspinner";
import RadioButton from "primevue/radiobutton";
import { formatDateCalendar } from "@/utils/dateUtils";
import {
  formatTime,
  formatDateIso,
  formatDateTimeCalendar,
} from "@/utils/dateUtils";
import useVuelidate from "@vuelidate/core";
import { required, maxLength, helpers } from "@vuelidate/validators";
import { useConfirm } from "primevue/useconfirm";
import Files from "@/components/Files.vue";
import luxonPlugin from "@fullcalendar/luxon3";
import { DateTime } from "luxon";
import FileUpload from "primevue/fileupload";
import { usePermissions } from "@/composables/usePermissions";

const props = defineProps({
  hideToday: { type: Boolean, default: false },
});

const router = useRouter();
const store = useStore();
const message = ref("");
const confirm = useConfirm();
const daysInterval = ref(7);
const monthsInterval = ref(1);
const reminderDate = ref(null);
const minDate = ref(null);
const maxDate = ref(null);
const disabledDates = ref([]); //array of the dates where a reminder was already set
const saving = ref(false);
const isForbidden = ref(false);
const TZ = "Europe/Rome";
const MAX_FILE_SIZE = 2048 * 1024 * 1024;
const CALENDAR_CONTEXT_KEY = "calendar:return-context";

const { can } = usePermissions();

const canViewEvents = computed(() => can("events.view"));

const canCreateEvent = computed(() => can("events.manage"));
const canUpdateEvent = computed(() => can("events.manage"));
const canDeleteEvent = computed(() => can("events.delete"));

const canExportEvent = computed(() => can("events-settings.calendar-owner"));
const canSyncEvent = computed(() => can("events-settings.full"));

const canViewClients = computed(() => can("clients.view"));
const canFilesView = computed(() => can("files.view"));
const canFilesManage = computed(() => can("files.manage"));
const canFilesDelete = computed(() => can("files.delete"));

const canViewAllEvents = computed(() => can("allocations.scope.any"));


const isDateOnly = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s);
const toLocalISODate = (s) =>
  isDateOnly(s)
    ? s
    : DateTime.fromISO(s, { zone: "utc" }).setZone(TZ).toISODate();

function isAllDayEvent(startStr, endStr) {
  if (isDateOnly(startStr) || isDateOnly(endStr)) return true;

  const s = DateTime.fromISO(startStr, { zone: "utc" }).setZone(TZ);
  const e = DateTime.fromISO(endStr, { zone: "utc" }).setZone(TZ);
  const sMid = s.startOf("day");
  const eMid = e.startOf("day");
  const durMs = e.toMillis() - s.toMillis();

  return (
    s.equals(sMid) &&
    e.equals(eMid) &&
    durMs > 0 &&
    durMs % (24 * 3600 * 1000) === 0
  );
}

const toIsoUtc = (d) => new Date(d).toISOString();
const fromIso = (s) => (s ? new Date(s) : null);

const rightToolbar = computed(() => {
  const viewButtons = ["dayGridMonth", "timeGridWeek", "timeGridDay"];
  const actionButtons = [];

  if (canSyncEvent.value) actionButtons.push("googleSync");
  actionButtons.push("filterEvents");
  if (canCreateEvent.value) actionButtons.push("addEvent");

  return [viewButtons.join(","), actionButtons.join(" ")]
    .filter(Boolean)
    .join(" ");
});

const calendarOptions = ref({
  height: "parent",
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin, luxonPlugin],
  initialView: "timeGridWeek",
  allDaySlot: true,
  dayMaxEvents: 3,
  moreLinkClick: "popover",
  locale: itLocale,
  timeZone: "Europe/Rome",
  timeZoneImpl: "luxon",
  eventTimeFormat: { hour: "2-digit", minute: "2-digit", hour12: false },
  customButtons: {
    addEvent: {
      text: "Aggiungi evento",
      click() {
        showEventPopup(null);
        v$.value.$reset();
      },
    },
    filterEvents: {
      text: "Filtra",
      click(event) {
        openFilters(event);
      },
    },
    googleSync: {
      text: "Sync Google",
      click() {
        handleGoogleCalendarEvents();
      },
    },
  },
  headerToolbar: {
    left: "prev next title" + (props.hideToday ? "" : " today"),
    right: rightToolbar.value,
  },
  editable: true,
  selectable: true,
  droppable: true,
  eventDrop: handleEventDrop,
  dateClick: handleDateClick,
  eventClick: handleEventClick,
  datesSet: handleCalendarDatesSet,
  eventContent: (arg) => {
    const ageLabel = arg.event.extendedProps?.age_label;
    return {
      html: `<div class="fc-event-main-frame" style="overflow:hidden;">
        <div class="fc-event-title-container">
          <div class="fc-event-title fc-sticky" style="font-size:0.8em;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
            ${arg.event.title ? arg.event.title.replace(/</g, '&lt;').replace(/>/g, '&gt;') : ''}
          </div>
          ${ageLabel ? `<div style="font-size:0.68em;color:rgba(0,0,0,0.55);margin-top:1px;white-space:nowrap;">${ageLabel}</div>` : ''}
        </div>
      </div>`,
    };
  },
});

const googleSyncDialogVisible = ref(false);
const syncType = ref("week");
const weekRange = ref({ from: "", to: "" });
const monthRange = ref({ from: "", to: "" });
const customRange = ref({ from: null, to: null });

const clientOptions = ref([]);
const selectedClient = ref();

const toast = useToast();

const filtersPop = ref();
const showMyEventsOnly = ref(false);

// --- Meilisearch filters ---
const filterQ = ref('');
const filterDateFrom = ref(null);
const filterDateTo = ref(null);
const filterColors = ref([]);
const isFiltering = ref(false);
let filterDebounceTimer = null;

const CALENDAR_SEARCH_COLORS = [
  { label: 'Grigio',         value: '#cbd5e1' },
  { label: 'Rosa',           value: '#fca5a5' },
  { label: 'Arancio',        value: '#fdba74' },
  { label: 'Giallo',         value: '#fde047' },
  { label: 'Verde',          value: '#86efac' },
  { label: 'Azzurro chiaro', value: '#bae6fd' },
  { label: 'Azzurro',        value: '#7dd3fc' },
  { label: 'Viola',          value: '#d8b4fe' },
  { label: 'Rosa chiaro',    value: '#f9a8d4' },
];

const hasActiveFilters = computed(() =>
  !!filterQ.value ||
  !!filterDateFrom.value ||
  !!filterDateTo.value ||
  filterColors.value.length > 0
);

const op = ref();
const colors = [
  "#cbd5e1",
  "#fca5a5",
  "#fdba74",
  "#fde047",
  "#86efac",
  "#bae6fd",
  "#7dd3fc",
  "#d8b4fe",
  "#f9a8d4",
];
const openSelectColor = (event) => {
  op.value.toggle(event);
};

const openFilters = (event) => {
  filtersPop.value.toggle(event);
};

const isPopupVisible = ref(false);
const isEventDetailsPopupVisible = ref(false);
const isEditEventVisible = ref(false);
const selectedEvent = ref({
  id: null,
  title: "",
  color: colors[0],
  start_date: null,
  end_date: null,
  client: null,
  description: "",
  files: [],
  age_label: "",
  created_at: "",
});
const pendingOpenEventId = ref(null);
const eventForm = ref({
  title: "",
  start_date: "",
  end_date: "",
  color: colors[0],
  description: "",
});

const activeEventForm = ref(null);

const selectColor = (color) => {
  if (activeEventForm.value) {
    activeEventForm.value.color = color;
  }
  op.value.hide();
};

function showEventPopup(info) {

  let start, end;

  if (info && info.date && !info.allDay) {
    start = new Date(info.date);
    end = new Date(start.getTime() + 60 * 60 * 1000);
  } else {
    const base = new Date();
    start = new Date(base);
    start.setHours(9, 0, 0, 0);

    end = new Date(base);
    end.setHours(18, 0, 0, 0);
  }

  eventForm.value.start_date = start;
  eventForm.value.end_date = end;

  activeEventForm.value = eventForm.value;
  isPopupVisible.value = true;
}

function showEditEvent() {
  isEditEventVisible.value = true;
}

function handleDateClick(info) {
  if (!canCreateEvent.value) return;
  showEventPopup(info);
}

const mapEventDetails = (ev) => {
  const client = ev?.extendedProps?.client ?? null;

  return {
    id: ev?.id ?? null,
    title: ev?.title ?? "",
    color: ev?.color || colors[0],
    start_date: fromIso(ev?.start_date),
    end_date: fromIso(ev?.end_date),
    client: client && client.name ? { id: client.id || null, name: client.name } : null,
    description: ev?.extendedProps?.description || "",
    files: Array.isArray(ev?.files) ? ev.files : [],
    age_label: ev?.extendedProps?.age_label || "",
    created_at: ev?.extendedProps?.created_at || "",
  };
};

const saveCalendarContext = () => {
  const api = calendarRef.value?.getApi?.();
  const payload = {
    viewType: api?.view?.type || null,
    currentDate: api?.getDate?.()?.toISOString?.() || null,
    showMyEventsOnly: showMyEventsOnly.value,
    selectedEventId: isEventDetailsPopupVisible.value
      ? selectedEvent.value?.id || null
      : null,
    savedAt: Date.now(),
  };
  sessionStorage.setItem(CALENDAR_CONTEXT_KEY, JSON.stringify(payload));
};

const loadCalendarContext = () => {
  const raw = sessionStorage.getItem(CALENDAR_CONTEXT_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
};

const openEventDetailsById = async (eventId) => {
  try {
    isLoadingEvents.value = true;

    const response = await apiClient.get(`${store.api}/events/${eventId}`, {
      headers: { Authorization: `Bearer ${store.token}` },
    });

    const eventDetails = response.data?.data;
    if (!eventDetails) {
      throw new Error("Event details are missing in response.");
    }

    selectedEvent.value = mapEventDetails(eventDetails);
    activeEventForm.value = selectedEvent.value;
    isEventDetailsPopupVisible.value = true;
  } catch (error) {
    console.error("Error loading event details:", error);
    toast.add({
      severity: "error",
      summary: "Errore",
      detail: "Impossibile caricare i dettagli dell'evento.",
      life: 3000,
    });
  } finally {
    isLoadingEvents.value = false;
  }
};

async function handleEventClick(info) {
  await openEventDetailsById(info.event.id);
  saveCalendarContext();
}


async function saveEvent() {
  const isValid = await v$.value.$validate();
  if (!isValid) return;
  try {
    saving.value = true;

    const payload = {
      ...eventForm.value,
      start_date: toIsoUtc(eventForm.value.start_date),
      end_date: toIsoUtc(eventForm.value.end_date),
    };

    await apiClient.post(`${store.api}/events`, payload, {
      headers: {
        Authorization: `Bearer ${store.token}`,
      },
    });

    toast.add({
      severity: "success",
      summary: "Successo",
      detail: "Evento creato con successo.",
      life: 3000,
    });

    isPopupVisible.value = false;
    resetForm();

    await reloadCurrentRange();
  } catch (error) {
    toast.add({
      severity: "error",
      summary: "Errore",
      detail: "Impossibile creare l'evento.",
      life: 3000,
    });
    console.error("Error creating event:", error);
  } finally {
    saving.value = false;
  }
}

async function saveEditEvent() {
  const isValid = await vEditEvent.value.$validate();
  if (!isValid) return;
  try {
    const payload = {
      ...selectedEvent.value,
      start_date: toIsoUtc(selectedEvent.value.start_date),
      end_date: toIsoUtc(selectedEvent.value.end_date),
    };

    await apiClient.put(`${store.api}/events/${selectedEvent.value.id}`, payload, {
      headers: {
        Authorization: `Bearer ${store.token}`,
      },
    });

    toast.add({
      severity: "success",
      summary: "Successo",
      detail: "Evento aggiornato con successo.",
      life: 3000,
    });

    isEditEventVisible.value = false;
    isEventDetailsPopupVisible.value = false;

    await reloadCurrentRange();
  } catch (error) {
    toast.add({
      severity: "error",
      summary: "Errore",
      detail: "Impossibile aggiornare l'evento.",
      life: 3000,
    });
    console.error("Error creating event:", error);
  }
}

async function exportEventToGoogle() {
  try {
    saving.value = true;

    await apiClient.post(
      `${store.api}/google/push/${selectedEvent.value.id}`,
      {},
      {
        headers: {
          Authorization: `Bearer ${store.token}`,
        },
      }
    );

    toast.add({
      severity: "success",
      summary: "Successo",
      detail: "Evento esportato su Google Calendar con successo.",
      life: 3000,
    });
  } catch (error) {
    toast.add({
      severity: "error",
      summary: "Errore",
      detail: "Impossibile esportare l'evento.",
      life: 3000,
    });
    console.error("Error creating event:", error);
  } finally {
    saving.value = false;
  }
}

function resetForm() {
  eventForm.value = {
    title: "",
    start_date: "",
    end_date: "",
    color: colors[0],
    description: "",
    is_all_day: false,
  };
}

const isLoading = ref(true);
const isLoadingEvents = ref(false);
const events = ref([]);
const currentVisibleRange = ref(null);
const latestEventsRequestId = ref(0);
const lastLoadedKey = ref("");

const calendarRef = ref(null);

function toYmdInTz(value) {
  return DateTime.fromJSDate(new Date(value), { zone: TZ }).toISODate();
}

async function handleCalendarDatesSet(info) {
  const from = toYmdInTz(info.start);
  const to = DateTime.fromJSDate(new Date(info.end), { zone: TZ })
    .minus({ days: 1 })
    .toISODate();

  currentVisibleRange.value = { from, to };
  await fetchEvents({ onlyMine: showMyEventsOnly.value, from, to });

  if (pendingOpenEventId.value) {
    const eventId = pendingOpenEventId.value;
    pendingOpenEventId.value = null;
    await openEventDetailsById(eventId);
  }

  saveCalendarContext();
}

const reloadCurrentRange = async () => {
  if (!currentVisibleRange.value) return;
  await fetchEvents({
    onlyMine: showMyEventsOnly.value,
    from: currentVisibleRange.value.from,
    to: currentVisibleRange.value.to,
    force: true,
  });
};

const fetchEvents = async ({ onlyMine = false, from, to, force = false } = {}) => {
  if (!from || !to) return;

  const requestId = ++latestEventsRequestId.value;

  try {
    isForbidden.value = false;
    isLoadingEvents.value = true;

    if (!canViewEvents.value) {
      isForbidden.value = true;
      isLoading.value = false;
      isLoadingEvents.value = false;
      events.value = [];
      message.value = "Accesso negato.";
      return;
    }

    const userId = localStorage.getItem("user");

    const mustOnlyMine = !canViewAllEvents.value;
    const finalOnlyMine = mustOnlyMine ? true : !!onlyMine;
    const requestKey = `${from}:${to}:${finalOnlyMine ? "mine" : "all"}`;

    if (force) {
      lastLoadedKey.value = "";
    }

    if (!force && requestKey === lastLoadedKey.value) {
      isLoading.value = false;
      isLoadingEvents.value = false;
      return;
    }

    const response = await apiClient.get(`${store.api}/events`, {
      headers: { Authorization: `Bearer ${store.token}` },
      params: {
        from,
        to,
        ...(finalOnlyMine ? { user_id: userId } : {}),
      },
    });

    if (requestId !== latestEventsRequestId.value) return;

    if (!response.data?.data?.length) {
      message.value = "Nessun evento ancora disponibile.";
      events.value = [];
    } else {
      events.value = response.data.data.map((ev) => {
        if (ev.is_all_day) {
          const start = toLocalISODate(ev.start_date);
          let end = toLocalISODate(ev.end_date || ev.start_date);

          if (start === end)
            end = DateTime.fromISO(start).plus({ days: 1 }).toISODate();

          return {
            id: ev.id,
            title: ev.title,
            start,
            end,
            allDay: true,
            color: ev.color || colors[0],
            description: ev.extendedProps?.description || "",
            client: ev.extendedProps?.client || null,
            files: ev.files || [],
            rawStart: ev.start_date,
            rawEnd: ev.end_date,
            extendedProps: { age_label: ev.extendedProps?.age_label || '' },
          };
        }

        return {
          id: ev.id,
          title: ev.title,
          start: ev.start_date,
          end: ev.end_date,
          allDay: false,
          color: ev.color || colors[0],
          description: ev.extendedProps?.description || "",
          client: ev.extendedProps?.client || null,
          files: ev.files || [],
          rawStart: ev.start_date,
          rawEnd: ev.end_date,
          extendedProps: { age_label: ev.extendedProps?.age_label || '' },
        };
      });
    }

    lastLoadedKey.value = requestKey;
    isLoading.value = false;
  } catch (error) {
    if (requestId !== latestEventsRequestId.value) return;

    if (error.response?.status === 403) {
      isForbidden.value = true;
      message.value = "Accesso negato.";
      events.value = [];
      isLoading.value = false;
      return;
    }

    if (error.response?.status === 404) {
      message.value = "Nessun evento ancora disponibile.";
      events.value = [];
    } else {
      console.error("Error fetching events:", error);
    }

    isLoading.value = false;
  }
  finally {
    if (requestId === latestEventsRequestId.value) {
      isLoadingEvents.value = false;
    }
  }
};


const formatDisplayDate = (dateStr) => {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  return `${d}.${m}.${y}`;
};

const formatYMD = (d) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const handleGoogleCalendarEvents = () => {
  const api = calendarRef.value?.getApi();
  if (!api) return;

  const current = api.getDate();

  const start = new Date(current);
  const dow = start.getDay();
  const diffToMonday = (dow + 6) % 7;
  start.setDate(start.getDate() - diffToMonday);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);

  weekRange.value = {
    from: formatYMD(start),
    to: formatYMD(end),
  };

  const mStart = new Date(current.getFullYear(), current.getMonth(), 1);
  const mEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0);

  monthRange.value = {
    from: formatYMD(mStart),
    to: formatYMD(mEnd),
  };

  customRange.value = {
    from: start,
    to: end,
  };

  syncType.value = "week";
  googleSyncDialogVisible.value = true;
};

const fetchGoogleCalendarEvents = async (from, to) => {
  try {
    isLoadingEvents.value = true;
    const response = await apiClient.get(`${store.api}/google/sync`, {
      headers: { Authorization: `Bearer ${store.token}` },
      params: { from, to },
    });

    const { message, synced, failed, total } = response.data;

    if (failed) {
      toast.add({
        severity: "warn",
        summary: "Attenzione",
        detail: `❌ Eventi falliti: ${failed}`,
        life: 3000,
        escape: false,
      });
    }

    await reloadCurrentRange();
    if (synced) {
      toast.add({
        severity: "success",
        summary: "Successo",
        detail: `✅ Eventi sincronizzati: ${synced}`,
        life: 3000,
        escape: false,
      });
    }
  } catch (error) {
    if (error.response && error.response.status === 404) {
      toast.add({
        severity: "info",
        summary: "Google Calendar",
        detail: "Nessun evento disponibile per la sincronizzazione.",
        life: 4000,
      });
    } else {
      console.error("Error fetching google calendar events:", error);
    }
  } finally {
    isLoadingEvents.value = false;
  }
};

const confirmGoogleSync = () => {
  let from = "";
  let to = "";

  if (syncType.value === "week") {
    from = weekRange.value.from;
    to = weekRange.value.to;
  } else if (syncType.value === "month") {
    from = monthRange.value.from;
    to = monthRange.value.to;
  } else {
    if (!customRange.value.from || !customRange.value.to) return;
    from = formatDateIso(customRange.value.from);
    to = formatDateIso(customRange.value.to);
  }

  if (!from || !to) return;

  googleSyncDialogVisible.value = false;
  fetchGoogleCalendarEvents(from, to);
};

const resizeCalendar = () => {
  setTimeout(() => {
    if (calendarRef.value) {
      const calendarApi = calendarRef.value.getApi();
      if (calendarApi) {
        calendarApi.updateSize();
      } else {
        console.error("FullCalendar API not found.");
      }
    }
  }, 10);
};

defineExpose({
  resizeCalendar,
});

async function runSearch() {
  if (!hasActiveFilters.value) {
    await reloadCurrentRange();
    return;
  }

  isFiltering.value = true;
  try {
    const params = new URLSearchParams();

    if (filterQ.value) params.append('q', filterQ.value);
    if (filterDateFrom.value) {
      params.append('date_from', new Date(filterDateFrom.value).toISOString().split('T')[0]);
    }
    if (filterDateTo.value) {
      params.append('date_to', new Date(filterDateTo.value).toISOString().split('T')[0]);
    }
    filterColors.value.forEach(c => params.append('color[]', c));

    const response = await apiClient.get(
      `${store.api}/calendar/search?${params.toString()}`,
      { headers: { Authorization: `Bearer ${store.token}` } }
    );

    const rawEvents = response.data?.data ?? response.data ?? [];
    events.value = rawEvents.map((ev) => ({
      id: ev.id,
      title: ev.title,
      start: ev.start_date,
      end: ev.end_date || ev.start_date,
      allDay: false,
      color: ev.color || colors[0],
    }));
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Errore ricerca', detail: e.message, life: 3000 });
  } finally {
    isFiltering.value = false;
  }
}

function onFilterInput() {
  clearTimeout(filterDebounceTimer);
  filterDebounceTimer = setTimeout(runSearch, 300);
}

function toggleFilterColor(colorValue) {
  const idx = filterColors.value.indexOf(colorValue);
  if (idx >= 0) {
    filterColors.value.splice(idx, 1);
  } else {
    filterColors.value.push(colorValue);
  }
  runSearch();
}

function resetFilters() {
  filterQ.value = '';
  filterDateFrom.value = null;
  filterDateTo.value = null;
  filterColors.value = [];
  runSearch();
}

const filterEventsByClient = async () => {
};

const confirmDeleteEvent = () => {
  confirm.require({
    message: "Sei sicuro di voler procedere?",
    header: "Conferma eliminazione",
    icon: "pi pi-exclamation-triangle",
    acceptClass: "p-button-danger",
    rejectClass: "p-button-secondary",
    acceptLabel: "Sì",
    rejectLabel: "Annulla",
    accept: () => deleteEvent(),
  });
};

const deleteEvent = async () => {
  try {
    saving.value = true;
    await apiClient.delete(`${store.api}/events/${selectedEvent.value.id}`, {
      headers: { Authorization: `Bearer ${store.token}` },
    });

    await reloadCurrentRange();
    isEventDetailsPopupVisible.value = false;
    saving.value = false;
    toast.add({
      severity: "success",
      summary: "Successo",
      detail: "Evento eliminato con successo.",
      life: 3000,
    });
  } catch (error) {
    console.error("Error deleting event:", error);
    toast.add({
      severity: "error",
      summary: "Errore",
      detail: "Eliminazione evento fallita. Riprova.",
      life: 3000,
    });
  } finally {
    saving.value = false;
  }
};

onMounted(async () => {
  showMyEventsOnly.value = !canViewAllEvents.value;

  await nextTick();
  const context = loadCalendarContext();
  window.addEventListener("beforeunload", saveCalendarContext);
  if (!context) return;

  showMyEventsOnly.value = typeof context.showMyEventsOnly === "boolean"
    ? context.showMyEventsOnly
    : showMyEventsOnly.value;

  pendingOpenEventId.value = context.selectedEventId || null;

  const api = calendarRef.value?.getApi?.();
  if (!api) return;

  if (context.viewType && api.view?.type !== context.viewType) {
    api.changeView(context.viewType);
  }
  if (context.currentDate) {
    api.gotoDate(context.currentDate);
  }
});

onBeforeUnmount(() => {
  saveCalendarContext();
  window.removeEventListener("beforeunload", saveCalendarContext);
});

watch(showMyEventsOnly, () => {
  saveCalendarContext();
});

watch(isEventDetailsPopupVisible, () => {
  saveCalendarContext();
});

// TODO: what happens on backend
async function handleEventDrop(info) {
  if (!canUpdateEvent.value) {
    info.revert();
    return;
  }

  const { event } = info;

  try {
    const payload = {
      id: event.id,
      start_date: event.start.toISOString(),
      end_date: event.end?.toISOString() ?? event.start.toISOString(),
    };

    const event_id = event.id;

    await apiClient.put(`${store.api}/events/${event_id}`, payload, {
      headers: {
        Authorization: `Bearer ${store.token}`,
      },
    });

    toast.add({
      severity: "success",
      summary: "Successo",
      detail: "Evento aggiornato con successo.",
      life: 3000,
    });

    await reloadCurrentRange();
  } catch (error) {
    toast.add({
      severity: "error",
      summary: "Errore",
      detail: "Impossibile aggiornare l'evento.",
      life: 3000,
    });
    console.error("Error creating event:", error);
  }
}

const endDateAfterStart = helpers.withMessage(
  "La data di fine deve essere successiva alla data di inizio.",
  (value, vm) => {
    if (!value || !vm.start_date) return true;
    return new Date(value) > new Date(vm.start_date);
  }
);

const rules = {
  title: {
    required: helpers.withMessage("Il titolo è obbligatorio.", required),
    maxLength: helpers.withMessage(
      "Il titolo non può superare 255 caratteri.",
      maxLength(255)
    ),
  },
  start_date: { required },
  end_date: {
    required: helpers.withMessage("Data di fine è obbligatoria.", required),
    endDateAfterStart,
  },
};

const v$ = useVuelidate(rules, eventForm);
const vEditEvent = useVuelidate(rules, selectedEvent);

const handleReloadFiles = (fileId) => {
  if (!canFilesDelete.value) return;
  selectedEvent.value.files = selectedEvent.value.files.filter(
    (file) => file.id !== fileId
  );
};

const onFileSelectEvent = async (event) => {
  if (!canFilesManage.value) return;

  const files = event.files;
  const formData = new FormData();


  if (files.length > 0) {
    const validFiles = [];
    const invalidFiles = [];

    for (const file of files) {
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
    if (validFiles.length) {
      validFiles.forEach((file, index) => {
        formData.append(`files[${index}]`, file);
      });

      try {
        const response = await apiClient.post(
          `${store.api}/events/${selectedEvent.value.id}/files`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${store.token}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );

        response.data.data.forEach((file) => {
          selectedEvent.value.files.push({
            id: file.id,
            link: file.link,
            name: file.name,
            type: file.type,
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
  }
};

const emit = defineEmits(["close-calendar"]);

const goToClient = (clientId) => {
  if (!canViewClients.value) {
    toast.add({
      severity: "warn",
      summary: "Accesso negato",
      detail: "Non hai i permessi per visualizzare i clienti.",
      life: 3000,
    });
    return;
  }

  saveCalendarContext();
  isEventDetailsPopupVisible.value = false;
  emit("close-calendar");
  router.push(`/clients/${clientId}`);
};

const dragOver = ref(false);

function onDragOver(event) {
  event.preventDefault();
  dragOver.value = true;
}

function onDragLeave(event) {
  event.preventDefault();
  dragOver.value = false;
}

function onDrop(event) {
  event.preventDefault();
  dragOver.value = false;

  const files = event.dataTransfer.files;
  if (!files.length) return;

  onFileSelectEvent({ files: Array.from(files) });
}
</script>
<style scoped>
.color-circle {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid transparent;
  transition: transform 0.2s ease, border-color 0.2s ease;
}

.color-circle:hover {
  transform: scale(1.1);
}

.color-circle.selected {
  border-color: #475569;
}

.custom-input-number {
  --p-inputnumber-button-width: 30px;
}

::v-deep(.custom-input-number .p-inputtext) {
  width: 40px !important;
  text-align: center;
  padding: 0;
  height: 2rem;
  line-height: 2.5rem;
}
::v-deep(.custom-input-number .pi-plus),
::v-deep(.custom-input-number .pi-minus) {
  font-size: 11px;
}

.p-fileupload-advanced {
  border: none !important;
}

.done .p-step-number {
  border-color: #bbf7d0 !important;
  color: #22c55e !important;
}

.p-selectbutton .p-togglebutton:first-child {
  border-left-width: 1px;
  border-top-left-radius: var(--p-selectbutton-border-radius);
  border-top-right-radius: var(--p-selectbutton-border-radius);
  border-bottom-left-radius: 0px !important;
}

.p-selectbutton .p-togglebutton:last-child {
  border-top-right-radius: 0px !important;
  border-bottom-left-radius: var(--p-selectbutton-border-radius);
  border-bottom-right-radius: var(--p-selectbutton-border-radius);
}

.p-selectbutton {
  min-height: 64px;
}

.p-togglebutton-checked {
  min-height: 40px;
}

.p-togglebutton-label {
  line-height: 34px;
}

.upload-border {
  background-color: #f0fdfa !important;
  background-image: url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' stroke='%2314B8A6FF' stroke-width='4' stroke-dasharray='16%2c 12' stroke-dashoffset='0' stroke-linecap='square'/%3e%3c/svg%3e") !important;
  border: 0px !important;
}

.p-steppanel {
  transition: none !important;
  animation: none !important;
}

.p-stepitem:last-of-type .p-steppanel {
  padding-inline-start: 0px !important;
}

.text-shadow {
  text-shadow: -1.5px 0.5px #14b8a6;
}

.hide-upload-label .p-button-label {
  display: none;
}

.p-fileupload.p-fileupload-basic.p-component > span {
  display: none;
}

.p-progressbar-label {
  display: none !important;
}

.p-fileupload .p-message {
  display: none !important;
}

.red-shadow {
  box-shadow: 0 0 8px 3px rgba(255, 0, 0, 0.6);
}

.p-button-icon-only {
  width: 2rem !important;
}
.header-button-link {
  padding: 0;
  background: transparent !important;
  color: inherit !important;
  border: none !important;
  gap: 0.5rem;
  margin-top: 0.5rem;
}
</style>
