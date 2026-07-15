<template>
  <div class="content-page w-full">
    <div
      v-if="isForbidden"
      class="flex flex-col items-center justify-center h-[60vh] text-center gap-3"
    >
      <i class="pi pi-lock text-4xl text-surface-500"></i>
      <div class="text-xl font-semibold">Accesso negato</div>
      <div class="text-surface-600 max-w-lg">
        Non hai i permessi necessari per visualizzare questa pagina.
      </div>
    </div>

    <Card v-else class="mb-4 w-full">
      <template #title>
        <div class="flex justify-end items-center">
          <Button
            v-if="canInviteUser"
            label="Invita Utente"
            @click="openInviteUserDialog"
            icon="pi pi-plus"
            outlined
            class="p-button-primary mb-2"
          />
        </div>
      </template>
      <template #content>
        <TreeTable
          :value="users"
          :rows="10"
          tableStyle="width: 100%"
          scrollable
          scrollHeight="calc(100vh - 280px)"
          :rowHover="true"
          filterDisplay="menu"
          :resizableColumns="true"
          :loading="loading"
        >
          <Column header="Nome" style="min-width: 250px">
            <template #body="slotProps">
              <div class="flex items-center">
                <Avatar
                  :label="getInitials(slotProps.node.data.name)"
                  size="large"
                  :style="{
                    backgroundColor: getRandomColor(slotProps.node.data.id),
                  }"
                  shape="circle"
                  class="mr-2"
                />
                <span>{{ slotProps.node.data.name }}</span>
              </div>
            </template>
          </Column>
          <Column
            field="email"
            header="Email"
            :sortable="true"
            :filter="true"
            filterPlaceholder="Cerca per email"
            style="min-width: 250px"
          ></Column>
          <Column header="Stato" style="min-width: 200px">
            <template #body="slotProps">
              <div class="flex flex-wrap gap-2">
                <Tag
                  v-if="slotProps.node.data.status === false"
                  severity="warning"
                  value="Invitato"
                  icon="pi pi-clock"
                />
                <Tag v-else severity="info" value="Attivo" class="capitalize" />
              </div>
            </template>
          </Column>
          <Column
            v-if="showUserActionsColumn"
            header="Azioni"
            style="width: 120px; min-width: 120px"
          >
            <template #body="slotProps">
              <div class="flex gap-2 justify-center">
                <Button
                  v-if="canViewUsers"
                  type="button"
                  icon="pi pi-eye"
                  severity="info"
                  @click="viewUser(slotProps.node)"
                  text
                />
                <Button
                  v-if="canUpdateUser"
                  type="button"
                  icon="pi pi-pencil"
                  severity="secondary"
                  rounded
                  text
                  @click="editUser(slotProps.node)"
                  tooltip="Modifica"
                  :tooltipOptions="{ position: 'top' }"
                />
                <Button
                  v-if="canDeleteUser"
                  type="button"
                  icon="pi pi-trash"
                  severity="danger"
                  rounded
                  text
                  @click="confirmDeleteUser(slotProps.node)"
                  tooltip="Elimina"
                  :tooltipOptions="{ position: 'top' }"
                />
              </div>
            </template>
          </Column>
          <template #empty>
            <div v-if="userMessage" class="text-center py-4">
              {{ userMessage }}
            </div>
          </template>
        </TreeTable>
      </template>
    </Card>

    <!-- Invite User Dialog -->
    <Dialog
      header="Invita Utente"
      v-model:visible="inviteUserDialogVisible"
      :breakpoints="{ '960px': '80vw', '640px': '90vw' }"
      :style="{ width: '60vw' }"
      :draggable="false"
      :closeOnEscape="true"
      :dismissableMask="true"
      :showHeader="true"
      :baseZIndex="1000"
      transition="fade"
      modal
    >
      <div class="grid grid-cols-2 gap-4 mt-1">
        <FloatLabel variant="on">
          <InputText
            id="invite-name"
            class="w-full"
            v-model="inviteForm.name"
          />
          <label for="invite-name">Nome</label>
        </FloatLabel>
        <FloatLabel variant="on">
          <InputText
            id="invite-email"
            class="w-full"
            v-model="inviteForm.email"
          />
          <label for="invite-email">Email</label>
        </FloatLabel>
        <div class="col-span-2 flex gap-2">
          <label for="adminSwitch">Con permessi amministratore</label>
          <ToggleSwitch
            v-model="inviteForm.isAdmin"
            inputId="adminSwitch"
            class="w-full"
          />
        </div>
        <div class="col-span-2 flex justify-end mt-4 gap-2">
          <Button
            label="Annulla"
            icon="pi pi-times"
            text
            severity="danger"
            @click="closeInviteUserDialog"
          />
          <Button
            label="Invita"
            icon="pi pi-check"
            class="p-button-primary"
            @click="inviteUser"
          />
        </div>
      </div>
    </Dialog>

    <!-- Edit User Dialog -->
    <Dialog
      header="Modifica Utente"
      v-model:visible="editUserDialogVisible"
      :breakpoints="{ '960px': '80vw', '640px': '90vw' }"
      :style="{ width: '60vw' }"
      :draggable="false"
      :closeOnEscape="true"
      :dismissableMask="true"
      :showHeader="true"
      :baseZIndex="1000"
      transition="fade"
      modal
    >
      <div class="grid grid-cols-2 gap-4 mt-1">
        <FloatLabel variant="on">
          <InputText
            id="edit_name"
            v-model="selectedUser.name"
            class="w-full"
          />
          <label for="edit_name">Nome</label>
        </FloatLabel>
        <FloatLabel variant="on">
          <InputText
            id="edit_email"
            v-model="selectedUser.email"
            class="w-full"
          />
          <label for="edit_email">Email</label>
        </FloatLabel>
        <FloatLabel variant="on">
          <InputText
            id="edit_internal_code"
            v-model="selectedUser.internal_code"
            class="w-full"
          />
          <label for="edit_internal_code">Codice interno</label>
        </FloatLabel>
        <FloatLabel variant="on">
          <InputText
            id="edit_commercial_code"
            v-model="selectedUser.commercial_code"
            class="w-full"
          />
          <label for="edit_commercial_code">Codice commerciale</label>
        </FloatLabel>
        <FloatLabel variant="on">
          <InputText
            id="edit_production_code"
            v-model="selectedUser.production_code"
            class="w-full"
          />
          <label for="edit_production_code">Codice di produzione</label>
        </FloatLabel>
        <FloatLabel variant="on">
          <MultiSelect
            v-model="selectedUser.roles"
            :options="
              roles.map((r) => ({
                label: r.name.charAt(0).toUpperCase() + r.name.slice(1),
                value: r.name,
              }))
            "
            option-label="label"
            option-value="value"
            class="w-full capitalize"
          />
          <label>Seleziona Ruoli</label>
        </FloatLabel>
        <div class="mt-4 col-span-2 flex justify-end gap-2">
          <Button
            label="Annulla"
            icon="pi pi-times"
            severity="danger"
            text
            @click="closeEditUserDialog"
          />
          <Button label="Salva" icon="pi pi-check" @click="updateUser" />
        </div>
        <div
          v-if="saving"
          class="absolute inset-0 flex items-center justify-center bg-white/50 z-10 rounded-md"
        >
          <ProgressSpinner />
        </div>
      </div>
    </Dialog>

    <!-- Confirm Delete Dialog -->
    <Dialog
      header="Conferma Eliminazione"
      v-model:visible="confirmDeleteDialogVisible"
      :style="{ width: '400px' }"
      :modal="true"
      :closeOnEscape="true"
      :dismissableMask="true"
      transition="fade"
    >
      <div class="confirmation-content flex items-center">
        <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem"></i>
        <span>Sei sicuro di voler eliminare l'utente?</span>
      </div>
      <div
        v-if="saving"
        class="absolute inset-0 flex items-center justify-center bg-white/50 z-10 rounded-md"
      >
        <ProgressSpinner style="width: 50px; height: 50px" strokeWidth="4" />
      </div>
      <template #footer>
        <Button
          label="No"
          icon="pi pi-times"
          severity="secondary"
          class="p-button-text"
          @click="closeConfirmDeleteDialog"
        />
        <Button
          label="Sì"
          icon="pi pi-check"
          severity="danger"
          @click="deleteUser"
        />
      </template>
    </Dialog>
    <!-- View User Dialog -->
    <Dialog
      v-model:visible="viewUserDialogVisible"
      :style="{ minWidth: '420px', maxWidth: '650px', width: '100%' }"
      modal
    >
      <!-- HEADER -->
      <template #header>
        <div class="flex items-center gap-3">
          <Avatar
            :label="getInitials(selectedUser.name)"
            size="large"
            :style="{
              backgroundColor: getRandomColor(selectedUser.id),
            }"
            shape="circle"
          />

          <div class="flex flex-col">
            <span class="font-semibold text-lg">
              {{ selectedUser?.name }}
            </span>
            <span class="text-sm text-gray-500">
              {{ selectedUser?.email }}
            </span>
          </div>
        </div>
      </template>

      <!-- BODY -->
      <div class="flex flex-col gap-4 mt-3">
        <!-- Informazioni -->
        <Panel header="Informazioni" toggleable>
          <div class="flex justify-between py-2">
            <span class="text-gray-500">Codice interno</span>
            <span class="font-medium">
              {{ selectedUser?.internal_code || "-" }}
            </span>
          </div>

          <div class="flex justify-between py-2">
            <span class="text-gray-500">Codice commerciale</span>
            <span class="font-medium">
              {{ selectedUser?.commercial_code || "-" }}
            </span>
          </div>

          <div class="flex justify-between py-2">
            <span class="text-gray-500">Codice produzione</span>
            <span class="font-medium">
              {{ selectedUser?.production_code || "-" }}
            </span>
          </div>
        </Panel>

        <!-- Pratiche -->
        <Panel header="Pratiche" toggleable>
          <div v-if="selectedUser?.allocations_preview?.length">
            <div class="flex flex-col divide-y">
              <RouterLink
                v-for="alloc in selectedUser.allocations_preview"
                :key="alloc.id"
                :to="`/allocations/allocation-details/${alloc.id}`"
                class="flex gap-2 items-center justify-between py-3 px-2 rounded-lg hover:bg-gray-50 transition"
              >
                <span class="font-medium text-gray-700">
                  {{ alloc.name }}
                </span>

                <Tag
                  :value="alloc.is_active ? 'Attiva' : 'Non attiva'"
                  :severity="alloc.is_active ? 'success' : 'danger'"
                />
              </RouterLink>
            </div>

            <Button
              v-if="selectedUser.allocations_count > 1"
              link
              class="mt-3 px-0"
              @click="goToUserAllocations(selectedUser.id)"
            >
              Vedi tutte le {{ selectedUser.allocations_count }} →
            </Button>
          </div>
          <span v-else class="text-gray-400"> Nessuna pratica </span>
        </Panel>

        <!-- Ruoli -->
        <Panel header="Ruoli" toggleable>
          <div class="flex gap-2 flex-wrap">
            <Tag
              v-for="role in selectedUser?.roles"
              :key="role"
              :value="role"
              :severity="getRoleSeverity(role)"
              class="px-3 py-1"
            />
          </div>
        </Panel>
      </div>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import TreeTable from "primevue/treetable";
import Column from "primevue/column";
import Button from "primevue/button";
import Dialog from "primevue/dialog";
import InputText from "primevue/inputtext";
import MultiSelect from "primevue/multiselect";
import { useToast } from "primevue/usetoast";
import { useStore } from "@/store";
import apiClient from "@/router/apiClient";
import FloatLabel from "primevue/floatlabel";
import Card from "primevue/card";
import Avatar from "primevue/avatar";
import Tag from "primevue/tag";
import ToggleSwitch from "primevue/toggleswitch";
import ProgressSpinner from "primevue/progressspinner";
import Panel from "primevue/panel";
import { useRouter } from "vue-router";
import { usePermissions } from "@/composables/usePermissions";

const store = useStore();
const users = ref([]);
const roles = ref(null);
const userMessage = ref("");
const toast = useToast();
const loading = ref(false);
const saving = ref(false);

const { can, canAny } = usePermissions();

const canViewUsers = computed(() => can("users.manage"));

const canInviteUser = computed(() => can("users.invite"));
const canUpdateUser = computed(() => can("users.manage"));
const canDeleteUser = computed(() => can("users.delete"));

const showUserActionsColumn = computed(() =>
  canAny(["users.manage", "users.delete"])
);

const isForbidden = computed(() => !canViewUsers.value);

onMounted(() => {
  if (isForbidden.value) return;

  fetchUsers();
  fetchRoles();
});

const router = useRouter();

const goToUserAllocations = (userId) => {
  router.push({
    path: "/allocations",
    query: {
      user_id: userId,
    },
  });
};

const inviteUserDialogVisible = ref(false);
const inviteForm = ref({
  name: "",
  email: "",
  isAdmin: false,
});

const editUserDialogVisible = ref(false);
const confirmDeleteDialogVisible = ref(false);
const selectedUser = ref(null);
const viewUserDialogVisible = ref(false);

const getInitials = (name) => {
  if (!name) return "";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
};

const getRandomColor = (id) => {
  // Genera un colore basato sull'ID
  const colors = [
    "#2196F3",
    "#4CAF50",
    "#FF9800",
    "#E91E63",
    "#9C27B0",
    "#00BCD4",
  ];
  return colors[id % colors.length];
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

const fetchUsers = async () => {
  loading.value = true;
  try {
    const response = await apiClient.get(`${store.api}/users`, {
      headers: { Authorization: `Bearer ${store.token}` },
    });
    users.value = response.data.data.map((user) => ({
      key: user.id,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        status: user.status,
        internal_code: user.internal_code,
        commercial_code: user.commercial_code,
        production_code: user.production_code,
        roles: Array.isArray(user.roles)
          ? user.roles.map((r) => (typeof r === "string" ? { name: r } : r))
          : [],
      },
    }));
  } catch (error) {
    const status = error?.response?.status;

    if (status === 403) {
      userMessage.value = "Non hai i permessi per visualizzare gli utenti.";
      users.value = [];
      return;
    }

    if (status === 404) {
      userMessage.value = "Nessun dato utente disponibile al momento.";
    } else {
      console.error("Error fetching users:", error);
    }
  } finally {
    loading.value = false;
  }
};

const fetchSingleUser = async (userId) => {
  loading.value = true;
  try {
    const response = await apiClient.get(`${store.api}/users/${userId}`, {
      headers: { Authorization: `Bearer ${store.token}` },
    });
    const user = response.data.data;

    selectedUser.value = {
      ...user,
      roles: user.roles.map((r) => r.name),
    };
  } catch (error) {
    console.error("Error fetching users:", error);
  } finally {
    loading.value = false;
  }
};

const inviteUser = async () => {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const email = inviteForm.value.email.trim();
  const name = inviteForm.value.name.trim();
  const admin = inviteForm.value.isAdmin ? true : null;

  if (!name) {
    toast.add({
      severity: "warn",
      summary: "Errore di Validazione",
      detail: "Il nome è obbligatorio per invitare un utente.",
      life: 3000,
    });
    return;
  }

  if (!email) {
    toast.add({
      severity: "warn",
      summary: "Errore di Validazione",
      detail: "L'email è obbligatoria per invitare un utente.",
      life: 3000,
    });
    return;
  } else if (!emailPattern.test(email)) {
    toast.add({
      severity: "warn",
      summary: "Errore di Validazione",
      detail: "Inserisci un indirizzo email valido.",
      life: 3000,
    });
    return;
  }

  try {
    await apiClient.post(
      `${store.api}/users/invite`,
      { email, name, admin },
      {
        headers: { Authorization: `Bearer ${store.token}` },
      }
    );
    toast.add({
      severity: "success",
      summary: "Successo",
      detail: "Invito inviato con successo.",
      life: 3000,
    });
    inviteForm.value = { name: "", email: "", isAdmin: false }; // Clear the form
    inviteUserDialogVisible.value = false;
    await fetchUsers();
  } catch (error) {
    console.error(
      "Error inviting user:",
      error.response?.data?.message || error.message
    );
    toast.add({
      severity: "error",
      summary: "Errore",
      detail: "Invio dell'invito fallito. Riprova.",
      life: 3000,
    });
  }
};

const viewUser = async (userData) => {
  await fetchSingleUser(userData.data.id);
  viewUserDialogVisible.value = true;
};

const editUser = async (userData) => {
  // selectedUser.value = { ...userData.data };
  // selectedUser.value.roles = selectedUser.value.roles.map((role) => role.name);
  await fetchSingleUser(userData.data.id);
  editUserDialogVisible.value = true;
};

const updateUser = async () => {
  if (!selectedUser.value.name) {
    toast.add({
      severity: "warn",
      summary: "Errore di Validazione",
      detail: "Il nome è obbligatorio.",
      life: 3000,
    });
    return;
  }

  if (!selectedUser.value.email) {
    toast.add({
      severity: "warn",
      summary: "Errore di Validazione",
      detail: "L'email è obbligatoria.",
      life: 3000,
    });
    return;
  }

  try {
    saving.value = true;
    await apiClient.put(
      `${store.api}/users/${selectedUser.value.id}`,
      selectedUser.value,
      { headers: { Authorization: `Bearer ${store.token}` } }
    );
    toast.add({
      severity: "success",
      summary: "Successo",
      detail: "Utente aggiornato con successo.",
      life: 3000,
    });

    editUserDialogVisible.value = false;
    selectedUser.value = null;
    await fetchUsers();
  } catch (error) {
    console.error(
      "Error updating user:",
      error.response?.data?.message || error.message
    );
    toast.add({
      severity: "error",
      summary: "Errore",
      detail:
        error.response?.data?.message ||
        "Aggiornamento utente fallito. Riprova.",
      life: 3000,
    });
  } finally {
    saving.value = false;
  }
};

const confirmDeleteUser = (userData) => {
  selectedUser.value = userData;
  confirmDeleteDialogVisible.value = true;
};

const deleteUser = async () => {
  try {
    saving.value = true;
    await apiClient.delete(`${store.api}/users/${selectedUser.value.key}`, {
      headers: { Authorization: `Bearer ${store.token}` },
    });
    toast.add({
      severity: "success",
      summary: "Successo",
      detail: "Utente eliminato con successo.",
      life: 3000,
    });
    confirmDeleteDialogVisible.value = false;
    selectedUser.value = null;
    await fetchUsers();
  } catch (error) {
    console.error(
      "Error deleting user:",
      error.response?.data?.message || error.message
    );
    toast.add({
      severity: "error",
      summary: "Errore",
      detail: "Eliminazione utente fallita. Riprova.",
      life: 3000,
    });
  } finally {
    saving.value = false;
  }
};

const openInviteUserDialog = () => {
  inviteUserDialogVisible.value = true;
};

const closeInviteUserDialog = () => {
  inviteUserDialogVisible.value = false;
  inviteForm.value = { name: "", email: "", roles: [] };
};

const closeEditUserDialog = () => {
  selectedUser.value = null;
  editUserDialogVisible.value = false;
};

const closeConfirmDeleteDialog = () => {
  confirmDeleteDialogVisible.value = false;
  selectedUser.value = null;
};

const getRoleClass = (roleName) => {
  switch (roleName) {
    case "admin":
      return "chip-admin";
    case "user":
      return "chip-user";
    default:
      return "chip-default";
  }
};

const fetchRoles = async () => {
  loading.value = true;
  try {
    const response = await apiClient.get(`${store.api}/roles`, {
      headers: { Authorization: `Bearer ${store.token}` },
    });
    roles.value = response.data?.data ?? response.data ?? [];
  } catch (error) {
    const status = error?.response?.status;

    if (status === 403) {
      roles.value = [];
      return;
    }

    console.error("Error fetching roles:", error);
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.content-page {
  height: calc(100vh - 70px);
  display: flex;
  flex-direction: column;
}

.card {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}

.table-container {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}

:deep(.p-card-content) {
  padding-top: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
}

:deep(.p-card-body) {
  height: 100%;
  display: flex;
  flex-direction: column;
}
</style>