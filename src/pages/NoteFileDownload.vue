<template>
  <div class="flex flex-col items-center justify-center min-h-screen bg-gray-50">
    <div class="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
      <!-- Loading State -->
      <div v-if="loading">
        <ProgressSpinner style="width: 60px; height: 60px" strokeWidth="4" />
        <div class="mt-4 text-lg font-medium text-gray-700">
          Download del file in corso...
        </div>
        <div class="mt-2 text-sm text-gray-500">
          Attendere prego
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="error">
        <i class="pi pi-exclamation-triangle text-6xl text-red-500 mb-4"></i>
        <div class="text-lg font-semibold text-gray-800 mb-2">
          {{ errorTitle }}
        </div>
        <div class="text-sm text-gray-600 mb-6">
          {{ errorMessage }}
        </div>
        <Button
          label="Torna alla Dashboard"
          icon="pi pi-home"
          @click="goToDashboard"
          class="p-button-secondary"
        />
      </div>

      <!-- Success State (brief display before redirect) -->
      <div v-else-if="success">
        <i class="pi pi-check-circle text-6xl text-green-500 mb-4"></i>
        <div class="text-lg font-semibold text-gray-800 mb-2">
          Download completato!
        </div>
        <div class="text-sm text-gray-600">
          Reindirizzamento alla dashboard...
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useStore } from "@/store";
import { useToast } from "primevue/usetoast";
import ProgressSpinner from "primevue/progressspinner";
import Button from "primevue/button";
import apiClient from "@/router/apiClient";

const route = useRoute();
const router = useRouter();
const store = useStore();
const toast = useToast();

const loading = ref(true);
const error = ref(false);
const success = ref(false);
const errorTitle = ref("");
const errorMessage = ref("");

const downloadFile = async () => {
  try {
    const fileId = route.params.id;

    if (!fileId) {
      throw new Error("ID file mancante");
    }

    // Chiamata API per scaricare il file con autenticazione
    const response = await apiClient.get(
      `${store.api}/files/${fileId}`,
      {
        responseType: "blob",
        headers: {
          Authorization: `Bearer ${store.token}`,
        },
      }
    );

    // Estrai il nome del file dall'header Content-Disposition
    const contentDisposition = response.headers["content-disposition"];
    let fileName = "allegato";
    if (contentDisposition) {
      // Prova a estrarre filename con quote: filename="nome.pdf"
      let fileNameMatch = contentDisposition.match(/filename="([^"]+)"/);
      if (fileNameMatch && fileNameMatch[1]) {
        fileName = fileNameMatch[1];
      } else {
        // Fallback: prova senza quote: filename=nome.pdf
        fileNameMatch = contentDisposition.match(/filename=([^;\s]+)/);
        if (fileNameMatch && fileNameMatch[1]) {
          fileName = fileNameMatch[1];
        }
      }
    }

    // Crea un URL per il blob e avvia il download
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    // Mostra stato di successo
    success.value = true;
    loading.value = false;

    toast.add({
      severity: "success",
      summary: "Download completato",
      detail: "Il file è stato scaricato con successo",
      life: 3000,
    });

    // Redirect alla dashboard dopo 1.5 secondi
    setTimeout(() => {
      goToDashboard();
    }, 1500);

  } catch (err) {
    loading.value = false;
    error.value = true;

    console.error("Errore durante il download del file:", err);

    // Gestione errori specifici
    if (err.response) {
      switch (err.response.status) {
        case 401:
          errorTitle.value = "Autenticazione richiesta";
          errorMessage.value = "Devi effettuare il login per accedere a questo file.";

          toast.add({
            severity: "error",
            summary: "Non autorizzato",
            detail: "Effettua il login per continuare",
            life: 3000,
          });

          // Redirect al login dopo 2 secondi
          setTimeout(() => {
            router.push({ name: "Login" });
          }, 2000);
          break;

        case 403:
          errorTitle.value = "Accesso negato";
          errorMessage.value = "Non hai i permessi necessari per scaricare questo file.";

          toast.add({
            severity: "error",
            summary: "Accesso negato",
            detail: "Permessi insufficienti",
            life: 3000,
          });
          break;

        case 404:
          errorTitle.value = "File non trovato";
          errorMessage.value = "Il file richiesto non esiste o è stato eliminato.";

          toast.add({
            severity: "error",
            summary: "File non trovato",
            detail: "Il file non è disponibile",
            life: 3000,
          });
          break;

        default:
          errorTitle.value = "Errore durante il download";
          errorMessage.value = "Si è verificato un errore imprevisto. Riprova più tardi.";

          toast.add({
            severity: "error",
            summary: "Errore",
            detail: "Download fallito",
            life: 3000,
          });
      }
    } else {
      errorTitle.value = "Errore di connessione";
      errorMessage.value = "Impossibile connettersi al server. Verifica la tua connessione.";

      toast.add({
        severity: "error",
        summary: "Errore di connessione",
        detail: "Impossibile raggiungere il server",
        life: 3000,
      });
    }
  }
};

const goToDashboard = () => {
  router.push({ name: "Dashboard" });
};

onMounted(() => {
  downloadFile();
});
</script>

<style scoped>
.min-h-screen {
  min-height: 100vh;
}
</style>
