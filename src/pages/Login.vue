<template>
  <div class="flex items-center justify-center min-h-screen">
    <div class="flex flex-col items-center w-full sm:w-80 px-8 sm:px-0">
      <div class="text-center mb-8">
        <Logo class="w-52 mx-auto" />
        <h1 class="text-2xl font-bold">Benvenuto</h1>
        <p class="text-gray-600">Per favore accedi al tuo account</p>
      </div>

      <form @submit.prevent="onLogin" class="flex flex-col gap-4 w-full">
        <div class="flex flex-col gap-1">
          <InputText
            id="email"
            v-model="email"
            :invalid="isEmailDirty && !email"
            class="w-full"
            @input="handleEmailInput"
            placeholder="Email"
          />
        </div>

        <div class="flex flex-col gap-1">
          <Password
            id="password"
            v-model="password"
            toggleMask
            :feedback="false"
            :invalid="isPasswordDirty && !password"
            class="w-full"
            fluid
            placeholder="Password"
            @input="handlePasswordInput"
          />
        </div>
        <div v-if="loginError" class="text-red-500 text-sm">
          {{ loginError }}
        </div>

        <div class="flex items-center justify-between">
          <div class="flex items-start justify-center gap-2">
            <Checkbox
              v-model="rememberMe"
              :binary="true"
              inputId="rememberMe"
            />
            <label for="rememberMe" class="text-gray-600">Ricordami</label>
          </div>
          <div
            @click="showResetPasswordDialog = true"
            class="text-[var(--p-primary-600)] cursor-pointer hover:text-primary ml-auto transition-colors duration-300"
          >
            Password dimenticata?
          </div>
        </div>

        <Button
          ref="loginButton"
          label="Accedi"
          class="w-full"
          severity="secondary"
          type="submit"
          :disabled="!email || !password"
        />
      </form>
      <Dialog
        v-model:visible="showResetPasswordDialog"
        header="Recupera la password"
        :style="{ width: '25rem' }"
        modal
      >
        <span class="text-surface-500 dark:text-surface-400 block mb-6"
          >Inserisci la tua email qui sotto. Ti invieremo un link per recuperare
          la tua password.</span
        >

        <div class="flex items-center gap-2">
          <InputGroup class="w-full">
            <FloatLabel variant="on">
              <InputText v-model="recoverEmail" type="email" class="w-full" />
              <label>Email</label>
            </FloatLabel>
          </InputGroup>
        </div>
        <div class="col-span-2 flex justify-end mt-4 gap-2">
          <Button
            label="Annulla"
            icon="pi pi-times"
            class="p-button-text"
            severity="danger"
            @click="showResetPasswordDialog = false"
          />
          <Button
            label="Invia"
            icon="pi pi-check"
            class="p-button-primary"
            @click="onForgotPassword"
            :disabled="!recoverEmail"
          />
        </div>
      </Dialog>
    </div>
    <div
      v-if="isLoading"
      class="fixed inset-0 flex items-center justify-center z-50"
    >
      <ProgressSpinner />
    </div>
  </div>
</template>

<script setup>
import InputText from "primevue/inputtext";
import Password from "primevue/password";
import Button from "primevue/button";
import Checkbox from "primevue/checkbox";
import Logo from "@/components/Logo.vue";
import Dialog from "primevue/dialog";
import InputGroup from "primevue/inputgroup";
import FloatLabel from "primevue/floatlabel";
import ProgressSpinner from "primevue/progressspinner";

import { useStore } from "@/store";
import { useRouter } from "vue-router";
import { ref, onMounted } from "vue";
import { useToast } from "primevue/usetoast";

const store = useStore();
const router = useRouter();
const toast = useToast();

const email = ref("");
const recoverEmail = ref("");
const password = ref("");
const rememberMe = ref(false);
const isEmailDirty = ref(false);
const isPasswordDirty = ref(false);
const loginButton = ref(null);
const showResetPasswordDialog = ref(false);
const isLoading = ref(false);
const loginError = ref("");

const onLogin = async () => {
  loginError.value = "";
  try {
    isLoading.value = true;
    await store.login({
      email: email.value,
      password: password.value,
    });
    // Reindirizza all'URL originale se presente, altrimenti alla dashboard
    const redirectPath =
      router.currentRoute.value.query.redirect || "/dashboard";
    await router.push(redirectPath);
  } catch (error) {
    localStorage.setItem("login-error", error);

    if (error.response?.status === 401) {
      loginError.value = "Email o password non corretti";
    }
    if (error.response?.status === 422) {
      loginError.value = "L'email non è valida";
    }

    toast.add({
      severity: "error",
      summary: "Errore",
      detail: error.response?.data?.message || "Accesso fallito",
      life: 3000,
    });
  } finally {
    isLoading.value = false;
  }
};

const onForgotPassword = async () => {
  if (recoverEmail.value) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recoverEmail.value)) {
      toast.add({
        severity: "warn",
        summary: "Errore di Validazione",
        detail: "Inserisci un indirizzo email valido.",
        life: 3000,
      });
      return false;
    }
  }
  try {
    showResetPasswordDialog.value = false;
    isLoading.value = true;
    const message = await store.forgotPassword(recoverEmail.value);
  } catch (error) {
  } finally {
    toast.add({
      severity: "success",
      summary: "Successo",
      detail:
        "Se l'indirizzo email inserito è corretto, riceverai un link per reimpostare la password.",
      life: 3000,
    });
    recoverEmail.value = "";
    isLoading.value = false;
  }
};

const handleEmailInput = () => {
  isEmailDirty.value = true;
};

const handlePasswordInput = () => {
  isPasswordDirty.value = true;
};

onMounted(async () => {});
</script>