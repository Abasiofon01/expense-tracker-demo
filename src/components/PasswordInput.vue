<template>
  <div class="password-field">
    <input
      :id="id"
      :name="name"
      :type="show ? 'text' : 'password'"
      :placeholder="placeholder"
      :autocomplete="autocomplete"
      v-model="internalValue"
      :disabled="disabled"
      :required="required"
      @input="$emit('update:modelValue', internalValue)"
      class="password-input"
    />
    <button
      type="button"
      class="toggle-visibility"
      @click="show = !show"
      :disabled="disabled"
      :aria-label="show ? 'Hide password' : 'Show password'"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path v-if="!show" d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle v-if="!show" cx="12" cy="12" r="3" />
        <path v-if="show" d="m9.88 9.88a3 3 0 1 0 4.24 4.24" />
        <path
          v-if="show"
          d="m10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 11 8 11 8a13.16 13.16 0 0 1-1.67 2.68"
        />
        <path
          v-if="show"
          d="M6.61 6.61A13.526 13.526 0 0 0 1 12s4 8 11 8a9.74 9.74 0 0 0 5.39-1.61"
        />
        <line v-if="show" x1="2" x2="22" y1="2" y2="22" />
      </svg>
    </button>
  </div>
</template>

<script setup>
import { ref, watch, defineProps, defineEmits } from "vue";

const props = defineProps({
  modelValue: {
    type: String,
    default: "",
  },
  placeholder: {
    type: String,
    default: "",
  },
  id: {
    type: String,
    default: null,
  },
  name: {
    type: String,
    default: null,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  required: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:modelValue"]);

// Local v-model proxy
const internalValue = ref(props.modelValue);
watch(
  () => props.modelValue,
  (v) => {
    internalValue.value = v;
  }
);

// Show/hide toggle - password hidden by default
const show = ref(false);

// Autofill attribute: default to "new-password"
const autocomplete = ref("new-password");
watch(
  () => props.name,
  (n) => {
    if (n === "currentPassword") autocomplete.value = "current-password";
    else if (n === "password" || n === "newPassword")
      autocomplete.value = "new-password";
    else autocomplete.value = "password";
  },
  { immediate: true }
);
</script>

<style scoped lang="scss">
.password-field {
  position: relative;
  display: flex;
  align-items: center;
  height: 48px;
  width: 100%;
  font-size: clamp(0.875rem, 0.8409rem + 0.1818vw, 1rem);
  border: 1px solid #ddd;
  border-radius: 6px;
  outline: none;
  transition: border-color 0.2s, background-color 0.2s;

  &:focus-within {
    box-shadow: 0 1px 0 rgba(0, 0, 0, 0.2);
  }

  &.error {
    border-color: #ef4444;
    background-color: #fef2f2;
  }

  .password-input {
    border: none;
    background: transparent;
    outline: none;
    flex: 1;
    padding-right: 2.5rem; /* Add space for the icon */
    font-size: inherit;
    height: 100%;
  }

  .toggle-visibility {
    position: absolute;
    right: 0.75rem;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #6b7280;
    transition: color 0.2s ease;
  }

  .toggle-visibility:hover:not(:disabled) {
    color: #374151;
  }

  .toggle-visibility:disabled {
    color: #d1d5db;
    cursor: not-allowed;
  }

  .toggle-visibility svg {
    width: 20px;
    height: 20px;
  }
}
</style>
