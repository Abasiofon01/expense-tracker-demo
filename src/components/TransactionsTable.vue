<template>
  <div>
    <GenericTable
      :data="allTransactions"
      :loading="loading"
      title="Transaction Management"
      entity-name="Transaction"
      :columns="tableColumns"
      key-field="id"
      :show-actions="editable"
      :actions="tableActions"
      :show-add-button="editable"
      :show-pagination="true"
      :per-page-options="[10, 20, 50, 100]"
      :default-per-page="10"
      :filter-categories="filterCategories"
      filter-text="Filter Transactions"
      filter-dropdown-title="Transaction Filters"
      :empty-icon="emptyTransactionIcon"
      :preview-columns="deletePreviewColumns"
      @add="openAddModal"
      @edit="handleEdit"
      @delete="handleDelete"
    >
      <!-- Custom cell templates -->
      <template #cell-description="{ value }">
        <span class="description-cell">{{ value }}</span>
      </template>

      <template #cell-purpose="{ item }">
        {{ item.transaction_purposes?.name || "N/A" }}
      </template>

      <template #cell-type="{ value }">
        <span class="type-cell" :class="`type-${value}`">
          {{ value }}
        </span>
      </template>

      <template #cell-amount="{ value, item }">
        <span class="amount-cell" :class="`type-${item.type}`">
          ₦{{ Number(value).toLocaleString() }}
        </span>
      </template>
    </GenericTable>

    <!-- Transaction Modal -->
    <GenericModal
      v-if="showModal && editable"
      :visible="showModal"
      :title="isEditing ? 'Edit Transaction' : 'Add New Transaction'"
      :data="selectedTransaction"
      :is-editing="isEditing"
      :loading="modalLoading"
      :validation-rules="validationRules"
      submit-text="Save Transaction"
      loading-text="Saving..."
      @close="closeModal"
      @submit="handleSubmit"
    >
      <template #form-content="{ form, errors }">
        <FormField
          v-model="form.date"
          type="date"
          label="Date"
          placeholder="Select date"
          :required="true"
          :error="errors.date"
        />

        <FormField
          v-model="form.description"
          type="text"
          label="Description"
          placeholder="Enter description"
          :required="true"
          :error="errors.description"
        />

        <FormField
          v-model="form.purpose_id"
          type="select"
          label="Purpose"
          placeholder="Select purpose"
          :options="purposeOptions"
          :required="true"
          :error="errors.purpose_id"
        />

        <FormField
          v-model="form.type"
          type="radio"
          label="Transaction Type"
          :options="[
            { value: 'income', label: 'Income' },
            { value: 'expense', label: 'Expense' },
          ]"
          :required="true"
          :error="errors.type"
        />

        <FormField
          v-model="form.amount"
          type="number"
          label="Amount"
          placeholder="Enter amount"
          :required="true"
          :error="errors.amount"
          :min="0"
          :step="0.01"
        />
      </template>
    </GenericModal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import GenericTable from "./GenericTable.vue";
import GenericModal from "./GenericModal.vue";
import FormField from "./FormField.vue";
import { useTransactions } from "../stores/transactions";
import { useTransactionPurposes } from "../stores/transaction_purposes";
import { useToast } from "vue-toast-notification";

const props = defineProps({
  editable: { type: Boolean, default: false },
});

const {
  transactions,
  allTransactions,
  loading,
  pagination,
  fetchTransactions,
  deleteTransaction,
  createTransaction,
  updateTransaction,
  setPage,
} = useTransactions();

const { purposes, fetchPurposes } = useTransactionPurposes();

const showModal = ref(false);
const selectedTransaction = ref({});
const isEditing = ref(false);
const modalLoading = ref(false);
const toast = useToast();

// Get today's date in YYYY-MM-DD format
const todayDate = computed(() => {
  const today = new Date();
  return today.toISOString().split("T")[0];
});

// Table configuration
const tableColumns = [
  {
    key: "date",
    label: "Date",
    type: "date",
    sortable: true,
    formatter: (value) => new Date(value).toLocaleDateString(),
  },
  {
    key: "description",
    label: "Description",
    cellClass: "description-cell",
    sortable: true,
  },
  {
    key: "purpose",
    label: "Purpose",
    sortable: true,
    formatter: (value, item) => item.transaction_purposes?.name || "N/A",
  },
  {
    key: "type",
    label: "Type",
    cellClass: "type-cell",
    sortable: true,
    formatter: (value) => value,
  },
  {
    key: "amount",
    label: "Amount",
    type: "currency",
    cellClass: "amount-cell",
    sortable: true,
  },
];

const tableActions = [
  { key: "edit", label: "Edit", class: "" },
  { key: "delete", label: "Delete", class: "" },
];

// Empty state icon for transactions
const emptyTransactionIcon = {
  template: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" fill="currentColor">
    <path d="M64 0C28.7 0 0 28.7 0 64L0 448c0 35.3 28.7 64 64 64l256 0c35.3 0 64-28.7 64-64l0-288-128 0c-17.7 0-32-14.3-32-32L224 0 64 0zM256 0l0 128 128 0L256 0zM112 256l160 0c8.8 0 16 7.2 16 16s-7.2 16-16 16l-160 0c-8.8 0-16-7.2-16-16s7.2-16 16-16zm0 64l160 0c8.8 0 16 7.2 16 16s-7.2 16-16 16l-160 0c-8.8 0-16-7.2-16-16s7.2-16 16-16zm0 64l160 0c8.8 0 16 7.2 16 16s-7.2 16-16 16l-160 0c-8.8 0-16-7.2-16-16s7.2-16 16-16z"/>
  </svg>`,
};

// Delete preview columns - what to show in delete confirmation
const deletePreviewColumns = [
  {
    key: "date",
    label: "Date",
    formatter: (value) => new Date(value).toLocaleDateString(),
  },
  {
    key: "description",
    label: "Description",
  },
  {
    key: "amount",
    label: "Amount",
    valueClass: "amount",
    formatter: (value, item) => `₦${Number(value).toLocaleString()}`,
  },
];

// Purpose options for select dropdown
const purposeOptions = computed(() => {
  return Array.isArray(purposes.value)
    ? purposes.value.map((purpose) => ({
        value: purpose.id,
        label: purpose.name,
      }))
    : [];
});

// Filter categories - computed based on actual transaction data
const filterCategories = computed(() => {
  const uniquePurposes = [
    ...new Set(
      allTransactions.value
        .map((t) => t.transaction_purposes?.name)
        .filter(Boolean)
    ),
  ];

  return [
    {
      key: "transaction_purposes.name",
      label: "Purposes",
      type: "checkbox",
      options: uniquePurposes.map((purpose) => ({
        value: purpose,
        label: purpose,
        count: allTransactions.value.filter(
          (t) => t.transaction_purposes?.name === purpose
        ).length,
      })),
    },
    {
      key: "type",
      label: "Transaction Type",
      type: "radio",
      options: [
        {
          value: "all",
          label: "All Transactions",
          count: allTransactions.value.length,
        },
        {
          value: "income",
          label: "Income Only",
          count: allTransactions.value.filter((t) => t.type === "income")
            .length,
        },
        {
          value: "expense",
          label: "Expense Only",
          count: allTransactions.value.filter((t) => t.type === "expense")
            .length,
        },
      ],
    },
    {
      key: "date",
      label: "Date Range",
      type: "dateRange",
      startPlaceholder: "Start Date",
      endPlaceholder: "End Date",
    },
    {
      key: "amount",
      label: "Amount Range",
      type: "range",
      minPlaceholder: "Min Amount",
      maxPlaceholder: "Max Amount",
    },
  ];
});

// Validation rules for the modal
const validationRules = {
  date: {
    required: true,
    requiredMessage: "Date is required",
  },
  description: {
    required: true,
    requiredMessage: "Description is required",
    minLength: 2,
    minLengthMessage: "Description must be at least 2 characters",
    maxLength: 255,
    maxLengthMessage: "Description must not exceed 255 characters",
  },
  purpose_id: {
    required: true,
    requiredMessage: "Purpose is required",
  },
  type: {
    required: true,
    requiredMessage: "Transaction type is required",
  },
  amount: {
    required: true,
    requiredMessage: "Amount is required",
    min: 0.01,
    minMessage: "Amount must be greater than 0",
  },
};

// Event handlers
const openAddModal = () => {
  selectedTransaction.value = {
    date: new Date().toISOString().split("T")[0], // Default to today
    description: "",
    purpose_id: "",
    type: "expense", // Default to expense
    amount: 0,
  };
  isEditing.value = false;
  showModal.value = true;
};

const handleEdit = (transaction) => {
  selectedTransaction.value = {
    ...transaction,
    date: transaction.date.split("T")[0], // Format date for input
  };
  isEditing.value = true;
  showModal.value = true;
};

const handleDelete = async (transaction) => {
  try {
    await deleteTransaction(transaction.id);
    await fetchTransactions();
  } catch (error) {
    console.error("Error deleting transaction:", error);
    // You might want to show an error message to the user here
  }
};

const handleSubmit = async (formData) => {
  // Validate date is not in the future
  if (formData.date > todayDate.value) {
    toast.error("Transaction date cannot be in the future.");
    return;
  }

  modalLoading.value = true;

  try {
    if (isEditing.value) {
      const { amount, date, description, purpose_id, type } = formData;

      const payload = {
        amount,
        date,
        description,
        purpose_id,
        type,
      };

      await updateTransaction(selectedTransaction.value.id, payload);
    } else {
      await createTransaction(formData);
    }

    await fetchTransactions();
    closeModal();
  } catch (error) {
    console.error("Error saving transaction:", error);
    return {
      general: "Failed to save transaction. Please try again.",
      ...(error.response?.data?.errors || {}),
    };
  } finally {
    modalLoading.value = false;
  }
};

const closeModal = () => {
  showModal.value = false;
};

// Lifecycle
onMounted(async () => {
  await fetchTransactions();
  await fetchPurposes();
});
</script>

<style scoped>
.description-cell {
  font-weight: 500;
}

.type-cell {
  text-transform: capitalize;
  font-weight: 500;
}
</style>
