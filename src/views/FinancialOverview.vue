<!-- UserDashboard.vue -->
<template>
  <div class="dashboard">
    <div class="dashboard-header">
      <h1>Financial Overview</h1>
      <div class="date-range">
        <span>{{ currentMonth }}</span>
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="summary-grid">
      <div class="summary-card income">
        <div class="card-icon">💰</div>
        <div class="card-content">
          <h3>Total Income</h3>
          <p :class="`amount ${incomeClass}`">
            {{ formatCurrency(totalIncome) }}
          </p>
          <span :class="`change ${incomeClass}`">
            {{ incomeGrowth >= 0 ? "+" : "" }}{{ incomeGrowth }}% from last
            month
          </span>
        </div>
      </div>

      <div class="summary-card expense">
        <div class="card-icon">💸</div>
        <div class="card-content">
          <h3>Total Expenses</h3>
          <p :class="`amount ${expenseClass}`">
            {{ formatCurrency(totalExpenses) }}
          </p>
          <span :class="`change ${expenseClass}`">
            {{ expenseGrowth >= 0 ? "+" : "" }}{{ expenseGrowth }}% from last
            month
          </span>
        </div>
      </div>

      <div class="summary-card balance">
        <div class="card-icon">📈</div>
        <div class="card-content">
          <h3>Net Balance</h3>
          <p :class="`amount ${netClass}`">{{ formatCurrency(netBalance) }}</p>
          <span :class="`change ${netClass}`">
            {{ netGrowth >= 0 ? "+" : "" }}{{ netGrowth }}% from last month
          </span>
        </div>
      </div>

      <div class="summary-card transactions">
        <div class="card-icon">📋</div>
        <div class="card-content">
          <h3>Transactions</h3>
          <p class="amount neutral">
            {{ getStatistics.thisMonth.transactions }}
          </p>
          <span class="change neutral">This month</span>
        </div>
      </div>
    </div>

    <!-- Main Content Grid -->
    <div class="content-grid">
      <!-- Chart Section -->
      <TransactionChart :loading="loading" />

      <!-- Recent Activity -->
      <div class="activity-section">
        <div class="section-header">
          <h3>Recent Activity</h3>
          <router-link
            to="/transactions"
            class="view-all"
            v-if="mappedRecentActivities.length"
            >View All</router-link
          >
        </div>
        <div class="activity-list">
          <template v-if="mappedRecentActivities.length">
            <div
              class="activity-item"
              v-for="activity in mappedRecentActivities"
              :key="activity.id"
            >
              <div class="activity-icon" :class="activity.type">
                {{ activity.icon }}
              </div>
              <div class="activity-details">
                <p class="activity-title">{{ activity.title }}</p>
                <p class="activity-date">{{ activity.date }}</p>
              </div>
              <div class="activity-amount-wrapper" :class="activity.type">
                <span class="activity-amount" :class="activity.type">
                  {{ formatCurrency(activity.amount) }}
                </span>
              </div>
            </div>
          </template>

          <p class="activity-title" v-else>No recent activity</p>
        </div>
      </div>
    </div>

    <!-- Transactions Table -->
    <TransactionsTable :editable="false" @update:loading="updateLoading" />
  </div>
</template>

<script setup>
import TransactionsTable from "../components/TransactionsTable.vue";
import TransactionChart from "../components/TransactionChart.vue";
import { ref, computed, onMounted } from "vue";
import { useTransactions } from "../stores/transactions";
import { formatCurrency } from "../utils";

const filteredTransactions = ref([]);

const {
  loading,
  fetchTransactions,
  totalIncome,
  totalExpenses,
  netBalance,
  recentActivity,
  getStatistics,
} = useTransactions();

const incomeGrowth = computed(() =>
  getStatistics.value.growth.income.toFixed(1)
);
const expenseGrowth = computed(() =>
  getStatistics.value.growth.expenses.toFixed(1)
);

const netGrowth = computed(() => getStatistics.value.growth.net.toFixed(1));

const currentMonth = computed(() => {
  return new Date().toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
});

const incomeClass = computed(() =>
  getStatistics.value.growth.income >= 0 ? "positive" : "negative"
);

const expenseClass = computed(() =>
  getStatistics.value.growth.expenses >= 0 ? "positive" : "negative"
);

const netClass = computed(() =>
  getStatistics.value.growth.net >= 0 ? "positive" : "negative"
);

// console.log(recentActivity);

const mappedRecentActivities = computed(() =>
  (recentActivity.value || []).map((activity) => {
    const isIncome = activity.type === "income";

    let icon = "🔄";
    let title = activity.description || "Activity";

    switch (activity.purpose) {
      case "transfer":
        icon = "🔁";
        title = "Funds Transfer";
        break;
      case "purchase":
        icon = "🛍️";
        title = "Purchase";
        break;
      case "refund":
        icon = "🔙";
        title = "Refund";
        break;
      case "bonus":
        icon = "🎁";
        title = "Bonus Received";
        break;
      default:
        icon = isIncome ? "💰" : "💸";
        break;
    }

    return {
      id: activity.id,
      title,
      date: new Date(activity.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      amount: activity.amount,
      type: isIncome ? "income" : "expense",
      icon,
      purpose: activity.purpose || "Purpose", // Add this line
    };
  })
);

// Update the filtered transactions whenever the table emits a new value
const updateFilteredTransactions = (data) => {
  filteredTransactions.value = data;
};

// Update the loading state when the table emits the loading event
const updateLoading = (state) => {
  loading.value = state;
};

onMounted(async () => {
  await fetchTransactions();
});
</script>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;

  @media (max-width: 768px) {
    gap: 1rem;
  }
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  /* margin-bottom: 1rem; */
}

.dashboard-header h1 {
  font-size: clamp(1.5rem, 1.35rem + 0.8vw, 2rem);
  font-weight: 700;
  color: #111827;
  margin: 0;
}

.date-range {
  color: #666;
  font-size: 0.875rem;
  font-weight: 500;
}

/* Summary Cards */
.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
  /* margin-bottom: 1.5rem; */

  @media (max-width: 1360px) {
    grid-template-columns: repeat(2, 1fr);
  }
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.summary-card {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  display: flex;
  align-items: center;
  gap: 1rem;

  @media (max-width: 640px) {
    padding: 1rem;
  }
}

.card-icon {
  font-size: 2rem;
  opacity: 0.8;
}

.card-content h3 {
  margin: 0 0 0.5rem 0;
  color: #666;
  font-size: 0.875rem;
  font-weight: 500;
}

.amount {
  font-size: clamp(1.125rem, 1.0125rem + 0.6vw, 1.5rem);
  font-weight: 600;
  margin: 0 0 0.25rem 0;
}

.amount.positive {
  color: #28a745;
}
.amount.negative {
  color: #dc3545;
}
.amount.neutral {
  color: #333;
}

.change {
  font-size: 0.75rem;
}

.change.positive {
  color: #28a745;
}
.change.negative {
  color: #dc3545;
}
.change.neutral {
  color: #666;
}

/* Content Grid */
.content-grid {
  display: grid;
  grid-template-columns: auto auto;
  gap: 1.5rem;

  @media (max-width: 768px) {
    gap: 1rem;
  }

  @media (max-width: 1440px) {
    grid-template-columns: 1fr;
  }
}

.chart-container {
  min-height: 300px;
}

/* Activity Section */
.activity-section {
  background: white;
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}

.view-all {
  color: #1976d2;
  cursor: pointer;
  font-size: 0.875rem;
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  border-radius: 6px;
  background: #f8f9fa;

  @media (max-width: 424.98px) {
    flex-direction: column;
    align-items: flex-start;
  }
}

.activity-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
}

.activity-icon.income {
  background: rgba(40, 167, 69, 0.1);
}

.activity-icon.expense {
  background: rgba(220, 53, 69, 0.1);
}

.activity-details {
  flex: 1;
}

.activity-title {
  margin: 0 0 0.25rem 0;
  font-weight: 500;
  color: #333;
}

.activity-date {
  margin: 0;
  font-size: 0.75rem;
  color: #666;
}

.activity-amount-wrapper {
  font-weight: 600;
  display: inline-flex;
  flex-direction: column;
  gap: 0.25rem;
}

.activity-amount.income {
  color: #28a745;
}

.activity-amount.expense {
  color: #dc3545;
}

/* Table Section */
.table-section {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}

.table-controls {
  display: flex;
  gap: 1rem;
}

/* .search-input,
.filter-select {
  padding: 0.5rem;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  font-size: 0.875rem;
} */

/* .search-input {
  flex: 1;
  max-width: 300px;
} */

/* Responsive Design */
@media (max-width: 768px) {
  .table-controls {
    flex-direction: column;
  }
}
</style>
