<template>
  <AuthForm
    :loading="loading"
    :error="error"
    :successMessage="successMessage"
    :errors="errors"
    :disable="hasValidationErrors"
    @submit="onSubmit"
    autocomplete="on"
    novalidate
  >
    <template #header>Signup</template>

    <!-- First Name -->
    <div class="form-field">
      <input
        id="firstName"
        name="firstName"
        v-model="firstName"
        type="text"
        autocomplete="given-name"
        placeholder="First name"
        :class="{ error: errors.firstName }"
        @input="clearError('firstName')"
        minlength="2"
      />
      <div v-if="errors.firstName" class="error-message">
        {{ errors.firstName }}
      </div>
    </div>

    <!-- Last Name -->
    <div class="form-field">
      <input
        id="lastName"
        name="lastName"
        v-model="lastName"
        type="text"
        autocomplete="family-name"
        placeholder="Last name"
        :class="{ error: errors.lastName }"
        @input="clearError('lastName')"
        minlength="2"
      />
      <div v-if="errors.lastName" class="error-message">
        {{ errors.lastName }}
      </div>
    </div>

    <!-- Email -->
    <div class="form-field">
      <input
        id="email"
        name="email"
        v-model="email"
        type="email"
        autocomplete="email"
        placeholder="Email"
        :class="{ error: errors.email }"
        @input="clearError('email')"
      />
      <div v-if="errors.email" class="error-message">
        {{ errors.email }}
      </div>
    </div>

    <!-- Password -->
    <div class="form-field">
      <PasswordInput
        id="password"
        name="password"
        v-model="password"
        placeholder="Password"
        :class="{ error: errors.password }"
        @update:modelValue="clearError('password')"
      />
      <div v-if="errors.password" class="error-message">
        {{ errors.password }}
      </div>
    </div>

    <!-- Role (hidden) -->
    <!-- You could expose a select if you want users to choose role;
         here it's hard‐coded to "user," so we keep it as a hidden input. -->
    <input type="hidden" id="role" name="role" v-model="role" />

    <!-- Agree to Terms -->
    <div class="checkbox-group" :class="{ error: errors.agreeTerms }">
      <div class="input-wrapper">
        <input
          id="agreeTerms"
          name="agreeTerms"
          v-model="agreeTerms"
          type="checkbox"
          @change="clearError('agreeTerms')"
        />
        <label for="agreeTerms">I agree to the Terms & Conditions</label>
      </div>
      <div v-if="errors.agreeTerms" class="error-message">
        {{ errors.agreeTerms }}
      </div>
    </div>

    <template #buttonText>Signup</template>

    <template #footer>
      Already have an account?
      <router-link to="/login">Login</router-link>
    </template>
  </AuthForm>
</template>

<script setup>
import { ref, reactive, computed } from "vue";
import { useAuthStore } from "@/stores/auth";
import AuthForm from "../components/AuthForm.vue";
import PasswordInput from "../components/PasswordInput.vue";

const firstName = ref("");
const lastName = ref("");
const email = ref("");
const password = ref("");
const role = ref("user");
const agreeTerms = ref(false);
const loading = ref(false);
const error = ref(null);
const successMessage = ref("");
const showBanner = ref(false);
const auth = useAuthStore();

// Reactive errors object to track all validation errors
const errors = reactive({
  firstName: null,
  lastName: null,
  email: null,
  password: null,
  agreeTerms: null,
});

// Check if there are any validation errors
const hasValidationErrors = computed(() => {
  return Object.values(errors).some((error) => error !== null);
});

// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Password validation (at least 8 characters, 1 uppercase, 1 lowercase, 1 number)
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;

// Function to clear specific error when user starts typing/changing input
function clearError(fieldName) {
  if (errors[fieldName]) {
    errors[fieldName] = null;
  }
  // Also clear general error message when user starts correcting inputs
  if (error.value) {
    error.value = null;
  }
}

function validateForm() {
  // Clear previous errors
  Object.keys(errors).forEach((key) => {
    errors[key] = null;
  });

  let isValid = true;

  // First name validation
  if (!firstName.value.trim()) {
    errors.firstName = "First name is required";
    isValid = false;
  } else if (firstName.value.trim().length < 2) {
    errors.firstName = "First name must be at least 2 characters";
    isValid = false;
  }

  // Last name validation
  if (!lastName.value.trim()) {
    errors.lastName = "Last name is required";
    isValid = false;
  } else if (lastName.value.trim().length < 2) {
    errors.lastName = "Last name must be at least 2 characters";
    isValid = false;
  }

  // Email validation
  if (!email.value.trim()) {
    errors.email = "Email is required";
    isValid = false;
  } else if (!emailRegex.test(email.value.trim())) {
    errors.email = "Please enter a valid email address";
    isValid = false;
  }

  // Password validation
  if (!password.value) {
    errors.password = "Password is required";
    isValid = false;
  } else if (password.value.length < 8) {
    errors.password = "Password must be at least 8 characters";
    isValid = false;
  } else if (!passwordRegex.test(password.value)) {
    errors.password =
      "Password must contain at least one uppercase letter, one lowercase letter, and one number";
    isValid = false;
  }

  // Terms agreement validation
  if (!agreeTerms.value) {
    errors.agreeTerms = "You must agree to the terms and conditions";
    isValid = false;
  }

  return isValid;
}

async function onSubmit() {
  // Clear previous errors and messages
  error.value = null;
  successMessage.value = "";
  showBanner.value = false;

  // Validate form before submission
  if (!validateForm()) {
    return; // Stop submission if validation fails
  }

  loading.value = true;

  try {
    const { user } = await auth.signUp(
      email.value.trim(),
      password.value,
      firstName.value.trim(),
      lastName.value.trim(),
      role.value
    );

    if (user && !user.email_confirmed_at) {
      showBanner.value = true;
      successMessage.value = "Please check your email to verify your account.";
    }
  } catch (err) {
    // Handle specific error cases
    if (err.message.includes("email")) {
      errors.email = "This email is already registered";
    } else if (err.message.includes("password")) {
      errors.password = "Password does not meet requirements";
    } else {
      error.value = err.message || "An error occurred during signup";
    }
  } finally {
    loading.value = false;
  }
}
</script>
