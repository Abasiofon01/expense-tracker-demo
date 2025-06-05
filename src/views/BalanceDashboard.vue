<template>
  <div class="balance-dashboard">
    <!-- Header Controls -->
    <div class="dashboard-header">
      <h1 class="dashboard-title">Balance Overview</h1>

      <div class="controls-section">
        <!-- View Toggle -->
        <div class="view-toggle">
          <button
            @click="selectedView = 'monthly'"
            :class="{ active: selectedView === 'monthly' }"
            class="toggle-btn"
          >
            Monthly
          </button>
          <button
            @click="selectedView = 'yearly'"
            :class="{ active: selectedView === 'yearly' }"
            class="toggle-btn"
          >
            Yearly
          </button>
        </div>

        <!-- Period Selector -->
        <div class="period-selector">
          <select
            v-if="selectedView === 'monthly'"
            v-model="selectedMonth"
            class="period-select"
          >
            <option
              v-for="month in availableMonths"
              :key="month.value"
              :value="month.value"
            >
              {{ month.label }}
            </option>
          </select>

          <select v-else v-model="selectedYear" class="period-select">
            <option
              v-for="year in availableYears"
              :key="year.value"
              :value="year.value"
            >
              {{ year.label }}
            </option>
          </select>
        </div>
      </div>
    </div>

    <!-- Current Period Summary (Always Visible) -->
    <div class="period-summary-card">
      <div class="summary-header">
        <div>
          <h2 class="period-title">{{ currentPeriodData.title }}</h2>
          <div class="period-subtitle">
            {{ selectedView === "monthly" ? "Monthly" : "Yearly" }} Overview
          </div>
        </div>
        <div
          class="net-change-badge"
          :class="currentPeriodData.net >= 0 ? 'positive' : 'negative'"
        >
          <div class="net-label">Net Change</div>
          <div class="net-amount">
            {{ currentPeriodData.net >= 0 ? "+" : ""
            }}{{ formatCurrency(currentPeriodData.net) }}
          </div>
        </div>
      </div>

      <div class="summary-grid">
        <div class="summary-item">
          <div class="item-icon opening">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M12 2L13.09 8.26L19 7L17.74 13.09L24 12L17.74 10.91L19 17L13.09 15.74L12 22L10.91 15.74L5 17L6.26 10.91L0 12L6.26 13.09L5 7L10.91 8.26L12 2Z"
              />
            </svg>
          </div>
          <div class="item-content">
            <div class="item-label">Opening Balance</div>
            <div class="item-value">
              {{ formatCurrency(currentPeriodData.openingBalance) }}
            </div>
          </div>
        </div>

        <div class="summary-item">
          <div class="item-icon income">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M12 2L15.09 8.26L22 9L15.09 9.74L12 16L8.91 9.74L2 9L8.91 8.26L12 2Z"
              />
            </svg>
          </div>
          <div class="item-content">
            <div class="item-label">Total Income</div>
            <div class="item-value income-text">
              +{{ formatCurrency(currentPeriodData.income) }}
            </div>
          </div>
        </div>

        <div class="summary-item">
          <div class="item-icon expense">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 13H5V11H19V13Z" />
            </svg>
          </div>
          <div class="item-content">
            <div class="item-label">Total Expenses</div>
            <div class="item-value expense-text">
              -{{ formatCurrency(currentPeriodData.expenses) }}
            </div>
          </div>
        </div>

        <div class="summary-item highlight">
          <div class="item-icon closing">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M17 7H22V9H19V12H17V9H14V7H17V4H19V7H17ZM7 12H2V10H5V7H7V10H10V12H7V15H5V12H7ZM12 15H15V17H12V20H10V17H7V15H10V12H12V15Z"
              />
            </svg>
          </div>
          <div class="item-content">
            <div class="item-label">Closing Balance</div>
            <div
              class="item-value"
              :class="
                currentPeriodData.closingBalance >= 0
                  ? 'positive-text'
                  : 'negative-text'
              "
            >
              {{ formatCurrency(currentPeriodData.closingBalance) }}
            </div>
          </div>
        </div>
      </div>

      <div class="summary-footer">
        <div class="transaction-count">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V5H19V19ZM17 12H7V10H17V12ZM13 16H7V14H13V16ZM17 8H7V6H17V8Z"
            />
          </svg>
          {{ currentPeriodData.transactionCount }} transactions
        </div>
      </div>
    </div>

    <!-- Data Table Section -->
    <div class="table-section">
      <div class="section-header">
        <h3 class="section-title">
          {{ selectedView === "monthly" ? "Monthly" : "Yearly" }} Balance
          History
        </h3>
        <div class="table-info">
          {{ displayedBalances.length }}
          {{
            selectedView === "monthly"
              ? displayedBalances.length === 1
                ? "month"
                : "months"
              : displayedBalances.length === 1
              ? "year"
              : "years"
          }}
        </div>
      </div>

      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th class="period-col">
                {{ selectedView === "monthly" ? "Month" : "Year" }}
              </th>
              <th class="amount-col">Opening</th>
              <th class="amount-col">Income</th>
              <th class="amount-col">Expenses</th>
              <th class="amount-col">Net Change</th>
              <th class="amount-col">Closing</th>
              <th class="count-col">Transactions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in displayedBalances"
              :key="selectedView === 'monthly' ? item.month : item.year"
              @click="selectPeriod(item)"
              class="data-row"
              :class="{ selected: isSelectedPeriod(item) }"
            >
              <td class="period-cell">
                <div class="period-name">
                  {{ selectedView === "monthly" ? item.monthName : item.year }}
                </div>
              </td>
              <td class="amount-cell neutral">
                {{ formatCurrency(item.openingBalance) }}
              </td>
              <td class="amount-cell positive">
                +{{ formatCurrency(item.income) }}
              </td>
              <td class="amount-cell negative">
                -{{ formatCurrency(item.expenses) }}
              </td>
              <td
                class="amount-cell"
                :class="item.net >= 0 ? 'positive' : 'negative'"
              >
                {{ item.net >= 0 ? "+" : "" }}{{ formatCurrency(item.net) }}
              </td>
              <td
                class="amount-cell"
                :class="item.closingBalance >= 0 ? 'positive' : 'negative'"
              >
                {{ formatCurrency(item.closingBalance) }}
              </td>
              <td class="count-cell">
                <div class="transaction-badge">
                  {{ item.transactionCount }}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useTransactionStore } from "../stores/transactions";
import { formatCurrency } from "../utils";

const transactionStore = useTransactionStore();

// Reactive state
const selectedView = ref("monthly");
const selectedMonth = ref("");
const selectedYear = ref("");

// Computed properties from store
const monthlyBalances = computed(() => transactionStore.monthlyBalances);
const yearlyBalances = computed(() => transactionStore.yearlyBalances);

// Available periods for selection
const availableMonths = computed(() => {
  return monthlyBalances.value
    .map((item) => ({
      value: item.month,
      label: item.monthName,
    }))
    .reverse();
});

const availableYears = computed(() => {
  return yearlyBalances.value
    .map((item) => ({
      value: item.year.toString(),
      label: item.year.toString(),
    }))
    .reverse();
});

// Current period data - always shows data, defaults to most recent
const currentPeriodData = computed(() => {
  let data = null;

  if (selectedView.value === "monthly") {
    if (selectedMonth.value) {
      // Show selected month
      data = monthlyBalances.value.find((m) => m.month === selectedMonth.value);
    } else if (monthlyBalances.value.length > 0) {
      // Show most recent month by default
      data = monthlyBalances.value[monthlyBalances.value.length - 1];
    }

    if (data) {
      return {
        title: data.monthName,
        openingBalance: data.openingBalance,
        closingBalance: data.closingBalance,
        income: data.income,
        expenses: data.expenses,
        net: data.net,
        transactionCount: data.transactionCount,
      };
    }
  } else {
    if (selectedYear.value) {
      // Show selected year
      data = yearlyBalances.value.find(
        (y) => y.year.toString() === selectedYear.value
      );
    } else if (yearlyBalances.value.length > 0) {
      // Show most recent year by default
      data = yearlyBalances.value[yearlyBalances.value.length - 1];
    }

    if (data) {
      return {
        title: data.year.toString(),
        openingBalance: data.openingBalance,
        closingBalance: data.closingBalance,
        income: data.income,
        expenses: data.expenses,
        net: data.net,
        transactionCount: data.transactionCount,
      };
    }
  }

  // Fallback data if no transactions exist
  return {
    title: selectedView.value === "monthly" ? "No Data" : "No Data",
    openingBalance: 0,
    closingBalance: 0,
    income: 0,
    expenses: 0,
    net: 0,
    transactionCount: 0,
  };
});

// Displayed balances for the table
const displayedBalances = computed(() => {
  if (selectedView.value === "monthly") {
    return [...monthlyBalances.value].reverse();
  } else {
    return [...yearlyBalances.value].reverse();
  }
});

const selectPeriod = (item) => {
  if (selectedView.value === "monthly") {
    selectedMonth.value = selectedMonth.value === item.month ? "" : item.month;
  } else {
    selectedYear.value =
      selectedYear.value === item.year.toString() ? "" : item.year.toString();
  }
};

const isSelectedPeriod = (item) => {
  if (selectedView.value === "monthly") {
    return selectedMonth.value === item.month;
  } else {
    return selectedYear.value === item.year.toString();
  }
};

// Initialize default selections when data is loaded
const initializeDefaults = () => {
  if (
    selectedView.value === "monthly" &&
    !selectedMonth.value &&
    monthlyBalances.value.length > 0
  ) {
    selectedMonth.value =
      monthlyBalances.value[monthlyBalances.value.length - 1].month;
  } else if (
    selectedView.value === "yearly" &&
    !selectedYear.value &&
    yearlyBalances.value.length > 0
  ) {
    selectedYear.value =
      yearlyBalances.value[yearlyBalances.value.length - 1].year.toString();
  }
};

onMounted(async () => {
  await transactionStore.fetchTransactions();
  initializeDefaults();
});

// Watch for view changes and set defaults
watch(selectedView, () => {
  if (selectedView.value === "monthly") {
    selectedMonth.value =
      monthlyBalances.value.length > 0
        ? monthlyBalances.value[monthlyBalances.value.length - 1].month
        : "";
    selectedYear.value = "";
  } else {
    selectedYear.value =
      yearlyBalances.value.length > 0
        ? yearlyBalances.value[yearlyBalances.value.length - 1].year.toString()
        : "";
    selectedMonth.value = "";
  }
});

// Watch for data changes and initialize defaults if needed
watch(
  [monthlyBalances, yearlyBalances],
  () => {
    initializeDefaults();
  },
  { deep: true }
);
</script>

<style scoped>
.balance-dashboard {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  min-width: 0;
  width: 100%;
}

/* Header */
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.dashboard-title {
  font-size: clamp(1.5rem, 1.35rem + 0.8vw, 2rem);
  font-weight: 700;
  color: #111827;
  margin: 0;
}

.controls-section {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.view-toggle {
  display: flex;
  background: #f8fafc;
  border-radius: 12px;
  padding: 4px;
  border: 1px solid #e2e8f0;
}

.toggle-btn {
  padding: 0.5rem 1rem;
  border: none;
  background: transparent;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
  color: #64748b;
  font-size: 0.875rem;
}

.toggle-btn.active {
  background: white;
  color: #1e293b;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.period-selector {
  min-width: 180px;
}

.period-select {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.875rem;
  background: white;
  color: #374151;
  cursor: pointer;
  transition: border-color 0.2s ease;
}

.period-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* Period Summary Card */
.period-summary-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.summary-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.period-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

.period-subtitle {
  font-size: 0.875rem;
  color: #6b7280;
  margin-top: 0.25rem;
}

.net-change-badge {
  text-align: right;
  padding: 1rem;
  border-radius: 12px;
  border: 2px solid;
  background: white;
}

.net-change-badge.positive {
  border-color: #d1fae5;
  background: #f0fdf4;
}

.net-change-badge.negative {
  border-color: #fecaca;
  background: #fef2f2;
}

.net-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.25rem;
}

.net-amount {
  font-size: 1.25rem;
  font-weight: 700;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-radius: 12px;
  border: 1px solid #f1f5f9;
  background: #fafbfc;
  transition: all 0.2s ease;
}

.summary-item.highlight {
  border-color: #e2e8f0;
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.item-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.item-icon.opening {
  background: #f3f4f6;
  color: #6b7280;
}

.item-icon.income {
  background: #d1fae5;
  color: #059669;
}

.item-icon.expense {
  background: #fecaca;
  color: #dc2626;
}

.item-icon.closing {
  background: #dbeafe;
  color: #2563eb;
}

.item-content {
  flex: 1;
  min-width: 0;
}

.item-label {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
  margin-bottom: 0.25rem;
}

.item-value {
  font-size: 1.125rem;
  font-weight: 700;
  color: #111827;
}

.income-text {
  color: #059669;
}

.expense-text {
  color: #dc2626;
}

.positive-text {
  color: #059669;
}

.negative-text {
  color: #dc2626;
}

.summary-footer {
  display: flex;
  justify-content: center;
  padding-top: 1rem;
  border-top: 1px solid #f1f5f9;
}

.transaction-count {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
}

/* Chart Section */
.chart-section {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.chart-legend {
  display: flex;
  gap: 1.5rem;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #6b7280;
}

.legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.legend-dot.income {
  background: #10b981;
}

.legend-dot.expense {
  background: #ef4444;
}

.legend-dot.net {
  background: #3b82f6;
}

.chart-container {
  height: 400px;
  width: 100%;
}

/* Table Section */
.table-section {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  min-width: 0;
  width: 100%;
}

.table-info {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
}

.table-section .section-header {
  padding: 1.5rem;
  background: #fafbfc;
  border-bottom: 1px solid #e2e8f0;
  margin-bottom: 0;
}

.table-wrapper {
  overflow-x: auto;
  overflow-y: auto;
  width: 100%;
  min-width: 0;
  -webkit-overflow-scrolling: touch;
  container-type: inline-size;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 700px;
}

.data-table th {
  background: #f8fafc;
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  color: #374151;
  font-size: 0.875rem;
  border-bottom: 1px solid #e2e8f0;
  white-space: nowrap;
}

.period-col {
  width: 15%;
  min-width: 120px;
}

.amount-col {
  width: 14%;
  min-width: 110px;
}

.count-col {
  width: 12%;
  min-width: 100px;
}

.data-row {
  cursor: pointer;
  transition: all 0.2s ease;
  border-bottom: 1px solid #f8fafc;
}

.data-row:hover {
  background: #fafbfc;
}

.data-row.selected {
  background: #eff6ff;
  border-color: #dbeafe;
}

.data-table td {
  padding: 1rem;
  font-size: 0.875rem;
}

.period-cell {
  font-weight: 600;
  color: #111827;
}

.amount-cell {
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.amount-cell.neutral {
  color: #6b7280;
}

.amount-cell.positive {
  color: #059669;
}

.amount-cell.negative {
  color: #dc2626;
}

.count-cell {
  text-align: center;
}

.transaction-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 24px;
  background: #f1f5f9;
  color: #64748b;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

/* Responsive Design */
@media (max-width: 768px) {
  .balance-dashboard {
    gap: 1rem;
  }

  .summary-header {
    margin-bottom: 1rem;
  }

  .summary-grid {
    margin-bottom: 1rem;
  }

  .dashboard-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .dashboard-title {
    font-size: 1.5rem;
  }

  .controls-section {
    width: 100%;
    justify-content: space-between;
  }

  .period-selector {
    min-width: 140px;
  }

  .period-summary-card {
    padding: 1.5rem;
  }

  .summary-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .net-change-badge {
    align-self: stretch;
    text-align: center;
  }

  .summary-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .chart-container {
    height: 300px;
  }

  .chart-legend {
    flex-direction: column;
    gap: 0.5rem;
  }

  .data-table {
    font-size: 0.8125rem;
  }

  .data-table th,
  .data-table td {
    padding: 0.75rem 0.5rem;
  }
}

@media (max-width: 480px) {
  .view-toggle {
    width: 100%;
  }

  .toggle-btn {
    flex: 1;
    text-align: center;
  }

  .controls-section {
    flex-direction: column;
    gap: 0.75rem;
  }

  .period-selector {
    width: 100%;
    min-width: unset;
  }
}
</style>
