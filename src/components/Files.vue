<template>
  <div
    v-for="file in entityFiles"
    :key="file.id"
    class="flex items-center justify-between gap-3 mb-4 min-w-0"
  >
    <!-- LEFT SIDE (icon/image + name) -->
    <div class="flex items-start gap-2 flex-1 min-w-0">
      <!-- Image preview -->
      <img
        v-if="isImage(file)"
        :src="file?.link"
        alt="Preview"
        class="w-16 h-16 object-cover flex-shrink-0"
      />

      <!-- File icon + name -->
      <div v-else class="flex items-start gap-2 min-w-0">
        <i class="pi pi-file flex-shrink-0" style="font-size: 1em"></i>

        <span class="file-name text-sm" :title="file?.name">
          {{ file?.name }}
        </span>
      </div>
    </div>

    <!-- RIGHT SIDE (actions) -->
    <div class="flex gap-2 flex-shrink-0" v-if="showActions">
      <!-- <Button
        v-if="file.link && isPreviewable(file)"
        icon="pi pi-external-link"
        class="p-button p-button-outlined p-button-secondary"
        @click="openPreview(file)"
      /> -->
      <Button
        icon="pi pi-eye"
        class="p-button p-button-outlined p-button-secondary"
        @click="preview.open(file)"
      />
      <Button
        icon="pi pi-download"
        class="p-button p-button-outlined p-button-secondary"
        @click="downloadFile(file)"
      />
      <Button
        icon="pi pi-trash"
        class="p-button p-button-outlined p-button-danger"
        @click="confirmDeleteFile(file?.id)"
      />
    </div>
  </div>
  <FilePreview ref="preview" />
</template>

<script setup>
import { ref } from "vue";
import Button from "primevue/button";
import { useToast } from "primevue/usetoast";
import { useConfirm } from "primevue/useconfirm";
import { useStore } from "@/store";
import FilePreview from "@/components/FilePreview.vue";
import apiClient from "@/router/apiClient";

const props = defineProps({
  entityFiles: Object,
  showActions: Boolean,
});

const emit = defineEmits(["reloadFiles"]);

const toast = useToast();
const confirm = useConfirm();
const store = useStore();
const preview = ref(null);

const confirmDeleteFile = (fileId) => {
  confirm.require({
    message: "Sei sicuro di voler procedere?",
    header: "Conferma",
    accept: () => deleteFile(fileId),
    rejectClass: "reject-btn",
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
    emit("reloadFiles", fileId);
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

const downloadFile = async (file) => {
  try {
    const response = await apiClient.get(`/files/${file?.id}`, {
      responseType: "blob",
    });

    let fileName = file?.name || "downloaded-file";

    const mimeType = response.headers["content-type"] || response.data.type || "application/octet-stream";
    const extensionMap = {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
        "xlsx",
      "application/pdf": "pdf",
      "image/png": "png",
      "image/jpeg": "jpg",
      "text/plain": "txt",
    };

    if (!/\.[a-zA-Z0-9]+$/.test(fileName)) {
      const ext = extensionMap[mimeType] || mimeType.split("/")[1] || "bin";
      fileName += `.${ext}`;
    }

    const blob = new Blob([response.data], { type: mimeType });
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

// const isImage = (url) => {
//   return /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(url);
// };

// const isPreviewable = (url) => {
//   if (!url) return false;
//   return /\.(pdf|jpg|jpeg|png|gif|bmp|webp)$/i.test(url);
// };

const isPreviewable = (file) => {
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

const isImage = (file) => {
  if (!file || !file.type) return false;
  return file.type.startsWith("image/");
};

const openPreview = async (file) => {
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
</script>

<style scoped>
.file-name {
  word-wrap: break-word;
  overflow-wrap: break-word;
  white-space: normal;
  max-width: 100%;
  line-height: 1.4;
}
</style>
