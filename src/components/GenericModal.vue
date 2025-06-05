<template>
  <div v-if="visible" class="modal-overlay" @click="handleOverlayClick">
    <div class="modal-container" :class="containerClass" @click.stop>
      <div class="modal-header">
        <h3 class="modal-title">
          {{ title }}
        </h3>
        <button class="modal-close-btn" @click="$emit('close')" type="button">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fill-rule="evenodd"
              clip-rule="evenodd"
              d="M5.29289 5.29289C5.68342 4.90237 6.31658 4.90237 6.70711 5.29289L12 10.5858L17.2929 5.29289C17.6834 4.90237 18.3166 4.90237 18.7071 5.29289C19.0976 5.68342 19.0976 6.31658 18.7071 6.70711L13.4142 12L18.7071 17.2929C19.0976 17.6834 19.0976 18.3166 18.7071 18.7071C18.3166 19.0976 17.6834 19.0976 17.2929 18.7071L12 13.4142L6.70711 18.7071C6.31658 19.0976 5.68342 19.0976 5.29289 18.7071C4.90237 18.3166 4.90237 17.6834 5.29289 17.2929L10.5858 12L5.29289 6.70711C4.90237 6.31658 4.90237 5.68342 5.29289 5.29289Z"
              fill="currentColor"
            />
          </svg>
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="modal-form">
        <slot name="form-content" :form="form" :errors="errors"></slot>

        <div class="modal-actions">
          <button
            type="button"
            class="btn btn-secondary"
            @click="$emit('close')"
          >
            {{ cancelText }}
          </button>
          <button
            type="submit"
            class="btn btn-primary"
            :disabled="loading || !isFormValid"
          >
            <span v-if="loading">
              {{ loadingText }}
            </span>
            <span v-else>
              {{ submitText }}
            </span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch, nextTick, computed } from "vue";

const props = defineProps({
  visible: { type: Boolean, default: false },
  title: { type: String, required: true },
  data: { type: Object, default: () => ({}) },
  isEditing: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  containerClass: { type: String, default: "" },
  cancelText: { type: String, default: "Cancel" },
  submitText: { type: String, default: "Save" },
  loadingText: { type: String, default: "Saving..." },
  validationRules: { type: Object, default: () => ({}) },
});

const emit = defineEmits(["close", "submit"]);

const form = reactive({});
const errors = reactive({});

// Check if form is valid based on validation rules
const isFormValid = computed(() => {
  if (Object.keys(props.validationRules).length === 0) return true;

  return Object.keys(props.validationRules).every((field) => {
    const rules = props.validationRules[field];
    const value = form[field];

    // Check required rule
    if (
      rules.required &&
      (!value || (typeof value === "string" && !value.trim()))
    ) {
      return false;
    }

    return true;
  });
});

// Reset form and errors
const resetForm = () => {
  Object.keys(form).forEach((key) => delete form[key]);
  Object.keys(errors).forEach((key) => delete errors[key]);
};

// Validate individual field
const validateField = (field, value) => {
  const rules = props.validationRules[field];
  if (!rules) return "";

  // Required validation
  if (
    rules.required &&
    (!value || (typeof value === "string" && !value.trim()))
  ) {
    return rules.requiredMessage || `${field} is required`;
  }

  // String validations
  if (typeof value === "string" && value.trim()) {
    if (rules.minLength && value.trim().length < rules.minLength) {
      return (
        rules.minLengthMessage ||
        `${field} must be at least ${rules.minLength} characters`
      );
    }

    if (rules.maxLength && value.trim().length > rules.maxLength) {
      return (
        rules.maxLengthMessage ||
        `${field} must not exceed ${rules.maxLength} characters`
      );
    }

    if (rules.pattern && !rules.pattern.test(value.trim())) {
      return rules.patternMessage || `${field} format is invalid`;
    }
  }

  // Number validations
  if (
    typeof value === "number" ||
    (typeof value === "string" && !isNaN(Number(value)))
  ) {
    const numValue = Number(value);

    if (rules.min !== undefined && numValue < rules.min) {
      return rules.minMessage || `${field} must be at least ${rules.min}`;
    }

    if (rules.max !== undefined && numValue > rules.max) {
      return rules.maxMessage || `${field} must not exceed ${rules.max}`;
    }
  }

  // Custom validation function
  if (rules.custom && typeof rules.custom === "function") {
    const customResult = rules.custom(value, form);
    if (customResult !== true) {
      return customResult || `${field} is invalid`;
    }
  }

  return "";
};

// Validate entire form
const validateForm = () => {
  let isValid = true;

  Object.keys(props.validationRules).forEach((field) => {
    const error = validateField(field, form[field]);
    errors[field] = error;
    if (error) isValid = false;
  });

  return isValid;
};

// Handle form submission
const handleSubmit = async () => {
  if (!validateForm()) return;

  emit("submit", { ...form });
};

// Handle overlay click to close modal
const handleOverlayClick = () => {
  emit("close");
};

// Watch for prop changes to populate form
watch(
  () => props.data,
  (newData) => {
    if (newData && Object.keys(newData).length > 0) {
      Object.keys(newData).forEach((key) => {
        form[key] = newData[key];
      });
    } else {
      resetForm();
    }
  },
  { immediate: true }
);

// Watch visibility to reset form when modal opens
watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      nextTick(() => {
        // Focus on first input when modal opens
        const firstInput = document.querySelector(
          ".modal-container input, .modal-container textarea, .modal-container select"
        );
        if (firstInput) {
          firstInput.focus();
        }
      });
    } else {
      resetForm();
    }
  }
);

// Validate fields on change
watch(
  () => ({ ...form }),
  () => {
    Object.keys(form).forEach((field) => {
      if (props.validationRules[field]) {
        errors[field] = validateField(field, form[field]);
      }
    });
  },
  { deep: true }
);
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-container {
  background: white;
  border-radius: 8px;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
}

.modal-close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6b7280;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}

.modal-close-btn:hover {
  background-color: #f3f4f6;
  color: #374151;
}

.modal-form {
  padding: 1.5rem;
}

.modal-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
  margin-top: 1.5rem;
}
</style>
