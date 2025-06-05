<template>
  <div class="analytics-dashboard">
    <!-- Summary Statistics -->
    <div class="summary-stats">
      <div class="stat-card">
        <div class="stat-icon">💰</div>
        <div class="stat-content">
          <div class="stat-label">Total Income</div>
          <div class="stat-value">{{ formatCurrency(totalIncome) }}</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">💸</div>
        <div class="stat-content">
          <div class="stat-label">Total Expenses</div>
          <div class="stat-value">{{ formatCurrency(totalExpenses) }}</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📊</div>
        <div class="stat-content">
          <div class="stat-label">Net Balance</div>
          <div class="stat-value" :class="{ negative: netBalance < 0 }">
            {{ formatCurrency(netBalance) }}
          </div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🔢</div>
        <div class="stat-content">
          <div class="stat-label">Total Transactions</div>
          <div class="stat-value">{{ totalTransactions }}</div>
        </div>
      </div>
    </div>

    <!-- Charts Grid -->
    <div class="charts-grid">
      <!-- Income vs Expenses Comparison Bar Chart -->
      <div class="chart-card">
        <div class="chart-header">
          <h3>Income vs Expenses</h3>
        </div>
        <div class="chart-container">
          <v-chart
            :option="incomeExpenseBarOption"
            style="height: 300px"
            :loading="transactionStore.loading"
            :autoresize="true"
          />
        </div>
      </div>

      <!-- Expenses by Purpose - Vertical Column Chart -->
      <div class="chart-card">
        <div class="chart-header">
          <h3>Top Expenses by Purpose</h3>
        </div>
        <div class="chart-container">
          <v-chart
            :option="expensesByPurposeColumnOption"
            style="height: 350px"
            :loading="transactionStore.loading"
            :autoresize="true"
          />
        </div>
      </div>

      <!-- Income by Purpose - Area Chart -->
      <div class="chart-card">
        <div class="chart-header">
          <h3>Income Sources Distribution</h3>
        </div>
        <div class="chart-container">
          <v-chart
            :option="incomeByPurposeAreaOption"
            style="height: 350px"
            :loading="transactionStore.loading"
            :autoresize="true"
          />
        </div>
      </div>

      <!-- Transaction Count by Purpose - Simple Column Chart -->
      <div class="chart-card">
        <div class="chart-header">
          <h3>Transaction Count by Category</h3>
        </div>
        <div class="chart-container">
          <v-chart
            :option="transactionCountColumnOption"
            style="height: 300px"
            :loading="transactionStore.loading"
            :autoresize="true"
          />
        </div>
      </div>

      <!-- Top Purposes by Amount -->
      <div class="chart-card">
        <div class="chart-header">
          <h3>Top Purposes by Amount</h3>
        </div>
        <div class="chart-container">
          <v-chart
            :option="topPurposesBarOption"
            style="height: 300px"
            :loading="transactionStore.loading"
            :autoresize="true"
          />
        </div>
      </div>

      <!-- Monthly Trends -->
      <div class="chart-card full-width">
        <div class="chart-header">
          <h3>Monthly Income vs Expenses Trend</h3>
        </div>
        <div class="chart-container">
          <v-chart
            :option="monthlyTrendOption"
            style="height: 400px"
            :loading="transactionStore.loading"
            :autoresize="true"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from "vue";
import { useTransactionStore } from "../stores/transactions";
import { use } from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import { BarChart, LineChart, PieChart } from "echarts/charts";
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
} from "echarts/components";
import VChart from "vue-echarts";
import { DateTime } from "luxon";
import { formatCurrency } from "../utils";

// Register ECharts components
use([
  CanvasRenderer,
  BarChart,
  LineChart,
  PieChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
]);

const transactionStore = useTransactionStore();

// Computed properties from store
const totalIncome = computed(() => transactionStore.totalIncome);
const totalExpenses = computed(() => transactionStore.totalExpenses);
const netBalance = computed(() => transactionStore.netBalance);
const totalTransactions = computed(() => transactionStore.totalTransactions);
const allTransactions = computed(() => transactionStore.allTransactions);

// Income vs Expenses Comparison Bar Chart
const incomeExpenseBarOption = computed(() => ({
  tooltip: {
    trigger: "axis",
    axisPointer: { type: "shadow" },
    formatter: (params) => {
      return `${params[0].name}: ${formatCurrency(params[0].value)}`;
    },
    position: function (pt) {
      return [pt[0], "10%"];
    },
  },
  grid: {
    left: "3%",
    right: "4%",
    bottom: "3%",
    containLabel: true,
  },
  xAxis: {
    type: "category",
    data: ["Income", "Expenses"],
    axisLabel: {
      fontSize: 12,
    },
  },
  yAxis: {
    type: "value",
    axisLabel: {
      formatter: (v) => formatCurrency(v, true), // Shortened format
      fontSize: 11,
    },
  },
  series: [
    {
      type: "bar",
      data: [
        {
          value: totalIncome.value,
          itemStyle: { color: "#10b981" },
        },
        {
          value: totalExpenses.value,
          itemStyle: { color: "#ef4444" },
        },
      ],
      barWidth: "60%",
      label: {
        show: true,
        position: "top",
        formatter: (params) => formatCurrency(params.value, true),
        fontSize: 11,
      },
    },
  ],
}));

// Expenses by Purpose - Vertical Column Chart
const expensesByPurposeColumnOption = computed(() => {
  const expensesByPurpose = allTransactions.value
    .filter((t) => t.type === "expense")
    .reduce((acc, t) => {
      const purpose = t.transaction_purposes?.name || "Other";
      acc[purpose] = (acc[purpose] || 0) + Number(t.amount);
      return acc;
    }, {});

  const sortedData = Object.entries(expensesByPurpose)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6); // Top 6 for better visibility

  return {
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      formatter: (params) => {
        return `${params[0].name}: ${formatCurrency(params[0].value)}`;
      },
    },
    grid: {
      left: "3%",
      right: "4%",
      top: "10%",
      bottom: "15%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: sortedData.map(([name]) =>
        name.length > 12 ? name.substring(0, 12) + "..." : name
      ),
      axisLabel: {
        fontSize: 10,
        rotate: 30,
      },
    },
    yAxis: {
      type: "value",
      axisLabel: {
        formatter: (v) => formatCurrency(v, true),
        fontSize: 10,
      },
    },
    series: [
      {
        type: "bar",
        data: sortedData.map(([, value]) => ({
          value,
          itemStyle: {
            color: "#ef4444",
          },
        })),
        barWidth: "60%",
        label: {
          show: true,
          position: "top",
          formatter: (params) => formatCurrency(params.value, true),
          fontSize: 9,
        },
      },
    ],
  };
});

// Income by Purpose - Area Chart
const incomeByPurposeAreaOption = computed(() => {
  const incomeByPurpose = allTransactions.value
    .filter((t) => t.type === "income")
    .reduce((acc, t) => {
      const purpose = t.transaction_purposes?.name || "Other";
      acc[purpose] = (acc[purpose] || 0) + Number(t.amount);
      return acc;
    }, {});

  const sortedData = Object.entries(incomeByPurpose)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5); // Top 5 for cleaner area chart

  // Create categories for x-axis (indexed positions)
  const categories = sortedData.map((_, index) => `#${index + 1}`);
  const values = sortedData.map(([, value]) => value);
  const labels = sortedData.map(([name]) => name);

  return {
    tooltip: {
      trigger: "axis",
      formatter: (params) => {
        const index = params[0].dataIndex;
        return `${labels[index]}: ${formatCurrency(params[0].value)}`;
      },
    },
    grid: {
      left: "3%",
      right: "4%",
      top: "10%",
      bottom: "10%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: categories,
      axisLabel: {
        fontSize: 11,
      },
    },
    yAxis: {
      type: "value",
      axisLabel: {
        formatter: (v) => formatCurrency(v, true),
        fontSize: 10,
      },
    },
    series: [
      {
        type: "line",
        data: values,
        areaStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(16, 185, 129, 0.6)" },
              { offset: 1, color: "rgba(16, 185, 129, 0.1)" },
            ],
          },
        },
        lineStyle: {
          color: "#10b981",
          width: 3,
        },
        itemStyle: {
          color: "#10b981",
        },
        smooth: true,
      },
    ],
  };
});

// Transaction Count by Purpose - Simple Column Chart
const transactionCountColumnOption = computed(() => {
  const countByPurpose = allTransactions.value.reduce((acc, t) => {
    const purpose = t.transaction_purposes?.name || "Other";
    acc[purpose] = (acc[purpose] || 0) + 1;
    return acc;
  }, {});

  const sortedData = Object.entries(countByPurpose)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6); // Top 6 for better visibility

  const colors = [
    "#3b82f6",
    "#8b5cf6",
    "#06b6d4",
    "#f59e0b",
    "#ef4444",
    "#10b981",
  ];

  return {
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      formatter: (params) => {
        return `${params[0].name}: ${params[0].value} transactions`;
      },
    },
    grid: {
      left: "3%",
      right: "4%",
      top: "10%",
      bottom: "15%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: sortedData.map(([name]) =>
        name.length > 10 ? name.substring(0, 10) + "..." : name
      ),
      axisLabel: {
        fontSize: 10,
        rotate: 25,
      },
    },
    yAxis: {
      type: "value",
      axisLabel: {
        fontSize: 10,
      },
    },
    series: [
      {
        type: "bar",
        data: sortedData.map(([, value], index) => ({
          value,
          itemStyle: {
            color: colors[index % colors.length],
          },
        })),
        barWidth: "50%",
        label: {
          show: true,
          position: "top",
          fontSize: 10,
        },
      },
    ],
  };
});

// Monthly Trend Chart (unchanged as it's already good)
const monthlyTrendOption = computed(() => {
  const monthlyData = transactionStore.monthlyIncomeExpenseChartData;

  return {
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      formatter: (params) => {
        let result = `${params[0].axisValue}<br/>`;
        params.forEach((param) => {
          result += `${param.seriesName}: ${formatCurrency(param.value)}<br/>`;
        });
        return result;
      },
      position: function (pt) {
        return [pt[0], "10%"];
      },
    },
    legend: {
      data: ["Income", "Expenses"],
      top: 10,
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "3%",
      top: "15%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: monthlyData.map((d) =>
        DateTime.fromISO(d.date).toFormat("MMM yyyy")
      ),
      axisLabel: {
        rotate: 45,
        fontSize: 10,
      },
    },
    yAxis: {
      type: "value",
      axisLabel: {
        formatter: (v) => formatCurrency(v, true),
        fontSize: 10,
      },
    },
    series: [
      {
        name: "Income",
        type: "bar",
        stack: "total",
        data: monthlyData.map((d) => d.income),
        itemStyle: { color: "#10b981" },
      },
      {
        name: "Expenses",
        type: "bar",
        stack: "total",
        data: monthlyData.map((d) => d.expense),
        itemStyle: { color: "#ef4444" },
      },
    ],
  };
});

onMounted(async () => {
  await transactionStore.fetchTransactions();
});

// Top Purposes by Amount Bar Chart (unchanged as it's already good)
const topPurposesBarOption = computed(() => {
  const purposeTotals = allTransactions.value.reduce((acc, t) => {
    const purpose = t.transaction_purposes?.name || "Other";
    acc[purpose] = (acc[purpose] || 0) + Number(t.amount);
    return acc;
  }, {});

  const sortedPurposes = Object.entries(purposeTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  return {
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "shadow",
      },
      formatter: (params) => {
        return `${params[0].name}: ${formatCurrency(params[0].value)}`;
      },
      position: function (pt) {
        return [pt[0], "10%"];
      },
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "3%",
      containLabel: true,
    },
    xAxis: {
      type: "value",
      axisLabel: {
        formatter: (value) => formatCurrency(value, true),
        fontSize: 10,
        rotate: 25,
      },
    },
    yAxis: {
      type: "category",
      data: sortedPurposes.map(([name]) =>
        name.length > 15 ? name.substring(0, 15) + "..." : name
      ),
      axisLabel: {
        fontSize: 11,
      },
    },
    series: [
      {
        type: "bar",
        data: sortedPurposes.map(([, value]) => value),
        itemStyle: {
          color: "#3b82f6",
        },
        barWidth: "70%",
      },
    ],
  };
});
</script>

<style scoped>
.analytics-dashboard {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  min-width: 0;

  @media (max-width: 768px) {
    gap: 1rem;
  }
}

.summary-stats {
  display: grid;
  gap: 1.5rem;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));

  @media (max-width: 1360px) {
    grid-template-columns: repeat(2, 1fr);
  }
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  border: 1px solid #e9ecef;

  @media (max-width: 640px) {
    padding: 1rem;
  }
}

.stat-icon {
  font-size: 2rem;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f9fa;
  border-radius: 50%;
}

.stat-content {
  flex: 1;
}

.stat-label {
  color: #6c757d;
  font-size: 0.875rem;
  margin-bottom: 0.25rem;
}

.stat-value {
  font-size: clamp(1.125rem, 1.0125rem + 0.6vw, 1.5rem);
  font-weight: 700;
  color: #343a40;
}

.stat-value.negative {
  color: #ef4444;
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 1.5rem;

  @media (max-width: 768px) {
    gap: 1rem;
  }
}

.chart-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  border: 1px solid #e9ecef;
}

.chart-card.full-width {
  grid-column: 1 / -1;
}

.chart-header {
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #e9ecef;
}

.chart-header h3 {
  margin: 0;
  color: #343a40;
  font-size: 1.125rem;
  font-weight: 600;
}

.chart-container {
  position: relative;
}

@media (max-width: 1200px) {
  .charts-grid {
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  }
}

@media (max-width: 768px) {
  .charts-grid {
    grid-template-columns: 1fr;
  }

  .chart-card {
    padding: 1rem;
  }
}
</style>
