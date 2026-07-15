<template>
  <FloatLabel variant="on">
    <IconField>
      <InputIcon class="pi pi-lock" style="z-index: 1" />
      <Password
        :id="id"
        :model-value="modelValue"
        toggleMask
        :feedback="false"
        :invalid="invalid"
        class="w-full"
        :inputStyle="{
          paddingLeft:
            'calc((var(--p-form-field-padding-x) * 2) + var(--p-icon-size))',
          paddingRight: 'var(--p-form-field-padding-x)',
          width: '100%',
        }"
        @input="updateValue($event.target.value)"
        :inputProps="{
          autocomplete: 'new-password',
          name: 'oldPassCustom',
        }"
      />
    </IconField>
    <label :for="id">{{ label }}</label>
  </FloatLabel>
</template>
  
<script setup>
import { defineProps, defineEmits } from "vue";
import Password from "primevue/password";
import IconField from "primevue/iconfield";
import InputIcon from "primevue/inputicon";
import FloatLabel from "primevue/floatlabel";

const props = defineProps({
  id: String,
  modelValue: String,
  label: String,
  invalid: Boolean,
});

const emit = defineEmits(["update:modelValue"]);

const updateValue = (value) => {
  emit("update:modelValue", value);
};
</script>