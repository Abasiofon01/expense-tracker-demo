<template>
  <div>
    <GenericTable
      :data="purposes"
      :loading="loading"
      title="Transaction Purpose Management"
      entity-name="Purpose"
      :columns="tableColumns"
      key-field="id"
      :show-actions="editable"
      :actions="tableActions"
      :show-add-button="editable"
      :show-pagination="true"
      :per-page-options="[10, 20, 50, 100]"
      :default-per-page="20"
      filter-text="Filter Purposes"
      filter-dropdown-title="Purpose Filters"
      :empty-icon="emptyPurposeIcon"
      :preview-columns="deletePreviewColumns"
      @add="openAddModal"
      @edit="handleEdit"
      @delete="handleDelete"
    >
      <!-- Custom cell templates -->
      <template #cell-name="{ value }">
        <span class="name-cell">{{ value }}</span>
      </template>

      <template #cell-created_at="{ value }">
        <span class="date-cell">
          {{ new Date(value).toLocaleDateString() }}
        </span>
      </template>
    </GenericTable>

    <!-- Transaction Purpose Modal -->
    <GenericModal
      v-if="showModal && editable"
      :visible="showModal"
      :title="isEditing ? 'Edit Purpose' : 'Add New Purpose'"
      :data="selectedPurpose"
      :is-editing="isEditing"
      :loading="modalLoading"
      :validation-rules="validationRules"
      submit-text="Save Purpose"
      loading-text="Saving..."
      @close="closeModal"
      @submit="handleSubmit"
    >
      <template #form-content="{ form, errors }">
        <FormField
          v-model="form.name"
          type="text"
          label="Purpose Name"
          placeholder="Enter purpose name"
          :required="true"
          :error="errors.name"
        />
      </template>
    </GenericModal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import GenericTable from "../components/GenericTable.vue"; // Adjust path as needed
import GenericModal from "../components/GenericModal.vue";
import FormField from "../components/FormField.vue";
import { useTransactionPurposes } from "../stores/transaction_purposes";

const props = defineProps({
  editable: { type: Boolean, default: true },
});

const emit = defineEmits(["update:loading"]);

const {
  purposes,
  loading,
  fetchPurposes,
  deletePurpose,
  createPurpose,
  updatePurpose,
} = useTransactionPurposes();

const showModal = ref(false);
const selectedPurpose = ref({});
const isEditing = ref(false);
const modalLoading = ref(false);

// Table configuration
const tableColumns = [
  {
    key: "name",
    label: "Purpose Name",
    cellClass: "name-cell",
    sortable: true,
  },
  {
    key: "created_at",
    label: "Created Date",
    type: "date",
    cellClass: "date-cell",
    sortable: true,
    formatter: (value) => new Date(value).toLocaleDateString(),
  },
];

const tableActions = [
  { key: "edit", label: "Edit", class: "" },
  { key: "delete", label: "Delete", class: "" },
];

// Empty state icon for purposes
const emptyPurposeIcon = {
  template: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor">
    <path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM216 336h24V272H216c-13.3 0-24-10.7-24-24s10.7-24 24-24h48c13.3 0 24 10.7 24 24v88h8c13.3 0 24 10.7 24 24s-10.7 24-24 24H216c-13.3 0-24-10.7-24-24s10.7-24 24-24zm40-208a32 32 0 1 1 0 64 32 32 0 1 1 0-64z"/>
  </svg>`,
};

// Delete preview columns - what to show in delete confirmation
const deletePreviewColumns = [
  {
    key: "name",
    label: "Purpose Name",
  },
  {
    key: "created_at",
    label: "Created Date",
    formatter: (value) => new Date(value).toLocaleDateString(),
  },
];

// Filter categories - computed based on actual purpose data
// const filterCategories = computed(() => {
//   return [
//     {
//       key: "date",
//       label: "Date Range",
//       type: "dateRange",
//       startPlaceholder: "Start Date",
//       endPlaceholder: "End Date",
//     },
//   ];
// });

// Validation rules for the modal
const validationRules = {
  name: {
    required: true,
    requiredMessage: "Purpose name is required",
    minLength: 2,
    minLengthMessage: "Purpose name must be at least 2 characters",
    maxLength: 100,
    maxLengthMessage: "Purpose name must not exceed 100 characters",
  },
};

// Event handlers
const openAddModal = () => {
  selectedPurpose.value = {
    name: "",
  };
  isEditing.value = false;
  showModal.value = true;
};

const handleEdit = (purpose) => {
  selectedPurpose.value = { ...purpose };
  isEditing.value = true;
  showModal.value = true;
};

const handleDelete = async (purpose) => {
  try {
    await deletePurpose(purpose.id);
    await fetchPurposes();
  } catch (error) {
    console.error("Error deleting purpose:", error);
    // You might want to show an error message to the user here
  }
};

const handleSubmit = async (formData) => {
  modalLoading.value = true;

  try {
    if (isEditing.value) {
      await updatePurpose(selectedPurpose.value.id, formData);
    } else {
      await createPurpose(formData);
    }

    await fetchPurposes();
    closeModal();
  } catch (error) {
    console.error("Error saving purpose:", error);
    // Handle error - you might want to show a toast notification
  } finally {
    modalLoading.value = false;
  }
};

// const handleAction = ({ action, item }) => {
//   // Handle any additional custom actions if needed
//   console.log(`Action ${action} performed on:`, item);
// };

// const handleFilterChange = (filters) => {
//   // Handle filter changes if you need to do additional processing
//   console.log("Filters changed:", filters);
// };

const closeModal = () => {
  showModal.value = false;
};

// Lifecycle
onMounted(() => {
  fetchPurposes();
});
</script>

<style scoped>
.name-cell {
  font-weight: 500;
  color: #374151;
}

.date-cell {
  color: #6b7280;
  font-size: 0.875rem;
}
</style>
