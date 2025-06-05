<template>
  <div class="table-container" :class="tableContainerClasses">
    <div class="section-header">
      <h3>{{ title }}</h3>
      <div class="header-table-actions">
        <!-- Filter Dropdown (if filters are provided) -->
        <FilterDropdown
          v-if="filterCategories && filterCategories.length > 0"
          :text="filterText"
          :dropdown-title="filterDropdownTitle"
          :filter-categories="filterCategories"
          :selected-filters="selectedFilters"
          @update:selected-filters="updateFilters"
          @apply="applyFilters"
          @clear="clearAllFilters"
        />

        <!-- TODO fix responsiveness of filter button -->

        <!-- Per Page Selection -->
        <div class="paginantion-and-new-btn">
          <div class="pagination-controls" v-if="showPagination">
            <label for="perPage">Per Page:</label>
            <select v-model="perPage" id="perPage">
              <option
                v-for="option in perPageOptions"
                :key="option"
                :value="option"
              >
                {{ option }}
              </option>
            </select>
          </div>

          <!-- Add Button -->
          <button
            v-if="showAddButton"
            class="add-btn"
            @click="handleAdd"
            :title="`Add new ${entityName.toLowerCase()}`"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 448 512"
              fill="currentColor"
            >
              <path
                d="M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 144L48 224c-17.7 0-32 14.3-32 32s14.3 32 32 32l144 0 0 144c0 17.7 14.3 32 32 32s32-14.3 32-32l0-144 144 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-144 0 0-144z"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Active Filters Display -->
    <div v-if="hasActiveFilters" class="active-filters">
      <h4>Active Filters:</h4>
      <div class="filter-tags">
        <span
          v-for="(value, key) in activeFilterTags"
          :key="key"
          class="filter-tag"
        >
          {{ value }}
          <button @click="clearFilter(key)" class="clear-filter">×</button>
        </span>
      </div>
    </div>

    <!-- Results Summary -->
    <div v-if="!loading && filteredData.length > 0" class="results-summary">
      <p>
        Showing {{ paginatedData.length }} of {{ filteredData.length }}
        {{ entityName.toLowerCase() }}s
      </p>
    </div>

    <!-- Loading Spinner -->
    <div v-if="loading" class="loading-spinner">
      <div class="spinner"></div>
      <p>Loading {{ entityName.toLowerCase() }}s...</p>
    </div>

    <!-- Empty State - No Data at All -->
    <div v-else-if="data.length === 0" class="empty-state">
      <div class="empty-state-content">
        <div class="empty-icon">
          <component :is="emptyIcon" />
        </div>
        <h3>No {{ entityName }}s Yet</h3>
        <p v-if="showAddButton">
          You haven't created any {{ entityName.toLowerCase() }}s yet. Start by
          adding your first {{ entityName.toLowerCase() }}.
        </p>
        <p v-else>No {{ entityName.toLowerCase() }}s have been created yet.</p>
        <button v-if="showAddButton" class="btn btn-primary" @click="handleAdd">
          Add Your First {{ entityName }}
        </button>
      </div>
    </div>

    <!-- Empty State - No Results from Filters -->
    <div v-else-if="!loading && filteredData.length === 0" class="empty-state">
      <div class="empty-state-content">
        <div class="empty-icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 512 512"
            fill="currentColor"
          >
            <path
              d="M416 208c0 45.9-14.9 88.3-40 122.7L502.6 457.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L330.7 376c-34.4 25.2-76.8 40-122.7 40C93.1 416 0 322.9 0 208S93.1 0 208 0S416 93.1 416 208zM208 352a144 144 0 1 0 0-288 144 144 0 1 0 0 288z"
            />
          </svg>
        </div>
        <h3>No Matching {{ entityName }}s</h3>
        <p>
          We couldn't find any {{ entityName.toLowerCase() }}s that match your
          current filters. Try adjusting or clearing your filters to see more
          results.
        </p>
        <div class="empty-state-actions">
          <button class="btn btn-secondary" @click="clearAllFilters">
            Clear All Filters
          </button>
          <button
            v-if="showAddButton"
            class="btn btn-primary"
            @click="handleAdd"
          >
            Add New {{ entityName }}
          </button>
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="table-wrapper" v-else>
      <table>
        <thead>
          <tr>
            <th
              v-for="column in columns"
              :key="column.key"
              :class="[
                column.headerClass,
                {
                  sortable: column.sortable,
                  active: sortColumn === column.key,
                },
              ]"
              @click="column.sortable ? handleSort(column.key) : null"
            >
              <div class="header-content">
                {{ column.label }}
                <span v-if="column.sortable" class="sort-icon">
                  <span v-if="sortColumn === column.key">
                    {{ sortDirection === "asc" ? "⮝" : "⮟" }}
                  </span>
                  <span v-else class="sort-icon-placeholder">↕</span>
                </span>
              </div>
            </th>
            <th v-if="showActions" class="action-header">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in paginatedData"
            :key="getItemKey(item)"
            class="table-row"
          >
            <td
              v-for="column in columns"
              :key="column.key"
              :class="column.cellClass"
            >
              <slot
                :name="`cell-${column.key}`"
                :item="item"
                :value="getNestedValue(item, column.key)"
                :column="column"
              >
                {{ formatCellValue(item, column) }}
              </slot>
            </td>
            <td v-if="showActions" class="action-cell">
              <div
                class="action-buttons"
                :class="{ 'always-visible': alwaysShowActions }"
              >
                <button
                  v-for="action in actions"
                  :key="action.key"
                  @click="handleAction(action.key, item)"
                  :class="['action-btn', action.class, `action-${action.key}`]"
                  :title="action.label"
                >
                  <!-- Edit Icon -->
                  <svg
                    v-if="action.key === 'edit'"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 512 512"
                    fill="currentColor"
                  >
                    <path
                      d="M471.6 21.7c-21.9-21.9-57.3-21.9-79.2 0L362.3 51.7l97.9 97.9 30.1-30.1c21.9-21.9 21.9-57.3 0-79.2L471.6 21.7zm-299.2 220c-6.1 6.1-10.8 13.6-13.5 21.9l-29.6 88.8c-2.9 8.6-.6 18.1 5.8 24.6s15.9 8.7 24.6 5.8l88.8-29.6c8.2-2.7 15.7-7.4 21.9-13.5L437.7 172.3 339.7 74.3 172.4 241.7zM96 64C43 64 0 107 0 160L0 416c0 53 43 96 96 96l256 0c53 0 96-43 96-96l0-81.2c0-12.3-4.9-24.1-13.7-32.8L402.7 270.6c-8.7-8.7-20.5-13.7-32.8-13.7L224 256.9l0 159.1-128 0 0-256 159.1 0z"
                    />
                  </svg>

                  <!-- Delete Icon -->
                  <svg
                    v-else-if="action.key === 'delete'"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 448 512"
                    fill="currentColor"
                  >
                    <path
                      d="M135.2 17.7L128 32 32 32C14.3 32 0 46.3 0 64S14.3 96 32 96l384 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-96 0-7.2-14.3C307.4 6.8 296.3 0 284.2 0L163.8 0c-12.1 0-23.2 6.8-28.6 17.7zM416 128L32 128 53.2 467c1.6 25.3 22.6 45 47.9 45l245.8 0c25.3 0 46.3-19.7 47.9-45L416 128z"
                    />
                  </svg>

                  <!-- View Icon -->
                  <svg
                    v-else-if="action.key === 'view'"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 576 512"
                    fill="currentColor"
                  >
                    <path
                      d="M288 80c-65.2 0-118.8 29.6-159.9 67.7C89.6 183.5 63 226 49.4 256c13.6 30 40.2 72.5 78.6 108.3C169.2 402.4 222.8 432 288 432s118.8-29.6 159.9-67.7C486.4 328.5 513 286 526.6 256c-13.6-30-40.2-72.5-78.6-108.3C406.8 109.6 353.2 80 288 80zM95.4 112.6C142.5 68.8 207.2 32 288 32s145.5 36.8 192.6 80.6c46.8 43.5 78.1 95.4 93 131.1c3.3 7.9 3.3 16.7 0 24.6c-14.9 35.7-46.2 87.7-93 131.1C433.5 443.2 368.8 480 288 480s-145.5-36.8-192.6-80.6C48.6 356 17.3 304 2.5 268.3c-3.3-7.9-3.3-16.7 0-24.6C17.3 208 48.6 156 95.4 112.6zM288 336c44.2 0 80-35.8 80-80s-35.8-80-80-80c-44.2 0-80 35.8-80 80s35.8 80 80 80z"
                    />
                  </svg>

                  <!-- Duplicate Icon -->
                  <svg
                    v-else-if="action.key === 'duplicate'"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 512 512"
                    fill="currentColor"
                  >
                    <path
                      d="M288 448H64V224h64V160H64c-35.3 0-64 28.7-64 64V448c0 35.3 28.7 64 64 64H288c35.3 0 64-28.7 64-64V384H288v64zm-64-96H448c35.3 0 64-28.7 64-64V64c0-35.3-28.7-64-64-64H224c-35.3 0-64 28.7-64 64V288c0 35.3 28.7 64 64 64z"
                    />
                  </svg>

                  <!-- Generic/Custom Icon -->
                  <svg
                    v-else
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 128 512"
                    fill="currentColor"
                  >
                    <path
                      d="M64 360a56 56 0 1 0 0 112 56 56 0 1 0 0-112zm0-160a56 56 0 1 0 0 112 56 56 0 1 0 0-112zM120 96A56 56 0 1 0 8 96a56 56 0 1 0 112 0z"
                    />
                  </svg>

                  <!-- Tooltip label -->
                  <span class="action-label">{{ action.label }}</span>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div v-if="showPagination && filteredData.length > 0" class="pagination">
      <button @click="prevPage" :disabled="currentPage === 1">Previous</button>
      <span>Page {{ currentPage }} of {{ totalPages }}</span>
      <button @click="nextPage" :disabled="currentPage === totalPages">
        Next
      </button>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="modal-overlay" @click="cancelDelete">
      <div class="delete-modal" @click.stop>
        <div class="delete-modal-header">
          <h3>Confirm Deletion</h3>
          <button class="close-btn" @click="cancelDelete" title="Close">
            ×
          </button>
        </div>

        <div class="delete-modal-body">
          <div class="warning-icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 512 512"
              fill="currentColor"
            >
              <path
                d="M256 32c14.2 0 27.3 7.5 34.5 19.8l216 368c7.3 12.4 7.3 27.7 .2 40.1S486.3 480 472 480L40 480c-14.3 0-27.6-7.7-34.7-20.1s-7-27.8 .2-40.1l216-368C228.7 39.5 241.8 32 256 32zm0 128c-13.3 0-24 10.7-24 24l0 112c0 13.3 10.7 24 24 24s24-10.7 24-24l0-112c0-13.3-10.7-24-24-24zm32 224a32 32 0 1 0 -64 0 32 32 0 1 0 64 0z"
              />
            </svg>
          </div>

          <div class="delete-content">
            <p>
              <strong
                >Are you sure you want to delete this
                {{ entityName.toLowerCase() }}?</strong
              >
            </p>

            <div class="transaction-preview">
              <div
                v-for="column in previewColumns"
                :key="column.key"
                class="preview-item"
              >
                <span class="label">{{ column.label }}:</span>
                <span :class="column.valueClass">
                  {{ formatCellValue(itemToDelete, column) }}
                </span>
              </div>
            </div>

            <p class="warning-text">
              This action cannot be undone. The
              {{ entityName.toLowerCase() }} will be permanently removed.
            </p>
          </div>
        </div>

        <div class="delete-modal-footer">
          <button class="cancel-btn" @click="cancelDelete">Cancel</button>
          <button
            class="delete-btn"
            @click="handleDelete"
            :disabled="deleteLoading"
          >
            <span v-if="deleteLoading">Deleting...</span>
            <span v-else>Delete {{ entityName }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from "vue";
import FilterDropdown from "../components/FilterButton.vue";

const props = defineProps({
  // Data
  data: { type: Array, required: true },
  loading: { type: Boolean, default: false },

  // Table Configuration
  title: { type: String, required: true },
  entityName: { type: String, required: true }, // e.g., "Transaction", "Purpose"
  columns: { type: Array, required: true },
  keyField: { type: String, default: "id" },

  // Actions
  showActions: { type: Boolean, default: true },
  alwaysShowActions: { type: Boolean, default: false }, // Show actions always but dimmed
  compactActions: { type: Boolean, default: false }, // Use compact action buttons
  showActionTooltips: { type: Boolean, default: true }, // Show tooltips on hover
  actions: {
    type: Array,
    default: () => [
      { key: "edit", label: "Edit", class: "" },
      { key: "delete", label: "Delete", class: "" },
    ],
  },

  // Add Button
  showAddButton: { type: Boolean, default: true },

  // Pagination
  showPagination: { type: Boolean, default: true },
  perPageOptions: { type: Array, default: () => [10, 20, 50, 100] },
  defaultPerPage: { type: Number, default: 10 },

  // Filters
  filterCategories: { type: Array, default: () => [] },
  filterText: { type: String, default: "Filter" },
  filterDropdownTitle: { type: String, default: "Filters" },

  // Empty State
  emptyIcon: {
    type: [String, Object],
    default: () => ({
      template: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" fill="currentColor">
        <path d="M64 0C28.7 0 0 28.7 0 64L0 448c0 35.3 28.7 64 64 64l256 0c35.3 0 64-28.7 64-64l0-288-128 0c-17.7 0-32-14.3-32-32L224 0 64 0zM256 0l0 128 128 0L256 0zM112 256l160 0c8.8 0 16 7.2 16 16s-7.2 16-16 16l-160 0c-8.8 0-16-7.2-16-16s7.2-16 16-16zm0 64l160 0c8.8 0 16 7.2 16 16s-7.2 16-16 16l-160 0c-8.8 0-16-7.2-16-16s7.2-16 16-16zm0 64l160 0c8.8 0 16 7.2 16 16s-7.2 16-16 16l-160 0c-8.8 0-16-7.2-16-16s7.2-16 16-16z"/>
      </svg>`,
    }),
  },

  // Delete Preview Columns
  previewColumns: { type: Array, default: () => [] },
});

const emit = defineEmits(["add", "edit", "delete", "action", "filter-change"]);

// State
const selectedFilters = ref({});
const currentPage = ref(1);
const perPage = ref(props.defaultPerPage);
const showDeleteModal = ref(false);
const itemToDelete = ref(null);
const deleteLoading = ref(false);
const sortColumn = ref(null);
const sortDirection = ref("asc");

// Computed
const filteredData = computed(() => {
  let filtered = [...props.data];

  // Apply custom filters based on filterCategories
  if (props.filterCategories && props.filterCategories.length > 0) {
    props.filterCategories.forEach((category) => {
      const filterValue = selectedFilters.value[category.key];

      if (!filterValue) return;

      switch (category.type) {
        case "checkbox":
          if (filterValue.length > 0) {
            filtered = filtered.filter((item) =>
              filterValue.includes(getNestedValue(item, category.key))
            );
          }
          break;

        case "radio":
          if (filterValue && filterValue !== "all") {
            filtered = filtered.filter(
              (item) => getNestedValue(item, category.key) === filterValue
            );
          }
          break;

        case "dateRange":
          if (filterValue.start || filterValue.end) {
            filtered = filtered.filter((item) => {
              const itemDate = new Date(getNestedValue(item, category.key));

              if (filterValue.start) {
                const start = new Date(filterValue.start);
                if (itemDate < start) return false;
              }

              if (filterValue.end) {
                const end = new Date(filterValue.end);
                end.setHours(23, 59, 59, 999);
                if (itemDate > end) return false;
              }

              return true;
            });
          }
          break;

        case "range":
          if (filterValue.min || filterValue.max) {
            filtered = filtered.filter((item) => {
              const value = Number(getNestedValue(item, category.key));

              if (filterValue.min && value < filterValue.min) return false;
              if (filterValue.max && value > filterValue.max) return false;

              return true;
            });
          }
          break;
      }
    });
  }

  return filtered;
});

const sortedData = computed(() => {
  if (!sortColumn.value) return filteredData.value;

  return [...filteredData.value].sort((a, b) => {
    let valueA = getNestedValue(a, sortColumn.value);
    let valueB = getNestedValue(b, sortColumn.value);

    // Handle different data types
    if (typeof valueA === "string") valueA = valueA.toLowerCase();
    if (typeof valueB === "string") valueB = valueB.toLowerCase();

    // Handle dates
    if (valueA instanceof Date) valueA = valueA.getTime();
    if (valueB instanceof Date) valueB = valueB.getTime();

    // Handle numbers
    if (!isNaN(valueA)) valueA = Number(valueA);
    if (!isNaN(valueB)) valueB = Number(valueB);

    if (valueA > valueB) return sortDirection.value === "asc" ? 1 : -1;
    if (valueA < valueB) return sortDirection.value === "asc" ? -1 : 1;
    return 0;
  });
});

const paginatedData = computed(() => {
  if (!props.showPagination) return sortedData.value;

  const start = (currentPage.value - 1) * perPage.value;
  const end = start + perPage.value;
  return sortedData.value.slice(start, end);
});

const totalPages = computed(() => {
  if (!props.showPagination) return 1;
  return Math.ceil(filteredData.value.length / perPage.value);
});

const hasActiveFilters = computed(() => {
  return Object.keys(selectedFilters.value).some((key) => {
    const value = selectedFilters.value[key];
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === "object" && value !== null) {
      return Object.values(value).some((v) => v !== null && v !== "");
    }
    return value !== null && value !== "" && value !== "all";
  });
});

const activeFilterTags = computed(() => {
  const tags = {};

  Object.keys(selectedFilters.value).forEach((key) => {
    const value = selectedFilters.value[key];
    const category = props.filterCategories.find((cat) => cat.key === key);

    if (!category || !value) return;

    switch (category.type) {
      case "checkbox":
        if (value.length > 0) {
          tags[key] = `${category.label}: ${value.join(", ")}`;
        }
        break;

      case "radio":
        if (value && value !== "all") {
          tags[key] = `${category.label}: ${value}`;
        }
        break;

      case "dateRange":
        if (value.start || value.end) {
          const start = value.start
            ? new Date(value.start).toLocaleDateString()
            : "Start";
          const end = value.end
            ? new Date(value.end).toLocaleDateString()
            : "End";
          tags[key] = `${category.label}: ${start} - ${end}`;
        }
        break;

      case "range":
        if (value.min || value.max) {
          const min = value.min ? value.min.toLocaleString() : "Min";
          const max = value.max ? value.max.toLocaleString() : "Max";
          tags[key] = `${category.label}: ${min} - ${max}`;
        }
        break;
    }
  });

  return tags;
});

const tableContainerClasses = computed(() => ({
  "compact-actions": props.compactActions,
}));

// Methods
const getItemKey = (item) => {
  return getNestedValue(item, props.keyField);
};

const getNestedValue = (obj, path) => {
  return path.split(".").reduce((current, key) => current?.[key], obj);
};

const formatCellValue = (item, column) => {
  const value = getNestedValue(item, column.key);

  if (column.formatter && typeof column.formatter === "function") {
    return column.formatter(value, item);
  }

  // Default formatters based on column type
  switch (column.type) {
    case "date":
      return value ? new Date(value).toLocaleDateString() : "N/A";
    case "currency":
      return value ? `₦${Number(value).toLocaleString()}` : "₦0";
    case "number":
      return value ? Number(value).toLocaleString() : "0";
    default:
      return value || "N/A";
  }
};

const handleAdd = () => {
  emit("add");
};

const handleAction = (actionKey, item) => {
  if (actionKey === "delete") {
    confirmDelete(item);
  } else {
    emit(actionKey, item);
    emit("action", { action: actionKey, item });
  }
};

const confirmDelete = (item) => {
  itemToDelete.value = item;
  showDeleteModal.value = true;
};

const cancelDelete = () => {
  showDeleteModal.value = false;
  itemToDelete.value = null;
  deleteLoading.value = false;
};

const handleDelete = async () => {
  if (!itemToDelete.value) return;

  deleteLoading.value = true;

  try {
    await emit("delete", itemToDelete.value);
    showDeleteModal.value = false;
    itemToDelete.value = null;
  } catch (error) {
    console.error("Error deleting item:", error);
  } finally {
    deleteLoading.value = false;
  }
};

const updateFilters = (filters) => {
  selectedFilters.value = filters;
  emit("filter-change", filters);
};

const applyFilters = (filters) => {
  selectedFilters.value = filters;
  currentPage.value = 1;
  emit("filter-change", filters);
};

const clearAllFilters = () => {
  selectedFilters.value = {};
  currentPage.value = 1;
  emit("filter-change", {});
};

const clearFilter = (filterKey) => {
  if (selectedFilters.value[filterKey]) {
    delete selectedFilters.value[filterKey];
    selectedFilters.value = { ...selectedFilters.value };
    emit("filter-change", selectedFilters.value);
  }
};

const handleSort = (columnKey) => {
  if (sortColumn.value === columnKey) {
    // Reverse direction if same column clicked again
    sortDirection.value = sortDirection.value === "asc" ? "desc" : "asc";
  } else {
    // New column, default to ascending
    sortColumn.value = columnKey;
    sortDirection.value = "asc";
  }

  // Reset to first page when sorting changes
  currentPage.value = 1;
};

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
  }
};

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
  }
};

// Watchers
watch(
  [selectedFilters, perPage],
  () => {
    currentPage.value = 1;
  },
  { deep: true }
);
</script>
