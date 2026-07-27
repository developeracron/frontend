<template>
  <div>
    <div>
      <div
        class="flex items-center gap-2 text-lg font-semibold leading-6 text-[#000000E0] pb-3"
      >
        <i class="pi pi-pen-to-square"></i>
        Note
      </div>
      <!-- <div class="flex items-center gap-1">
            <span class="font-bold">Note</span>
            <Button
              icon="pi pi-plus-circle"
              severity="secondary"
              text
              @click="
                () => {
                  showNotesDialog = true;
                }
              "
            />
          </div> -->
      <div v-if="entity?.notes?.length" class="mb-3">
        <div class="flex flex-col gap-2 max-h-[450px] overflow-auto">
          <div
            v-for="note in entity?.notes"
            :key="note.id"
            @contextmenu="onNoteRightClick($event, note)"
            @click="onNoteClick(note)"
            class="border border-gray-300 rounded-sm p-2 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            :class="[
              selectedNote === note
                ? 'bg-gray-50 border-gray-400 shadow-md'
                : 'bg-white border-gray-300 hover:bg-gray-50',
            ]"
          >
            <div
              class="flex justify-between text-[12px] text-[#BFBFBF] font-medium leading-5 mb-2"
            >
              <div>{{ note.user.name }}</div>
              <div>{{ formatDate(note.updated_at) }}</div>
            </div>

            <div class="text-sm text-[#000000D9] mb-2" v-html="note.content"></div>

            <div v-if="note.event_id" class="flex items-center gap-1 mt-1 mb-1">
              <i class="pi pi-calendar text-blue-400" style="font-size: 11px"></i>
              <span class="text-xs text-blue-400">In Calendario</span>
              <span v-if="note.linked_event?.age_label" class="text-xs text-gray-400">
                · {{ note.linked_event.age_label }}
              </span>
            </div>

            <div v-if="note.files?.length" class="text-sm text-[#214062] mb-3">
              <div
                v-for="file in note.files"
                :key="file.id || file.name || file.title"
                class="mb-2 flex items-center gap-2 min-w-0"
              >
                <i
                  class="pi pi-paperclip flex-shrink-0"
                  style="font-size: 12px"
                ></i>

                <span class="file-name flex-1 min-w-0 font-bold">
                  {{ file.name || file.title || "File senza nome" }}
                </span>

                <div class="flex gap-1 flex-shrink-0">
                  <Button
                    icon="pi pi-eye"
                    text
                    size="small"
                    @click="preview.open(file)"
                  />
                  <Button
                    icon="pi pi-download"
                    text
                    size="small"
                    @click="downloadFile(file)"
                  />
                  <Button
                    v-if="props.showEdit"
                    icon="pi pi-trash"
                    text
                    size="small"
                    class="p-button-danger"
                    @click="deleteNoteFile(file.id)"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-else>
        <i class="text-xs">Aggiungi note qua</i>
      </div>

      <!-- <div>
        <div class="text-sm font-medium leading-5 mb-2">
          Aggiungi una nota alla pratica
        </div>
      </div> -->

      <div class="mt-2 flex justify-end gap-2 flex-1">
        <SplitButton
          v-if="props.showEdit"
          label="Scarica note"
          @click="downloadNotes"
          :model="fileTypes"
          outlined
          severity="secondary"
          size="small"
        />
        <Button
          v-if="props.showEdit"
          label="Aggiungi nota"
          type="button"
          icon="pi pi-plus"
          @click="prepareModalForCreation()"
          outlined=""
          size="small"
        />
      </div>

      <ContextMenu ref="menu" :model="items" />
      <Reminder
        v-show="false"
        ref="noteReminderRef"
        :entity="selectedNote"
        entity_type="notes"
        :parent="props.entity"
        :parent_type="props.entity_type"
      />
    </div>
    <Dialog
      v-model:visible="showNotesDialog"
      :modal="true"
      :style="{ width: '30rem' }"
      header="Nuova nota:"
      @hide="onNotesDialogHide"
    >
      <div class="w-full flex justify-end flex-col">
        <div class="w-full m flex flex-col">
          <Textarea v-model="newNote" rows="8" cols="30" class="mb-5" />
          <div class="min-h-0 max-h-32 overflow-y-auto">
            <div
              class="flex justify-between items-center mb-4 gap-2"
              v-for="(file, index) in files"
              :key="index"
            >
              <div class="flex items-center gap-2 min-w-0">
                <i
                  class="pi pi-file flex-shrink-0"
                  style="font-size: 1.5em"
                ></i>

                <span class="file-name">
                  {{ file?.name ? file.name : file?.title }}
                </span>
              </div>

              <div class="flex gap-2">
                <Button
                  icon="pi pi-eye"
                  class="p-button p-button-outlined p-button-secondary"
                  @click="preview.open(file)"
                />
                <Button
                  v-if="file.id && isEditNote"
                  icon="pi pi-download"
                  class="p-button p-button-outlined p-button-secondary"
                  @click="downloadFile(file)"
                />
                <Button
                  v-if="props.showEdit"
                  icon="pi pi-trash"
                  class="p-button p-button-outlined p-button-danger"
                  @click="removeNoteFile(index)"
                />
              </div>
            </div>
          </div>

          <div v-if="props.showEdit" class="flex pb-2 pt-4">
            <FileUpload
              mode="basic"
              name="file"
              customUpload
              auto
              :multiple="true"
              severity="secondary"
              chooseLabel="Carica file"
              class="p-button-outlined"
              @select="(event) => onNoteFileSelect(event)"
            />
          </div>

          <!-- Toggle Invia al Calendario -->
          <div class="flex items-center gap-3 pt-3 pb-1">
            <ToggleSwitch v-model="sendToCalendar" inputId="sendToCalendar" />
            <label for="sendToCalendar" class="text-sm font-medium cursor-pointer select-none">
              Invia al Calendario
            </label>
          </div>

          <!-- Campi calendario — visibili solo se toggle attivo -->
          <Transition name="fade">
            <div v-if="sendToCalendar" class="flex flex-col gap-3 pt-2 pb-2">
              <div class="flex flex-col gap-1">
                <label class="text-xs text-gray-500">Data evento</label>
                <DatePicker
                  v-model="eventDate"
                  showTime
                  hourFormat="24"
                  dateFormat="dd/mm/yy"
                  placeholder="Seleziona data e ora"
                  class="w-full"
                />
              </div>

              <div class="flex flex-col gap-1">
                <label class="text-xs text-gray-500">Colore evento</label>
                <div class="flex flex-wrap gap-2">
                  <button
                    v-for="color in CALENDAR_COLORS"
                    :key="color.value"
                    type="button"
                    :title="color.label"
                    class="w-6 h-6 rounded-full border-2 transition-transform hover:scale-110"
                    :style="{
                      backgroundColor: color.value,
                      borderColor: eventColor === color.value ? '#334155' : 'transparent',
                    }"
                    @click="eventColor = color.value"
                  />
                  <button
                    v-if="eventColor"
                    type="button"
                    class="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-xs text-gray-400 hover:bg-gray-100"
                    title="Rimuovi colore"
                    @click="eventColor = null"
                  >✕</button>
                </div>
              </div>

              <div class="text-xs text-gray-400 italic">
                Titolo evento: <span class="font-medium text-gray-600">{{ props.entity?.name ?? '—' }}</span>
              </div>
            </div>
          </Transition>

          <div class="flex justify-end">
            <Button
              v-if="props.showEdit"
              :label="isEditNote ? 'Modifica' : 'Aggiungi'"
              class="p-button-secondary"
              @click="
                () => {
                  if (newNote) {
                    if (isEditNote) {
                      updateNote(newNote);
                    } else {
                      saveNote(newNote);
                    }
                  } else {
                    toast.add({
                      severity: 'warn',
                      summary: 'Attenzione',
                      detail: 'Nessun nota aggiunta!',
                      life: 3000,
                    });
                  }
                }
              "
            />
          </div>
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
      v-model:visible="showViewNoteDialog"
      :modal="true"
      :style="{ width: '30rem' }"
      header="Nota"
    >
      <div class="w-full flex flex-col">
        <div
          class="flex justify-between text-[12px] text-[#BFBFBF] font-medium leading-5 mb-3"
        >
          <div>{{ selectedNote?.user?.name }}</div>
          <div>{{ formatDate(selectedNote?.updated_at) }}</div>
        </div>

        <div class="text-sm text-[#000000D9] mb-3" v-html="selectedNote?.content"></div>

        <div v-if="selectedNote?.event_id" class="flex items-center gap-1 mb-3">
          <i class="pi pi-calendar text-blue-400" style="font-size: 11px"></i>
          <span class="text-xs text-blue-400">In Calendario</span>
          <span v-if="selectedNote?.linked_event?.age_label" class="text-xs text-gray-400">
            · {{ selectedNote.linked_event.age_label }}
          </span>
        </div>

        <div v-if="selectedNote?.files?.length" class="text-sm text-[#214062]">
          <div
            v-for="file in selectedNote.files"
            :key="file.id || file.name || file.title"
            class="mb-2 flex items-center gap-2 min-w-0"
          >
            <i class="pi pi-paperclip flex-shrink-0" style="font-size: 12px"></i>

            <span class="file-name flex-1 min-w-0 font-bold">
              {{ file.name || file.title || "File senza nome" }}
            </span>

            <div class="flex gap-1 flex-shrink-0">
              <Button icon="pi pi-eye" text size="small" @click="preview.open(file)" />
              <Button icon="pi pi-download" text size="small" @click="downloadFile(file)" />
            </div>
          </div>
        </div>
      </div>
    </Dialog>
    <Dialog
      v-model:visible="showFilePreviewDialog"
      :modal="true"
      :style="{ width: '50vw' }"
      :header="previewedFile?.name || previewedFile?.title || 'Anteprima file'"
    >
      <div class="w-full flex flex-col items-center">
        <!-- Visualizzazione immagine -->
        <img
          v-if="isPreviewableFile(previewedFile) === 'image'"
          :src="getFilePreviewUrl(previewedFile)"
          class="max-w-full max-h-70vh"
          alt="Preview"
          @error="imageLoadError"
        />

        <!-- Visualizzazione PDF -->
        <embed
          v-else-if="isPreviewableFile(previewedFile) === 'pdf'"
          :src="getFilePreviewUrl(previewedFile)"
          type="application/pdf"
          class="w-full h-70vh"
        />

        <!-- Fallback per file non visualizzabili -->
        <div v-else-if="previewedFile" class="text-center p-4">
          <i class="pi pi-file text-6xl mb-3"></i>
          <p>Questo tipo di file non può essere visualizzato direttamente.</p>
          <Button
            label="Scarica file"
            icon="pi pi-download"
            class="mt-3"
            @click="downloadFile(previewedFile)"
          />
        </div>
        <div v-else class="text-center p-4">
          <p>Nessun file selezionato</p>
        </div>
      </div>
    </Dialog>
    <FilePreview ref="preview" />
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import Dialog from "primevue/dialog";
import Textarea from "primevue/textarea";
import Button from "primevue/button";
import ContextMenu from "primevue/contextmenu";
import { useToast } from "primevue/usetoast";
import FileUpload from "primevue/fileupload";
import ToggleSwitch from "primevue/toggleswitch";
import DatePicker from "primevue/datepicker";
import apiService from "@/services/apiService";
import { useConfirm } from "primevue/useconfirm";
import { useStore } from "@/store";
import SplitButton from "primevue/splitbutton";
import { formatDate } from "@/utils/dateUtils";
import ProgressSpinner from "primevue/progressspinner";
import Reminder from "@/components/Reminder.vue";
import FilePreview from "@/components/FilePreview.vue";
import apiClient from "@/router/apiClient";

const route = useRoute();
const router = useRouter();
const openedFromQuery = ref(false);
const isUpdatingQuery = ref(false);
const noteReminderRef = ref(null);
const preview = ref(null);

const setNoteIdInQuery = async (idOrNull) => {
  const next = { ...route.query };

  if (idOrNull) next.noteId = String(idOrNull);
  else delete next.noteId;

  const currentNoteId = route.query.noteId ? String(route.query.noteId) : null;
  const nextNoteId = next.noteId ? String(next.noteId) : null;

  if (currentNoteId === nextNoteId) return;

  isUpdatingQuery.value = true;
  try {
    await router.replace({ query: next });
  } finally {
    isUpdatingQuery.value = false;
  }
};

const props = defineProps({
  entity: Object,
  entity_type: String,
  entity_download: String,
  showEdit: Boolean,
});

const emit = defineEmits(["reloadEntity"]);

const store = useStore();
const toast = useToast();
const confirm = useConfirm();
const showNotesDialog = ref(false);
const showViewNoteDialog = ref(false);
const showSelect = ref(false);
const isEditNote = ref(false);
const noteId = ref();
const newNote = ref(null);
const selectedNote = ref();
const files = ref([]);
const menu = ref();
const saving = ref(false);
const sendToCalendar = ref(false);
const eventDate = ref(null);
const eventColor = ref(null);

const CALENDAR_COLORS = [
  { label: "Grigio",         value: "#cbd5e1" },
  { label: "Rosa",           value: "#fca5a5" },
  { label: "Arancio",        value: "#fdba74" },
  { label: "Giallo",         value: "#fde047" },
  { label: "Verde",          value: "#86efac" },
  { label: "Azzurro chiaro", value: "#bae6fd" },
  { label: "Azzurro",        value: "#7dd3fc" },
  { label: "Viola",          value: "#d8b4fe" },
  { label: "Rosa chiaro",    value: "#f9a8d4" },
];
const MAX_FILE_SIZE = 2048 * 1024 * 1024;

const showFilePreviewDialog = ref(false);
const previewedFile = ref(null);

const selectedFileType = ref("pdf");
const fileTypes = computed(() => [
  {
    label: `PDF ${selectedFileType.value === "pdf" ? "\u00A0\u00A0🗸" : ""}`,
    icon: "pi pi-file-pdf",
    command: () => {
      selectedFileType.value = "pdf";
    },
  },
  {
    separator: true,
  },
  {
    label: `Excel${selectedFileType.value === "excel" ? "\u00A0\u00A0🗸" : ""}`,
    icon: "pi pi-file-excel",
    command: () => {
      selectedFileType.value = "excel";
    },
  },
]);

const imageLoadError = (event) => {
  console.error("Errore caricamento immagine:", event);
  toast.add({
    severity: "error",
    summary: "Errore",
    detail: "Impossibile visualizzare l'immagine",
    life: 3000,
  });
};

const items = ref([
  {
    label: "Copia",
    icon: "pi pi-copy",
    command: () => {
      if (selectedNote.value) {
        navigator.clipboard
          .writeText(selectedNote.value.content)
          .then(() => {
            toast.add({
              severity: "success",
              summary: "Successo",
              detail: "Nota copiata nel clipboard!",
              life: 3000,
            });
          })
          .catch((err) => {
            console.error("Failed to copy:", err);
          });
      } else {
        toast.add({
          severity: "warn",
          summary: "Attenzione",
          detail: "Nessun nota selezionata!",
          life: 3000,
        });
      }
    },
  },
  ...(props.showEdit
    ? [
        {
          label: "Modifica",
          icon: "pi pi-pencil",
          command: () => {

            if (selectedNote.value) {
              isEditNote.value = true;
              noteId.value = selectedNote.value.id;
              newNote.value = selectedNote.value.content;
              files.value = [...selectedNote.value.files];
              showNotesDialog.value = true;
            } else {
              toast.add({
                severity: "warn",
                summary: "Attenzione",
                detail: "Nessun nota selezionata!",
                life: 3000,
              });
            }
          },
        },
      ]
    : []),
  {
    label: "Aggiungi promemoria",
    icon: "pi pi-bell",
    command: () => {
      if (!selectedNote.value) {
        toast.add({
          severity: "warn",
          summary: "Attenzione",
          detail: "Nessuna nota selezionata!",
          life: 3000,
        });
        return;
      }
      noteReminderRef.value?.open();
    },
  },
  ...(props.showEdit
    ? [
        {
          label: "Elimina",
          icon: "pi pi-trash",
          class: "text-red-500",
          command: () => {
            if (selectedNote.value) {
              confirmDeleteNote();
            } else {
              toast.add({
                severity: "warn",
                summary: "Attenzione",
                detail: "Nessun nota selezionata!",
                life: 3000,
              });
            }
          },
        },
      ]
    : []),
]);

const isPreviewableFile = (file) => {
  if (!file) return false;

  if (file.type) {
    if (file.type.startsWith("image/")) {
      return "image";
    }
    if (file.type === "application/pdf") {
      return "pdf";
    }
  }

  const fileName = file.name || file.title || "";
  const extension = fileName.split(".").pop().toLowerCase();

  if (["jpg", "jpeg", "png", "gif", "bmp", "webp"].includes(extension)) {
    return "image";
  }

  if (extension === "pdf") {
    return "pdf";
  }

  return false;
};

const getFilePreviewUrl = (file) => {
  if (!file) return "";

  if (file instanceof File) return URL.createObjectURL(file);

  if (file.id) {
    const base = import.meta.env.VITE_API_BASE_URL;
    const previewable = isPreviewableFile(file);
    return previewable
      ? `${base}/files/${file.id}/preview`
      : `${base}/files/${file.id}`;
  }

  return file.link || file.url || "";
};

const downloadFile = async (file) => {
  try {
    if (file.id) {
      const resp = await apiClient.get(`/files/${file?.id}`, {
        responseType: "blob",
      });

      const cd = resp.headers["content-disposition"] || "";
      let name =
        (cd.match(/filename\*?=(?:UTF-8'')?"?([^"]+)"?/) || [])[1] ||
        file?.name ||
        file?.title ||
        "allegato";

      const blob = new Blob([resp.data], {
        type: resp.data.type || "application/octet-stream",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } else if (file instanceof File) {
      const url = URL.createObjectURL(file);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name || "file";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } else {
      throw new Error("File non disponibile per il download");
    }
  } catch (e) {
    toast.add({
      severity: "error",
      summary: "Errore",
      detail: "Download fallito",
      life: 3000,
    });
  }
};

const downloadNotes = async () => {
  try {
    const fileType = selectedFileType.value;
    const idEntity = props.entity?.id;
    const typeEntity = props.entity_download;

    const payload = { file_type: fileType };

    const response = await apiClient.post(
      `/${typeEntity}/${idEntity}/notes`,
      payload,
      {
        responseType: "blob",
        // headers: {
        //   "Content-Type": "multipart/form-data",
        // },
      }
    );

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      selectedFileType.value === "pdf"
        ? `note-${typeEntity}-${idEntity}.pdf`
        : `note-${typeEntity}-${idEntity}.xlsx`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error("Error:", error.message);
    toast.add({
      severity: "error",
      summary: "Errore",
      detail: "Operzione non riuscita",
      life: 3000,
    });
  }
};

const previewFile = (file) => {
  previewedFile.value = file;
  showFilePreviewDialog.value = true;
};

const onNoteRightClick = (event, note) => {
  if (note) {
    selectedNote.value = note;
  }
  menu.value.show(event);
};

const onNoteClick = (note) => {
  if (note) {
    selectedNote.value = note;
    showViewNoteDialog.value = true;
  }
};

const onNoteFileSelect = (event) => {
  const selectedFiles = event.files || [];

  selectedFiles.forEach((file) => {
    if (file.size > MAX_FILE_SIZE) {
      toast.add({
        severity: "warn",
        summary: "File troppo grande",
        detail: `Il file "${file.name}" supera il limite di 1MB`,
        life: 4000,
      });
      return;
    }

    files.value.push(file);
  });
};

const removeNoteFile = (index) => {
  confirm.require({
    message: "Sei sicuro di voler eliminare questo allegato?",
    header: "Conferma eliminazione",
    icon: "pi pi-exclamation-triangle",
    acceptClass: "p-button-danger",
    rejectClass: "p-button-secondary",
    acceptLabel: "Sì",
    rejectLabel: "Annulla",
    accept: () => {
      files.value.splice(index, 1);
    },
  });
};

const deleteNoteFile = (fileId) => {
  confirm.require({
    message: "Sei sicuro di voler eliminare questo allegato?",
    header: "Conferma eliminazione",
    icon: "pi pi-exclamation-triangle",
    acceptClass: "p-button-danger",
    rejectClass: "p-button-secondary",
    acceptLabel: "Sì",
    rejectLabel: "Annulla",
    accept: () => deleteFile(fileId),
  });
};

const deleteFile = async (fileId) => {
  try {
    await apiClient.delete(`/files/${fileId}`);

    toast.add({
      severity: "success",
      summary: "Successo",
      detail: `File eliminato con successo!`,
      life: 3000,
    });
    emit("reloadEntity");
  } catch (error) {
    console.error("Error deleting file:", error.message);
    toast.add({
      severity: "error",
      summary: "Errore",
      detail: `Eliminazione del file fallita.`,
      life: 3000,
    });
  }
};

const saveNote = async (newNote, filesParam = null) => {
  try {
    saving.value = true;
    if (!props.entity?.notes) {
      props.entity.notes = [];
    }

    const formData = new FormData();
    formData.append("content", newNote);
    formData.append("notable_id", props.entity?.id);
    formData.append("notable_type", props.entity_type);

    if (sendToCalendar.value && eventDate.value) {
      formData.append("event_date", new Date(eventDate.value).toISOString());
      if (eventColor.value) {
        formData.append("event_color", eventColor.value);
      }
    }

    const filesToUpload = filesParam ?? files.value;

    if (filesToUpload.length) {
      filesToUpload.forEach((file, index) => {
        formData.append(`files[${index}]`, file);
      });
    }

    const createdNote = await apiService.postOrPutWithAuth(
      `notes`,
      formData,
      false,
      {
        successMessage: "Nota salvata con successo.",
        errorMessage: "Errore durante il salvataggio della nota.",
        headers: { "Content-Type": "multipart/form-data" },
      }
    );
    if (createdNote?.id) {
      props.entity.notes.push(createdNote);
      showNotesDialog.value = false;
      emit("reloadEntity");
    }
  } catch (error) {
    console.error("Error saving phases data:", error.message);
  } finally {
    saving.value = false;
  }
};

defineExpose({ saveNote });

const updateNote = async (newNote) => {
  try {
    saving.value = true;
    const formData = new FormData();
    formData.append("content", newNote);
    formData.append("notable_id", props.entity?.id);
    formData.append("notable_type", props.entity_type);
    formData.append("_method", "PUT");

    if (sendToCalendar.value && eventDate.value) {
      formData.append("event_date", new Date(eventDate.value).toISOString());
      if (eventColor.value) {
        formData.append("event_color", eventColor.value);
      }
    }

    files.value.forEach((file, index) => {
      if (file instanceof File) {
        formData.append(`files[${index}]`, file);
      } else if (file.id) {
        formData.append(`existing_files[${index}]`, file.id);
      }
    });

    const updatedNote = await apiService.postOrPutWithAuth(
      `notes/${noteId.value}`,
      formData,
      false,
      {
        successMessage: "Nota modificata con successo.",
        errorMessage: "Errore durante la modifica della nota.",
        headers: { "Content-Type": "multipart/form-data" },
      }
    );
    if (updatedNote?.id) {
      const index = props.entity.notes.findIndex((n) => n.id === noteId.value);
      if (index !== -1) {
        props.entity.notes[index] = updatedNote;
      }
      showNotesDialog.value = false;
      isEditNote.value = false;
      emit("reloadEntity");
    }
  } catch (error) {
    console.error("Error updating note:", error.message);
  } finally {
    saving.value = false;
  }
};

const confirmDeleteNote = () => {
  confirm.require({
    message: "Sei sicuro di voler eliminare questa nota?",
    header: "Conferma eliminazione",
    icon: "pi pi-exclamation-triangle",
    acceptClass: "p-button-danger",
    rejectClass: "p-button-secondary",
    acceptLabel: "Sì",
    rejectLabel: "Annulla",
    accept: () => {
      deleteNote();
    },
  });
};

const deleteNote = async () => {
  if (!selectedNote.value || !selectedNote.value.id) {
    toast.add({
      severity: "error",
      summary: "Errore",
      detail: "Impossibile eliminare la nota: ID non trovato",
      life: 3000,
    });
    return;
  }

  try {
    const noteId = selectedNote.value.id;
    const status = await apiService.deleteWithAuth("notes", noteId, {
      successMessage: "Nota eliminata con successo.",
      errorMessage: "Errore durante l'eliminazione della nota.",
      headers: { "Content-Type": "multipart/form-data" },
    });

    if (status === 200 || status === 204) {
      const index = props.entity.notes.findIndex((n) => n.id === noteId);
      if (index !== -1) {
        props.entity.notes.splice(index, 1);
      }
      selectedNote.value = null;
      emit("reloadEntity");
    }
  } catch (error) {
    console.error("Error deleting note:", error.message);
    toast.add({
      severity: "error",
      summary: "Errore",
      detail: "Si è verificato un errore durante l'eliminazione della nota",
      life: 3000,
    });
  }
};

const isPreviewableNoteFile = (file) => {
  if (!file || !file.type) return false;
  const previewableTypes = [
    "application/pdf",
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/bmp",
  ];
  return previewableTypes.includes(file.type);
};

const openNoteFilePreview = async (file) => {
  try {
    const response = await apiClient.get(`/files/${file?.id}/preview`, {
      responseType: "blob",
    });

    const blob = new Blob([response.data], {
      type: file.type || "application/octet-stream",
    });
    const url = window.URL.createObjectURL(blob);
    window.open(url, "_blank");

    setTimeout(() => window.URL.revokeObjectURL(url), 1000);
  } catch (error) {
    console.error("Error opening preview:", error.message);
    toast.add({
      severity: "error",
      summary: "Errore",
      detail: `Impossibile aprire il file.`,
      life: 3000,
    });
  }
};

const downloadNoteFile = async (file) => {
  try {
    const response = await apiClient.get(`/files/${file?.id}`, {
      responseType: "blob",
    });

    let fileName = file?.name || "downloaded-file";

    const mimeType = response.data.type || "application/octet-stream";
    const extensionMap = {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
        "xlsx",
      "application/vnd.ms-excel": "xls",
      "application/pdf": "pdf",
      "application/msword": "doc",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        "docx",
      "image/png": "png",
      "image/jpeg": "jpg",
      "text/plain": "txt",
    };

    if (!/\.[a-zA-Z0-9]+$/.test(fileName)) {
      const ext = extensionMap[mimeType] || mimeType.split("/")[1] || "bin";
      fileName += `.${ext}`;
    }

    const blob = new Blob([resp.data], {
      type: resp.headers?.["content-type"] || resp.data?.type || "application/octet-stream",
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error downloading file:", error.message);
    toast.add({
      severity: "error",
      summary: "Errore",
      detail: `Download del file fallito.`,
      life: 3000,
    });
  }
};

const openNoteById = (id) => {
  const note = props.entity?.notes?.find((n) => String(n.id) === String(id));
  if (!note) return false;

  selectedNote.value = note;
  isEditNote.value = true;
  noteId.value = note.id;
  newNote.value = note.content;
  files.value = note.files || [];
  showNotesDialog.value = true;

  setNoteIdInQuery(note.id);

  return true;
};

watch(
  () => [route.query.noteId, props.entity?.notes?.length],
  ([qid]) => {
    if (!qid) return;
    if (isUpdatingQuery.value) return;

    if (showNotesDialog.value && String(noteId.value) === String(qid)) return;

    openNoteById(qid);
  },
  { immediate: true }
);

watch(
  () => showNotesDialog.value,
  async (open) => {
    if (isUpdatingQuery.value) return;

    if (open) {
      const id = noteId.value ?? selectedNote.value?.id;
      if (id) await setNoteIdInQuery(id);
    } else {
      if (route.query.noteId) await setNoteIdInQuery(null);
    }
  }
);

watch(
  () => props.entity?.id,
  () => {
    openedFromQuery.value = false;
  }
);

const onNotesDialogHide = () => {
  resetNoteDialog();

  if (route.query.noteId) {
    setNoteIdInQuery(null);
  }
};

const resetNoteDialog = () => {
  isEditNote.value = false;
  noteId.value = null;
  newNote.value = null;
  files.value = [];
  previewedFile.value = null;
  showFilePreviewDialog.value = false;
  selectedNote.value = null;
  sendToCalendar.value = false;
  eventDate.value = null;
  eventColor.value = null;
};

const prepareModalForCreation = async () => {
  await setNoteIdInQuery(null);
  resetNoteDialog();
  showNotesDialog.value = true;
};
</script>

<style scoped>
.max-h-70vh {
  max-height: 70vh;
}

.h-70vh {
  height: 70vh;
}

.file-name {
  word-wrap: break-word;
  overflow-wrap: break-word;
  white-space: normal;
  max-width: 100%;
  line-height: 1.4;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
