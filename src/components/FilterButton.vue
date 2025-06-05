<template>
  <div class="filter-dropdown" ref="dropdownRef">
    <button
      class="filter-button"
      :class="{ 'filter-button--active': hasActiveFilters }"
      @click="toggleDropdown"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        class="filter-icon"
      >
        <path
          d="M3 4C3 3.44772 3.44772 3 4 3H20C20.5523 3 21 3.44772 21 4C21 4.55228 20.5523 5 20 5H4C3.44772 5 3 4.55228 3 4Z"
          fill="currentColor"
        />
        <path
          d="M7 12C7 11.4477 7.44772 11 8 11H16C16.5523 11 17 11.4477 17 12C17 12.5523 16.5523 13 16 13H8C7.44772 13 7 12.5523 7 12Z"
          fill="currentColor"
        />
        <path
          d="M10 19C9.44772 19 9 19.4477 9 20C9 20.5523 9.44772 21 10 21H14C14.5523 21 15 20.5523 15 20C15 19.4477 14.5523 19 14 19H10Z"
          fill="currentColor"
        />
      </svg>

      <span class="filter-text">{{ text }}</span>

      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        class="dropdown-icon"
        :class="{ 'dropdown-icon--rotated': isOpen }"
      >
        <path
          d="M6 9L12 15L18 9"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>

      <!-- Active filter indicator -->
      <div
        v-if="hasActiveFilters && showBadge"
        class="filter-badge"
        :title="`${activeFilterCount} filter${
          activeFilterCount > 1 ? 's' : ''
        } active`"
      >
        {{ activeFilterCount }}
      </div>
    </button>

    <!-- Dropdown Menu -->
    <Transition name="dropdown">
      <div v-if="isOpen" class="filter-dropdown-menu">
        <div class="filter-dropdown-header">
          <h3 class="filter-title">{{ dropdownTitle }}</h3>
          <button
            v-if="hasActiveFilters"
            class="clear-all-btn"
            @click="clearAllFilters"
          >
            Clear All
          </button>
        </div>

        <div class="filter-sections">
          <!-- Filter Categories -->
          <div
            v-for="category in filterCategories"
            :key="category.key"
            class="filter-section"
          >
            <h4 class="filter-section-title">{{ category.label }}</h4>

            <!-- Checkbox filters -->
            <div v-if="category.type === 'checkbox'" class="filter-options">
              <label
                v-for="option in category.options"
                :key="option.value"
                class="filter-option"
              >
                <input
                  type="checkbox"
                  :value="option.value"
                  :checked="isOptionSelected(category.key, option.value)"
                  @change="
                    handleOptionChange(category.key, option.value, $event)
                  "
                  class="filter-checkbox"
                />
                <span class="filter-option-text">{{ option.label }}</span>
                <span v-if="option.count" class="filter-option-count"
                  >({{ option.count }})</span
                >
              </label>
            </div>

            <!-- Radio filters -->
            <div v-else-if="category.type === 'radio'" class="filter-options">
              <label
                v-for="option in category.options"
                :key="option.value"
                class="filter-option"
              >
                <input
                  type="radio"
                  :name="category.key"
                  :value="option.value"
                  :checked="isOptionSelected(category.key, option.value)"
                  @change="handleRadioChange(category.key, option.value)"
                  class="filter-radio"
                />
                <span class="filter-option-text">{{ option.label }}</span>
                <span v-if="option.count" class="filter-option-count"
                  >({{ option.count }})</span
                >
              </label>
            </div>
            <!-- Date Range filters -->
            <div
              v-else-if="category.type === 'dateRange'"
              class="filter-date-range"
            >
              <div class="date-inputs">
                <input
                  type="date"
                  :placeholder="category.startPlaceholder || 'Start Date'"
                  :value="getDateRangeValue(category.key, 'start')"
                  @input="handleDateRangeChange(category.key, 'start', $event)"
                  class="date-input"
                />
                <span class="date-separator">-</span>
                <input
                  type="date"
                  :placeholder="category.endPlaceholder || 'End Date'"
                  :value="getDateRangeValue(category.key, 'end')"
                  @input="handleDateRangeChange(category.key, 'end', $event)"
                  class="date-input"
                />
              </div>
            </div>

            <!-- Range filters -->
            <div v-else-if="category.type === 'range'" class="filter-range">
              <div class="range-inputs">
                <input
                  type="number"
                  :placeholder="category.minPlaceholder || 'Min'"
                  :value="getRangeValue(category.key, 'min')"
                  @input="handleRangeChange(category.key, 'min', $event)"
                  class="range-input"
                />
                <span class="range-separator">-</span>
                <input
                  type="number"
                  :placeholder="category.maxPlaceholder || 'Max'"
                  :value="getRangeValue(category.key, 'max')"
                  @input="handleRangeChange(category.key, 'max', $event)"
                  class="range-input"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="filter-dropdown-footer">
          <button class="btn btn-outline filter-btn" @click="closeDropdown">
            Cancel
          </button>
          <button class="btn btn-primary filter-btn" @click="applyFilters">
            Apply Filters
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";

const props = defineProps({
  text: {
    type: String,
    default: "Filters",
  },
  dropdownTitle: {
    type: String,
    default: "Filter Options",
  },
  filterCategories: {
    type: Array,
    default: () => [
      {
        key: "category",
        label: "Category",
        type: "checkbox",
        options: [
          { value: "events", label: "Events", count: 24 },
          { value: "services", label: "Services", count: 18 },
          { value: "announcements", label: "Announcements", count: 12 },
        ],
      },
      {
        key: "location",
        label: "Location",
        type: "radio",
        options: [
          { value: "all", label: "All Locations" },
          { value: "main", label: "Main Campus" },
          { value: "online", label: "Online Only" },
        ],
      },
      {
        key: "price",
        label: "Price Range",
        type: "range",
        minPlaceholder: "Min Price",
        maxPlaceholder: "Max Price",
      },
    ],
  },
  selectedFilters: {
    type: Object,
    default: () => ({}),
  },
  showBadge: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits(["update:selectedFilters", "apply", "clear"]);

const dropdownRef = ref(null);
const isOpen = ref(false);
const localFilters = ref({ ...props.selectedFilters });

const hasActiveFilters = computed(() => {
  return Object.keys(localFilters.value).some((key) => {
    const value = localFilters.value[key];
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === "object" && value !== null) {
      // Handle both range types (min/max) and dateRange types (start/end)
      return (
        value.min !== undefined ||
        value.max !== undefined ||
        value.start !== undefined ||
        value.end !== undefined
      );
    }
    return value !== undefined && value !== null && value !== "";
  });
});

const activeFilterCount = computed(() => {
  let count = 0;
  Object.keys(localFilters.value).forEach((key) => {
    const value = localFilters.value[key];
    if (Array.isArray(value)) {
      count += value.length;
    } else if (typeof value === "object" && value !== null) {
      // Handle both range types (min/max) and dateRange types (start/end)
      if (value.min !== undefined || value.max !== undefined) {
        count += 1; // Count as 1 filter for amount range
      }
      if (value.start !== undefined || value.end !== undefined) {
        count += 1; // Count as 1 filter for date range
      }
    } else if (value !== undefined && value !== null && value !== "") {
      count += 1;
    }
  });
  return count;
});

const toggleDropdown = () => {
  isOpen.value = !isOpen.value;
};

const closeDropdown = () => {
  isOpen.value = false;
  localFilters.value = { ...props.selectedFilters }; // Reset to original
};

const isOptionSelected = (categoryKey, optionValue) => {
  const categoryFilters = localFilters.value[categoryKey];
  if (Array.isArray(categoryFilters)) {
    return categoryFilters.includes(optionValue);
  }
  return categoryFilters === optionValue;
};

const handleOptionChange = (categoryKey, optionValue, event) => {
  if (!localFilters.value[categoryKey]) {
    localFilters.value[categoryKey] = [];
  }

  if (event.target.checked) {
    localFilters.value[categoryKey].push(optionValue);
  } else {
    localFilters.value[categoryKey] = localFilters.value[categoryKey].filter(
      (item) => item !== optionValue
    );
  }
};

const handleRadioChange = (categoryKey, optionValue) => {
  localFilters.value[categoryKey] = optionValue;
};

const getRangeValue = (categoryKey, type) => {
  const range = localFilters.value[categoryKey];
  return range ? range[type] : "";
};

const getDateRangeValue = (categoryKey, type) => {
  const dateRange = localFilters.value[categoryKey];
  return dateRange ? dateRange[type] : "";
};

const handleRangeChange = (categoryKey, type, event) => {
  if (!localFilters.value[categoryKey]) {
    localFilters.value[categoryKey] = {};
  }

  const value = event.target.value;
  if (value === "") {
    delete localFilters.value[categoryKey][type];
    if (Object.keys(localFilters.value[categoryKey]).length === 0) {
      delete localFilters.value[categoryKey];
    }
  } else {
    localFilters.value[categoryKey][type] = Number(value);
  }
};

const handleDateRangeChange = (categoryKey, type, event) => {
  if (!localFilters.value[categoryKey]) {
    localFilters.value[categoryKey] = {};
  }

  const value = event.target.value;
  if (value === "") {
    delete localFilters.value[categoryKey][type];
    if (Object.keys(localFilters.value[categoryKey]).length === 0) {
      delete localFilters.value[categoryKey];
    }
  } else {
    localFilters.value[categoryKey][type] = value;
  }
};

const clearAllFilters = () => {
  localFilters.value = {};
  emit("clear");
};

const applyFilters = () => {
  emit("update:selectedFilters", { ...localFilters.value });
  emit("apply", { ...localFilters.value });
  isOpen.value = false;
};

// Click outside to close
const handleClickOutside = (event) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target)) {
    closeDropdown();
  }
};

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
});
</script>
