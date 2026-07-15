<template>
  <Dialog
    v-model:visible="show"
    modal
    :style="{ width: '50vw' }"
    :header="previewedFile?.name || previewedFile?.title || 'Anteprima file'"
    @hide="closePreview"
  >
    <div class="w-full flex flex-col items-center justify-center min-h-[200px]">
      <!-- Loader -->
      <div v-if="loadingPreview" class="flex flex-col items-center">
        <ProgressSpinner style="width: 50px; height: 50px" strokeWidth="4" />
      </div>

      <!-- Image Preview -->
      <img
        v-else-if="fileType === 'image' && previewUrl"
        :src="previewUrl"
        class="max-w-full max-h-[70vh]"
        alt="Preview"
        @error="imageLoadError"
      />

      <!-- PDF Preview -->
      <embed
        v-else-if="fileType === 'pdf' && previewUrl"
        :src="previewUrl"
        type="application/pdf"
        class="w-full h-[70vh]"
      />

      <!-- Fallback for non-previewable file -->
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
</template>

<script setup>
import { ref } from "vue";
import Dialog from "primevue/dialog";
import Button from "primevue/button";
import apiClient from "@/router/apiClient";
import { useStore } from "@/store";
import { useToast } from "primevue/usetoast";
import ProgressSpinner from "primevue/progressspinner";

const store = useStore();
const toast = useToast();

const show = ref(false);
const previewedFile = ref(null);
const previewUrl = ref("");
const loadingPreview = ref(false);
const fileType = ref(null);

// Expose open method
const open = async (file) => {
  previewedFile.value = file;
  show.value = true;

  await loadPreview(file);
};
defineExpose({ open });

// Determine file type
const isPreviewableFile = (file) => {
  if (!file) return false;

  if (file.type) {
    if (file.type.startsWith("image/")) return "image";
    if (file.type === "application/pdf") return "pdf";
  }

  const name = file.name || file.title || "";
  const ext = name.split(".").pop().toLowerCase();

  if (["jpg", "jpeg", "png", "gif", "bmp", "webp"].includes(ext))
    return "image";
  if (ext === "pdf") return "pdf";

  return false;
};

// Load preview URL
const loadPreview = async (file) => {
  loadingPreview.value = true;
  previewUrl.value = "";
  fileType.value = isPreviewableFile(file);

  if (!fileType.value) {
    loadingPreview.value = false;
    return;
  }

  try {
    if (file instanceof File) {
      previewUrl.value = URL.createObjectURL(file);
    } else if (file.id) {
      const response = await apiClient.get(
        `${store.api}/files/${file.id}/preview`,
        {
          headers: { Authorization: `Bearer ${store.token}` },
          responseType: "blob",
        }
      );

      const blob = new Blob([response.data], {
        type: file.type || "application/octet-stream",
      });
      previewUrl.value = URL.createObjectURL(blob);
    } else {
      previewUrl.value = file.link || file.url || "";
    }
  } catch (e) {
    console.error("Errore nel fetch del preview:", e);
    toast.add({
      severity: "error",
      summary: "Errore",
      detail: "Impossibile caricare il file",
      life: 3000,
    });
  } finally {
    loadingPreview.value = false;
  }
};

// Close and cleanup
const closePreview = () => {
  show.value = false;
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
  previewUrl.value = "";
  previewedFile.value = null;
  fileType.value = null;
};

// Download file
const downloadFile = async (file) => {
  try {
    let blob, name;

    if (file.id) {
      const resp = await apiClient.get(`${store.api}/files/${file.id}`, {
        headers: { Authorization: `Bearer ${store.token}` },
        responseType: "blob",
      });

      const cd = resp.headers["content-disposition"] || "";
      name =
        (cd.match(/filename\*?=(?:UTF-8'')?"?([^"]+)"?/) || [])[1] ||
        file.name ||
        file.title ||
        "allegato";

      blob = new Blob([resp.data], {
        type: resp.data.type || "application/octet-stream",
      });
    } else if (file instanceof File) {
      blob = file;
      name = file.name || "file";
    } else {
      throw new Error("File non disponibile per il download");
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch (e) {
    toast.add({
      severity: "error",
      summary: "Errore",
      detail: "Download fallito",
      life: 3000,
    });
  }
};

// Handle image load errors
const imageLoadError = (event) => {
  console.error("Errore caricamento immagine:", event);
  toast.add({
    severity: "error",
    summary: "Errore",
    detail: "Impossibile visualizzare l'immagine",
    life: 3000,
  });
};
</script>
