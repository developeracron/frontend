<template>
  <div>
    <Button
      v-if="canManageReminders"
      type="button"
      icon="pi pi-bell"
      outlined
      @click="open()"
      class="!p-2 [&_.pi]:text-[13px] !leading-none"
    />
    <Dialog
      v-model:visible="showReminderDialog"
      :modal="true"
      header="Aggiungi promemoria"
    >
      <div class="w-full min-w-96 py-4">
        <FloatLabel variant="on" class="w-full">
          <InputText v-model="title" class="w-full" @input="titleTouched = true" />
          <label>Titolo</label>
        </FloatLabel>
      </div>
      <div
          v-if="entity_type !== 'allocation-phases' && props.entity?.end_date"
          class="w-[25rem] pb-4 pl-4 flex items-center gap-4"
      >
        <ToggleSwitch v-model="recursiveDate" class="toggle-reminder" />
        <div>Ricorsivo</div>
      </div>
      <div v-if="recursiveDate" class="flex flex-col items-center gap-4 pb-4">
        <div class="flex items-center gap-2">
          <div>Si ripete ogni</div>
          <InputNumber
            class="custom-input-number"
            v-model="daysInterval"
            showButtons
            buttonLayout="horizontal"
            :min="1"
            :max="99"
          >
            <template #incrementicon>
              <span class="pi pi-plus" />
            </template>
            <template #decrementicon>
              <span class="pi pi-minus" />
            </template>
          </InputNumber>
          <div>{{ daysInterval === 1 ? "giorno" : "giorni" }}</div>
        </div>
        <div class="flex items-center gap-2">
          <InputNumber
            class="custom-input-number"
            v-model="monthsInterval"
            showButtons
            buttonLayout="horizontal"
            :min="1"
            :max="99"
          >
            <template #incrementicon>
              <span class="pi pi-plus" />
            </template>
            <template #decrementicon>
              <span class="pi pi-minus" />
            </template>
          </InputNumber>
          <div>
            {{ monthsInterval === 1 ? "mese" : "mesi" }} prima di finire
          </div>
        </div>
      </div>
      <div class="flex justify-center">
        <DatePicker
          inline
          id="reminder_date"
          dateFormat="dd.mm.yy"
          v-model="reminderDate"
          :minDate="minDate"
          :maxDate="maxDate"
          :disabledDates="disabledDates"
        />
      </div>
      <div class="flex justify-end mt-4">
        <Button
          label="Salva"
          severity="success"
          outlined
          icon="pi pi-check"
          class="p-button-primary"
          :disabled="recursiveDate ? false : !reminderDate"
          @click="saveReminderDate"
        />
      </div>
      <div
        v-if="saving"
        class="absolute inset-0 flex items-center justify-center bg-white/50 z-10 rounded-md"
      >
        <ProgressSpinner style="width: 50px; height: 50px" strokeWidth="4" />
      </div>
    </Dialog>
  </div>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import Dialog from "primevue/dialog";
import DatePicker from "primevue/datepicker";
import Button from "primevue/button";
import ToggleSwitch from "primevue/toggleswitch";
import InputNumber from "primevue/inputnumber";
import InputText from "primevue/inputtext";
import apiClient from "@/router/apiClient";
import { useStore } from "@/store";
import { useToast } from "primevue/usetoast";
import { formatDateIso } from "@/utils/dateUtils";
import ProgressSpinner from "primevue/progressspinner";
import FloatLabel from "primevue/floatlabel";
import {buildReminderTitle} from "@/utils/reminderTitle";
import { usePermissions } from "@/composables/usePermissions";

const props = defineProps({
  entity: Object,
  entity_type: String,

  parent: Object,
  parent_type: String,
});

const reminderDate = ref(null);
const showReminderDialog = ref(false);
const minDate = ref(null);
const maxDate = ref(null);
const recursiveDate = ref(false);
const daysInterval = ref(7);
const monthsInterval = ref(1);
const disabledDates = ref([]);
const store = useStore();
const toast = useToast();
const { can } = usePermissions();
const canManageReminders = computed(() => can("reminders.manage"));
const message = ref("");
const saving = ref(false);

const title = ref("");
const titleTouched = ref(false);


const computeTitle = () =>
    buildReminderTitle({
      entityType: props.entity_type,
      entity: props.entity,
      parentType: props.parent_type,
      parent: props.parent,
    });

watch(
    () => [props.entity, props.entity_type, props.parent, props.parent_type],
    () => {
      if (!titleTouched.value) title.value = computeTitle();
    },
    { immediate: true }
);

watch(
    () => showReminderDialog.value,
    (open) => {
      if (!open) titleTouched.value = false;
    }
);

const open = () => {
  if (!canManageReminders.value) return;
  setMinMaxDate();
  showReminderDialog.value = true;
  if (!titleTouched.value) title.value = computeTitle();
};

defineExpose({ open });

const fetchReminders = async () => {
  try {
    const entityType = props.entity_type;
    const idEntity = props.entity?.id;

    const response = await apiClient.get(
      `${store.api}/${entityType}/${idEntity}/reminders`,
      {
        headers: { Authorization: `Bearer ${store.token}` },
      }
    );

    if (response.data.data.length === 0) {
      message.value = "Nessun promemoria trovato.";
    } else {
      disabledDates.value = response.data.data;
    }
  } catch (error) {
    if (error.response && error.response.status === 404) {
      message.value = "Nessun promemoria ancora disponibile.";
    } else {
      console.error("Error fetching reminders:", error);
    }
  }
};

const saveReminderDate = async () => {
  try {
    saving.value = true;
    const entityType = props.entity_type;
    const idEntity = props.entity?.id;

    const payload = recursiveDate.value
      ? {
          type: "recurring",
          days_interval: daysInterval.value,
          months_before: monthsInterval.value,
          title: title.value,
        }
      : {
          type: "single",
          date: formatDateIso(reminderDate.value),
          title: title.value,
        };

    const response = await apiClient.post(
      `${store.api}/${entityType}/${idEntity}/reminders`,
      payload,
      {
        headers: { Authorization: `Bearer ${store.token}` },
      }
    );
    if (response.data.message) {
      reminderDate.value = null;
      showReminderDialog.value = false;
      toast.add({
        severity: "success",
        summary: "Successo",
        detail: "Promemoria aggiunto con successo.",
        life: 3000,
      });
    }
  } catch (error) {
    console.error("Error saving reminder:", error.message);
    toast.add({
      severity: "error",
      summary: "Errore aggiungere promemoria",
      detail: "Salvamento non riuscito.",
      life: 3000,
    });
  } finally {
    saving.value = false;
  }
};

const setMinMaxDate = () => {
  if (props.entity?.end_date) {
    const max = new Date(props.entity?.end_date);
    max.setDate(max.getDate() - 1);

    minDate.value = props.entity?.start_date
      ? new Date(props.entity?.start_date)
      : null;
    maxDate.value = max < minDate.value ? minDate.value : max;
  }
};
</script>

<style scoped>
.toggle-reminder {
  --p-toggleswitch-width: 34px;
  --p-toggleswitch-height: 18px;
  --p-toggleswitch-handle-size: 12px;
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
</style>
