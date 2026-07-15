<template>
  <div class="flex items-center justify-center min-h-screen">
    <div class="flex flex-col items-center w-full sm:w-80 px-8 sm:px-0">
      <div class="text-center mb-8">
        <Logo class="w-52 mx-auto" />
        <h1 class="text-2xl font-bold">Benvenuto</h1>
        <div
          v-if="isLoading"
          class="fixed inset-0 flex items-center justify-center z-50"
        >
          <ProgressSpinner />
        </div>
        <div v-else-if="success">
          <p class="text-gray-600">Email verificata con successo</p>
        </div>
        <p v-else class="text-red-700">
          Verifica email falita. {{ errorMessage }}
        </p>
      </div>

      <Button
        label="Vai al login"
        class="w-full"
        severity="secondary"
        @click="router.push('/login')"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import apiClient from "@/router/apiClient";
import Button from "primevue/button";
import ProgressSpinner from "primevue/progressspinner";
import Logo from "@/components/Logo.vue";
import { useStore } from "@/store";
import { useToast } from "primevue/usetoast";

const route = useRoute();
const router = useRouter();
const store = useStore();

const success = ref(false);
const errorMessage = ref("");
const toast = useToast();
const isLoading = ref(false);

onMounted(async () => {
  try {
    isLoading.value = true;
    const pathAfterVerify = route.fullPath.split("email/verify/")[1];
    const apiUrl = `${store.api}/email/verify/${pathAfterVerify}`;

    await apiClient.get(apiUrl);

    success.value = true;
  } catch (error) {
    errorMessage.value =
      error.response?.data?.message || "Link di verifica non valido o scaduto.";

    toast.add({
      severity: "error",
      summary: "Errore",
      detail:
        error.response?.data?.message ||
        "Link di verifica non valido o scaduto.",
      life: 3000,
    });
  } finally {
    isLoading.value = false;
  }
});
</script>
