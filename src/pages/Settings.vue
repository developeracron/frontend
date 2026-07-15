<template>
  <div class="px-8 gap-4">
    <Panel
      header="Cambia la tua email"
      class="w-full md:w-7/12 mb-4"
      :collapsed="changeEmailCollapsed"
      toggleable
    >
      <div class="grid gap-4 px-8 pt-4">
        <div
          class="text-yellow-500 font-semibold flex items-center gap-x-2 mb-1"
        >
          <div>
            <i
              class="pi pi-exclamation-triangle !text-2xl"
              style="color: #eab308"
            ></i>
          </div>
          <div>
            Se l'email non verrà confermata in 24 ore, l'account verrà bloccato.
          </div>
        </div>
        <FloatLabel variant="on">
          <InputText
            v-model="newEmail"
            type="email"
            class="w-full"
            :invalid="isEmailDirty && !emailValid"
            @input="(isEmailDirty = true), (emailAlreadyTaken = false)"
          />
          <label>Nuova email</label>
        </FloatLabel>
        <div
          v-if="isEmailDirty && !emailValid"
          class="text-red-500 text-sm -mt-2"
        >
          L'email non è valida.
        </div>
        <div v-if="emailAlreadyTaken" class="text-red-500 text-sm -mt-2">
          L'email inserita è già stata utilizzata.
        </div>

        <div class="flex justify-end">
          <Button
            label="Modifica"
            :disabled="!emailValid"
            @click="handleChangeEmail"
            icon="pi pi-pencil"
            severity="info"
            class="p-button-primary w-32"
            outlined
          />
        </div>
      </div>
    </Panel>
    <Panel
      header="Cambia la tua password"
      class="w-full md:w-7/12 mb-4"
      :collapsed="true"
      toggleable
    >
      <div class="grid gap-4 px-1 md:px-8 pt-4">
        <PasswordField
          id="oldPassword"
          v-model="oldPassword"
          label="Vecchia password"
          :invalid="isOldPasswordDirty && !oldPassword"
          @input="(isOldPasswordDirty = true), (wrongCurrentPassword = false)"
        />
        <div v-if="wrongCurrentPassword" class="text-red-500 text-sm -mt-2">
          La vecchia password è sbagliata.
        </div>
        <PasswordField
          id="newPassword"
          v-model="newPassword"
          label="Nuova password"
          :invalid="isNewPasswordDirty && !newPassword"
          @input="isNewPasswordDirty = true"
        />
        <div
          v-if="isNewPasswordDirty && !passwordValid"
          class="text-sm text-red-500 -mt-2"
        >
          <div v-if="!hasMinLength">
            La password deve contenere almeno 4 caratteri
          </div>
          <!-- <div v-if="!hasUppercase">
            - Deve contenere almeno una lettera maiuscola
          </div>
          <div v-if="!hasNumber">- Deve contenere almeno un numero</div> -->
        </div>
        <PasswordField
          id="repeatNewPassword"
          v-model="repeatNewPassword"
          label="Conferma nuova password"
          :invalid="isConfirmNewPasswordDirty && !repeatNewPassword"
          @input="isConfirmNewPasswordDirty = true"
        />
        <div v-if="passwordMismatch" class="text-red-500 text-sm -mt-2">
          Le password non corrispondono.
        </div>
        <div class="flex justify-end">
          <Button
            label="Modifica"
            :disabled="!canSubmit"
            @click="handleChangePassword"
            icon="pi pi-pencil"
            severity="info"
            class="p-button-primary w-32"
            outlined
          />
        </div>
      </div>
    </Panel>
    <Panel
      v-if="isAdmin"
      header="Gestisci i ruoli"
      class="w-full md:w-7/12 mb-4"
      :collapsed="manageRolesCollapsed"
      toggleable
    >
      <div class="grid gap-4">
        <div class="flex justify-end">
          <Button
            label="Aggiungi nuovo ruolo"
            @click="onCreateRole"
            icon="pi pi-plus"
            severity="success"
            class="p-button-primary responsive-button"
            outlined
          />
        </div>
        <DataTable :value="roles">
          <Column field="name" header="Nome" class="min-w-44">
            <template #body="slotProps">
              <div class="flex flex-wrap gap-2">
                <Tag
                  :key="slotProps.data.name"
                  :severity="getRoleSeverity(slotProps.data.name)"
                  :value="slotProps.data.name"
                  class="capitalize"
                />
              </div>
            </template>
          </Column>
          <Column header="Azioni" class="min-w-44">
            <template #body="slotProps">
              <Button
                type="button"
                icon="pi pi-pencil"
                severity="secondary"
                text
                @click="onEditRole(slotProps.data)"
              />
              <Button
                type="button"
                icon="pi pi-trash"
                severity="danger"
                text
                :disabled="['user', 'admin'].includes(slotProps.data.name)"
                v-tooltip="
                  ['user', 'admin'].includes(slotProps.data.name)
                    ? 'Non eliminabile'
                    : null
                "
                @click="confirmDeleteRole(slotProps.data)"
              />
            </template>
          </Column>
        </DataTable>
      </div>
      <Dialog
        v-model:visible="openCreateOrEditPermissions"
        :header="isEditMode ? 'Modifica ruolo' : 'Nuovo ruolo'"
        modal
        class="w-full md:w-8/12"
      >
        <div class="flex flex-col gap-3">
          <label for="role-name" class="font-medium">Nome ruolo</label>
          <div class="flex items-start gap-4 col-span-2">
            <div class="flex flex-col flex-1 gap-1">
              <InputText
                id="role-name"
                v-model="roleForm.name"
                placeholder="Inserisci il nome del ruolo"
                class="w-full"
              />
            </div>
            <Button
              label="Colore"
              @click="openSelectColor"
              outlined
              severity="secondary"
              :style="{
                background: roleForm?.color || '#ffffff',
                'border-color': roleForm?.color || '#cccccc',
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

          <h3 class="font-medium mt-2">Permessi</h3>

          <div class="flex flex-col gap-3 max-h-96 overflow-auto">
            <Panel
              v-for="(groupPermissions, groupName) in permissions"
              :key="groupName"
              :header="
                groupName
                  .replace(/-/g, ' ')
                  .replace(/\b\w/g, (c) => c.toUpperCase())
              "
              toggleable
              class="border rounded-lg"
            >
              <div class="grid md:grid-cols-2 gap-2 mt-2">
                <div
                  v-for="perm in groupPermissions"
                  :key="perm.id"
                  class="flex items-center gap-2"
                >
                  <Checkbox
                    :inputId="`perm-${perm.id}`"
                    v-model="roleForm.permissionNames"
                    :value="perm.name"
                    :disabled="['user', 'admin'].includes(roleForm.name)"
                  />

                  <label :for="`perm-${perm.id}`" class="text-sm">
                    {{ perm.description || perm.name }}
                  </label>
                </div>
              </div>
            </Panel>
          </div>
        </div>

        <div
          v-if="saving"
          class="absolute inset-0 flex items-center justify-center bg-white/50 z-10 rounded-md"
        >
          <ProgressSpinner />
        </div>
        <template #footer>
          <Button
            label="Annulla"
            icon="pi pi-times"
            severity="danger"
            text
            @click="onCancelRole"
          />
          <Button
            :label="isEditMode ? 'Aggiorna ruolo' : 'Salva'"
            icon="pi pi-check"
            :disabled="!roleForm.name"
            @click="onSubmitRole"
          />
        </template>
      </Dialog>
    </Panel>
    <Popover ref="op">
      <div class="flex flex-col gap-4">
        <div class="grid grid-cols-3 gap-2">
          <div
            v-for="color in colors"
            :key="color"
            :style="{ backgroundColor: color }"
            class="color-circle"
            :class="{ selected: color === roleForm?.color }"
            @click="selectColor(color)"
          ></div>
        </div>
      </div>
    </Popover>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, reactive } from "vue";
import Button from "primevue/button";
import Panel from "primevue/panel";
import { useToast } from "primevue/usetoast";
import PasswordField from "@/components/PasswordField.vue";
import FloatLabel from "primevue/floatlabel";
import InputText from "primevue/inputtext";
import apiClient from "@/router/apiClient";
import { useStore } from "@/store";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import { useConfirm } from "primevue/useconfirm";
import Checkbox from "primevue/checkbox";
import Tag from "primevue/tag";
import Dialog from "primevue/dialog";
import ProgressSpinner from "primevue/progressspinner";
import Popover from "primevue/popover";

const store = useStore();

const toast = useToast();
const confirm = useConfirm();

const oldPassword = ref("");
const newPassword = ref("");
const repeatNewPassword = ref("");
const isOldPasswordDirty = ref(false);
const isNewPasswordDirty = ref(false);
const isConfirmNewPasswordDirty = ref(false);
const isEmailDirty = ref(false);
const newEmail = ref("");
const changeEmailCollapsed = ref(true);
const openCreateOrEditPermissions = ref(false);
const editingRole = ref(null);
const manageRolesCollapsed = ref(true);
const loading = ref(false);
const roles = ref([]);
const permissions = ref({});
const roleForm = reactive({
  id: null,
  name: "",
  permissionNames: [],
  color: "#cbd5e1",
});
const isEditMode = computed(() => !!editingRole.value);
const saving = ref(false);
const userOptions = ref([]);
const isAdmin = ref(false);

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

onMounted(() => {
  fetchMe();
  fetchRoles();
  fetchPermissions();
});

const emailValid = computed(() =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail.value)
);

const passwordMismatch = computed(
  () =>
    isConfirmNewPasswordDirty.value &&
    newPassword.value !== repeatNewPassword.value
);
const hasMinLength = computed(() => newPassword.value.length >= 4);
// const hasUppercase = computed(() => /[A-Z]/.test(newPassword.value));
// const hasNumber = computed(() => /\d/.test(newPassword.value));
const passwordValid = computed(
  () => hasMinLength.value //&& hasUppercase.value && hasNumber.value
);

const wrongCurrentPassword = ref(false);
const emailAlreadyTaken = ref(false);

const canSubmit = computed(() => {
  return (
    oldPassword.value &&
    newPassword.value &&
    repeatNewPassword.value &&
    passwordValid.value &&
    !passwordMismatch.value
  );
});

const handleChangePassword = async () => {
  if (!canSubmit.value) return;
  try {
    const response = await apiClient.post(
      `${store.api}/me`,
      {
        password: oldPassword.value,
        new_password: newPassword.value,
        new_password_confirmation: repeatNewPassword.value,
      },
      {
        headers: {
          Authorization: `Bearer ${store.token}`,
        },
      }
    );
    if (response.data?.message) {
      toast.add({
        severity: "success",
        summary: "Successo",
        detail: "Password cambiata con successo!",
        life: 3000,
      });

      oldPassword.value = "";
      newPassword.value = "";
      repeatNewPassword.value = "";
      isOldPasswordDirty.value = false;
      isNewPasswordDirty.value = false;
      isConfirmNewPasswordDirty.value = false;
    }
  } catch (error) {
    if (error.response?.data?.error) {
      if (error.response.data.error === "Current password is incorrect") {
        wrongCurrentPassword.value = true;
      }
    }
    toast.add({
      severity: "error",
      summary: "Errore",
      detail: "Il cambio di password non è riuscito.",
      life: 3000,
    });
    console.error("Error changing the password:", error.message);
  }
};
const handleChangeEmail = async () => {
  if (!emailValid.value) return;
  try {
    const response = await apiClient.post(
      `${store.api}/me/email`,
      {
        email: newEmail.value,
      },
      {
        headers: {
          Authorization: `Bearer ${store.token}`,
        },
      }
    );
    if (response.data?.message) {
      toast.add({
        severity: "success",
        summary: "Successo",
        detail: "Controla la tua email per confermarla.",
        life: 3000,
      });
      newEmail.value = "";
      isEmailDirty.value = false;
      changeEmailCollapsed.value = true;
    }
  } catch (error) {
    if (error.response?.data?.message) {
      if (error.response.data.message === "The email has already been taken.") {
        emailAlreadyTaken.value = true;
      }
    }
    toast.add({
      severity: "error",
      summary: "Errore",
      detail: "Il cambio dell'email non è riuscito.",
      life: 3000,
    });
    console.error("Error changing the email:", error.message);
  }
};

const fetchRoles = async () => {
  loading.value = true;
  try {
    const response = await apiClient.get(`${store.api}/roles`, {
      headers: { Authorization: `Bearer ${store.token}` },
    });
    roles.value = Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error("Error fetching roles:", error);
  } finally {
    loading.value = false;
  }
};

const fetchPermissions = async () => {
  loading.value = true;
  try {
    const response = await apiClient.get(`${store.api}/permissions`, {
      headers: { Authorization: `Bearer ${store.token}` },
    });
    permissions.value = response.data;
  } catch (error) {
    console.error("Error fetching permissions:", error);
  } finally {
    loading.value = false;
  }
};

const confirmDeleteRole = (role) => {
  confirm.require({
    message: "Sei sicuro di voler eliminare questo ruolo?",
    header: "Conferma eliminazione",
    icon: "pi pi-exclamation-triangle",
    acceptClass: "p-button-danger",
    rejectClass: "p-button-secondary",
    acceptLabel: "Sì",
    rejectLabel: "Annulla",
    accept: () => {
      deleteRole(role);
    },
  });
};

const deleteRole = async (role) => {
  try {
    await apiClient.delete(`${store.api}/roles/${role.id}`, {
      headers: { Authorization: `Bearer ${store.token}` },
    });

    await fetchRoles();
    toast.add({
      severity: "success",
      summary: "Successo",
      detail: `Ruolo eliminato con succeso!`,
      life: 3000,
    });
  } catch (error) {
    console.error("Error deleting role:", error);
    toast.add({
      severity: "error",
      summary: "Errore",
      detail: `Eliminazione del ruolo fallita.`,
      life: 3000,
    });
  }
};

const getRoleSeverity = (roleName) => {
  switch (roleName) {
    case "admin":
      return "danger";
    case "user":
      return "success";
    default:
      return "info";
  }
};

function resetRoleForm() {
  roleForm.id = null;
  roleForm.name = "";
  roleForm.permissionNames = [];
}

function fillRoleFormFromRole(role) {
  roleForm.id = role.id;
  roleForm.name = role.name;
  roleForm.permissionNames = role.permissions
    ? role.permissions.map((p) => p.name)
    : [];
}

function onCreateRole() {
  editingRole.value = null;
  resetRoleForm();
  openCreateOrEditPermissions.value = true;
}

function onEditRole(role) {
  editingRole.value = role;
  fillRoleFormFromRole(role);
  openCreateOrEditPermissions.value = true;
}

function onCancelRole() {
  openCreateOrEditPermissions.value = false;
}

async function onSubmitRole() {
  saving.value = true;

  const payload = {
    name: roleForm.name,
    permissions: roleForm.permissionNames,
  };

  const isEdit = isEditMode.value;

  const url = isEdit
    ? `/roles/${roleForm.id}`
    : `/roles`;

  const method = isEdit ? "put" : "post";

  try {
    await apiClient[method](url, payload);
    await fetchRoles();
    resetRoleForm();
    openCreateOrEditPermissions.value = false;
    toast.add({
      severity: "success",
      summary: "Successo",
      detail: isEdit
        ? "Ruolo modificato con successo!"
        : "Ruolo salvato con successo!",
      life: 3000,
    });
  } catch (error) {
    console.error(
      isEdit ? "Error modifying role:" : "Error saving new role:",
      error
    );
    toast.add({
      severity: "error",
      summary: "Errore",
      detail: isEdit
        ? "Modifica del ruolo fallita."
        : "Creazione del nuovo ruolo fallita.",
      life: 3000,
    });
  } finally {
    saving.value = false;
  }
}

function checkRole() {
  const storedUserKey = localStorage.getItem("user");
  const user = userOptions.value.find((u) => u.value === storedUserKey);
  const roles = user?.roles || [];
  isAdmin.value = roles.some((role) => role.name === "admin");
}

const fetchMe = async () => {
  try {
    const res = await apiClient.get(`${store.api}/me`, {
      headers: { Authorization: `Bearer ${store.token}` },
    });

    const myRoles = res.data?.roles ?? res.data?.data?.roles ?? [];

    isAdmin.value = myRoles.some((r) => r.toLowerCase() === "admin");
  } catch (error) {
    console.error("Error fetching me:", error);
    isAdmin.value = false;
  }
};

const selectColor = (color) => {
  if (roleForm?.color) {
    roleForm.color = color;
  }
  op.value.hide();
};
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
</style>