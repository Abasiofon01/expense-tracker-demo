<template>
  <div class="auth-form">
    <header><slot name="header" /></header>
    <form @submit.prevent="$emit('submit')">
      <slot />
      <button
        v-if="$slots.buttonText"
        type="submit"
        class="button"
        :disabled="loading || disable"
      >
        <span v-if="!loading"><slot name="buttonText" /></span>
        <span v-else class="spinner" />
      </button>
      <p v-if="error" class="error-text">{{ error }}</p>
      <p v-if="successMessage" class="success-text">
        {{ successMessage }}
      </p>
      <slot name="extra" />
    </form>
    <div v-if="$slots.footer" class="footer-text">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  loading: Boolean,
  disable: Boolean,
  error: String,
  successMessage: String,
  errors: {
    type: Object,
    default: () => ({}),
  },
});
const emit = defineEmits(["submit"]);
</script>

<style lang="scss">
.auth-form {
  max-width: 430px;
  margin: 0 auto;
  width: 100%;
  background: #fff;
  border-radius: 7px;
  box-shadow: 0 5px 10px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1.5rem 1rem;

  @media (min-width: 768px) {
    padding: 2rem;
  }

  header {
    font-size: clamp(1.5rem, 1.3636rem + 0.7273vw, 2rem);
    font-weight: 500;
    text-align: center;
  }

  form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  input,
  select,
  textarea {
    height: 48px;
    width: 100%;
    padding: 0 15px;
    font-size: clamp(0.875rem, 0.8409rem + 0.1818vw, 1rem);
    border: 1px solid #ddd;
    border-radius: 6px;
    outline: none;
    transition: border-color 0.2s, background-color 0.2s;

    &:focus {
      box-shadow: 0 1px 0 rgba(0, 0, 0, 0.2);
    }

    &.error {
      border-color: #ef4444;
      background-color: #fef2f2;
    }
  }

  // .form-field {
  // }

  .checkbox-group {
    display: flex;
    flex-direction: column;

    &.error {
      border-color: #ef4444;
    }

    .input-wrapper {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }

    input {
      width: auto;
      height: auto;
      margin: 0;
      flex-shrink: 0;
    }

    label {
      margin: 0;
      cursor: pointer;
    }
  }

  .error-message {
    color: #ef4444;
    font-size: 0.875rem;
    margin-top: 0.25rem;
    line-height: 1.4;
  }

  .error-text {
    color: #ef4444;
    font-size: 0.875rem;
    margin-top: 0.5rem;
    text-align: center;
  }

  .success-text {
    color: #16a34a;
    font-size: 0.875rem;
    margin-top: 0.5rem;
    text-align: center;
  }

  .banner {
    background-color: #d1fae5;
    color: #065f46;
    padding: 0.75rem;
    border-radius: 0.375rem;
    margin-top: 1rem;
    text-align: center;
  }

  a {
    font-size: clamp(0.75rem, 0.6818rem + 0.3636vw, 1rem);
    color: #009579;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }

  button.button {
    position: relative;
    height: 48px;
    width: 100%;
    border: none;
    border-radius: 6px;
    background: #009579;
    color: #fff;
    font-size: clamp(0.875rem, 0.8409rem + 0.1818vw, 1rem);
    font-weight: 500;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.4s;

    &:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }

    &:hover:enabled {
      background: #006653;
    }
  }

  .footer-text {
    font-size: 17px;
    text-align: center;

    label {
      color: #009579;
      cursor: pointer;

      &:hover {
        text-decoration: underline;
      }
    }
  }

  .spinner {
    width: 20px;
    height: 20px;
    border: 2px solid rgba(255, 255, 255, 0.6);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    display: inline-block;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
}
</style>
