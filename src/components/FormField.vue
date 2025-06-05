<template>
  <div class="form-group">
    <label v-if="label" :for="fieldId" class="form-label">
      {{ label }}
      <span v-if="required" class="required">*</span>
    </label>

    <!-- Text Input -->
    <input
      v-if="type === 'text' || type === 'email' || type === 'password'"
      :id="fieldId"
      :type="type"
      :value="modelValue"
      @input="$emit('update:modelValue', $event.target.value)"
      :placeholder="placeholder"
      :required="required"
      :disabled="disabled"
      :class="inputClasses"
      class="form-input"
    />

    <!-- Number Input -->
    <input
      v-else-if="type === 'number'"
      :id="fieldId"
      type="number"
      :value="modelValue"
      @input="$emit('update:modelValue', Number($event.target.value))"
      :placeholder="placeholder"
      :required="required"
      :disabled="disabled"
      :min="min"
      :max="max"
      :step="step"
      :class="inputClasses"
      class="form-input"
    />

    <!-- Date Input -->
    <input
      v-else-if="type === 'date'"
      :id="fieldId"
      type="date"
      :value="modelValue"
      @input="$emit('update:modelValue', $event.target.value)"
      :required="required"
      :disabled="disabled"
      :class="inputClasses"
      class="form-input"
    />

    <!-- Textarea -->
    <textarea
      v-else-if="type === 'textarea'"
      :id="fieldId"
      :value="modelValue"
      @input="$emit('update:modelValue', $event.target.value)"
      :placeholder="placeholder"
      :required="required"
      :disabled="disabled"
      :rows="rows"
      :class="inputClasses"
      class="form-input"
    ></textarea>

    <!-- Select -->
    <select
      v-else-if="type === 'select'"
      :id="fieldId"
      :value="modelValue"
      @change="$emit('update:modelValue', $event.target.value)"
      :required="required"
      :disabled="disabled"
      :class="inputClasses"
      class="form-input"
    >
      <option value="" v-if="placeholder">{{ placeholder }}</option>
      <option
        v-for="option in options"
        :key="option.value"
        :value="option.value"
      >
        {{ option.label }}
      </option>
    </select>

    <!-- Radio Buttons -->
    <div v-else-if="type === 'radio'" :id="fieldId" class="radio-group">
      <label
        v-for="option in options"
        :key="option.value"
        class="radio-wrapper"
        :class="{ 'radio-wrapper-disabled': disabled }"
      >
        <input
          type="radio"
          :name="fieldId"
          :value="option.value"
          :checked="modelValue === option.value"
          @change="$emit('update:modelValue', option.value)"
          :disabled="disabled"
          class="radio-input"
        />
        <span class="radio-custom"></span>
        <span class="radio-label">{{ option.label }}</span>
      </label>
    </div>

    <!-- Checkbox -->
    <label
      v-else-if="type === 'checkbox'"
      :for="fieldId"
      class="checkbox-wrapper"
    >
      <input
        :id="fieldId"
        type="checkbox"
        :checked="modelValue"
        @change="$emit('update:modelValue', $event.target.checked)"
        :disabled="disabled"
        class="checkbox-input"
      />
      <span class="checkbox-label">{{ checkboxLabel }}</span>
    </label>

    <span v-if="error" class="error-message">{{ error }}</span>
    <span v-if="hint && !error" class="hint-message">{{ hint }}</span>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  modelValue: { type: [String, Number, Boolean], default: "" },
  type: { type: String, default: "text" },
  label: { type: String, default: "" },
  placeholder: { type: String, default: "" },
  required: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  error: { type: String, default: "" },
  hint: { type: String, default: "" },

  // Number input props
  min: { type: Number, default: undefined },
  max: { type: Number, default: undefined },
  step: { type: Number, default: 1 },

  // Textarea props
  rows: { type: Number, default: 3 },

  // Select props
  options: { type: Array, default: () => [] },

  // Checkbox props
  checkboxLabel: { type: String, default: "" },
});

const emit = defineEmits(["update:modelValue"]);

const fieldId = computed(
  () => `field-${Math.random().toString(36).substr(2, 9)}`
);

const inputClasses = computed(() => ({
  error: !!props.error,
}));
</script>

<style lang="scss" scoped>
.form-group {
  margin-bottom: 1.5rem;
}

.form-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
}

.required {
  color: #dc2626;
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: #d1d5db;
  box-shadow: 0 0 0 3px rgba(178, 202, 240, 0.1);
}

.form-input.error {
  border-color: #dc2626;
}

.form-input.error:focus {
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
}

.form-input:disabled {
  background-color: #f9fafb;
  color: #6b7280;
  cursor: not-allowed;
}

.checkbox-wrapper {
  display: flex;
  align-items: center;
  cursor: pointer;
  font-weight: normal;
  margin-bottom: 0;
}

.checkbox-input {
  width: auto;
  margin-right: 0.5rem;
  padding: 0;
}

.checkbox-label {
  font-size: 0.875rem;
  color: #374151;
}

.error-message {
  display: block;
  font-size: 0.875rem;
  color: #dc2626;
  margin-top: 0.5rem;
}

.hint-message {
  display: block;
  font-size: 0.875rem;
  color: #6b7280;
  margin-top: 0.5rem;
}

select.form-input {
  cursor: pointer;
}

textarea.form-input {
  resize: vertical;
  min-height: 80px;
}

/* Minimal Radio Button Styles */
.radio-group {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.radio-wrapper {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 4px;
  transition: background-color 0.15s ease;
  position: relative;
}

.radio-wrapper:hover {
  background-color: #f9fafb;
}

.radio-wrapper-disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.radio-input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
  border: none;
  outline: none;
}

.radio-custom {
  width: 16px;
  height: 16px;
  border: 2px solid #d1d5db;
  border-radius: 50%;
  margin-right: 0.5rem;
  position: relative;
  background-color: #ffffff;
  transition: border-color 0.15s ease;
  flex-shrink: 0;
}

.radio-input:checked + .radio-custom {
  border-color: #6b7280;
}

.radio-input:checked + .radio-custom::after {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: #6b7280;
}

.radio-wrapper:hover .radio-custom {
  border-color: #9ca3af;
}

.radio-input:disabled + .radio-custom {
  border-color: #e5e7eb;
  background-color: #f9fafb;
}

.radio-input:disabled:checked + .radio-custom::after {
  background-color: #d1d5db;
}

.radio-label {
  font-size: 0.875rem;
  color: #374151;
}

.radio-wrapper-disabled .radio-label {
  color: #9ca3af;
}

.radio-input:focus + .radio-custom {
  outline: none;
}
</style>
