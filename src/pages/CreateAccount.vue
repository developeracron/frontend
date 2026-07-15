<template>
  <div class="flex items-center justify-center min-h-screen">
    <div class="flex flex-col items-center w-full sm:w-80 px-8 sm:px-0">
      <div class="text-center mb-8">
        <Logo class="w-52 mx-auto" />
        <h1 class="text-2xl font-bold">Benvenuto</h1>
        <p class="text-gray-600">
          Inserisci una password per attivare il tuo account
        </p>
      </div>

      <form @submit.prevent="onActivate" class="flex flex-col gap-4 w-full">
        <PasswordField
          id="password"
          v-model="password"
          label="Password"
          :invalid="isPasswordDirty && !password"
          @input="isPasswordDirty = true"
        />
        <div
          v-if="isPasswordDirty && !passwordValid"
          class="text-sm text-red-500 -mt-2"
        >
          <div v-if="!hasMinLength">
            La password deve contenere almeno 8 caratteri
          </div>
        </div>

        <PasswordField
          id="confirmPassword"
          v-model="confirmPassword"
          label="Conferma password"
          :invalid="isConfirmPasswordDirty && !confirmPassword"
          @input="isConfirmPasswordDirty = true"
        />
        <div v-if="passwordMismatch" class="text-red-500 text-sm -mt-2">
          Le password non corrispondono.
        </div>

        <Button
          label="Attiva account"
          class="w-full"
          severity="secondary"
          type="submit"
          :disabled="!canSubmit"
        />
      </form>
    </div>
  </div>
</template>

<script setup>
import PasswordField from "@/components/PasswordField.vue";
import Button from "primevue/button";
import Logo from "@/components/Logo.vue";

import { useStore } from "@/store";
import { useRouter } from "vue-router";
import { useRoute } from "vue-router";
import { ref, computed } from "vue";
import { useToast } from "primevue/usetoast";
import apiClient from "@/router/apiClient";

const store = useStore();
const router = useRouter();
const toast = useToast();
const route = useRoute();
const token = route.query.token;

const password = ref("");
const confirmPassword = ref("");
const isPasswordDirty = ref(false);
const isConfirmPasswordDirty = ref(false);

const hasMinLength = computed(() => password.value.length >= 8);
const passwordValid = computed(() => hasMinLength.value);

const passwordMismatch = computed(
  () => isConfirmPasswordDirty.value && password.value !== confirmPassword.value
);

const canSubmit = computed(
  () => passwordValid.value && !passwordMismatch.value
);

const onActivate = async () => {
  try {
    const response = await apiClient.post(`${store.api}/activate`, {
      token: token,
      password: password.value,
      password_confirmation: confirmPassword.value,
    });

    toast.add({
      severity: "success",
      summary: "Account attivato",
      detail: "Ora puoi accedere al tuo account",
      life: 3000,
    });

    router.push("/login");
  } catch (error) {
    toast.add({
      severity: "error",
      summary: "Errore",
      detail: error.response?.data?.message || "Attivazione fallita",
      life: 3000,
    });
  }
};
</script>
