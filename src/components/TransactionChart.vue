<template>
  <div class="chart-container">
    <div class="section-header">
      <h3>Transaction Analytics</h3>
      <div class="chart-controls">
        <!-- Group By Dropdown -->
        <label class="dropdown-label">
          <select
            v-model="groupMode"
            @change="onGroupModeChange"
            class="group-select"
          >
            <option v-for="mode in groupModes" :key="mode" :value="mode">
              {{ mode.charAt(0).toUpperCase() + mode.slice(1) }}
            </option>
          </select>
        </label>

        <!-- Period Navigation -->
        <div class="period-navigation">
          <button @click="previousPeriod" class="nav-button">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <polyline points="15,18 9,12 15,6"></polyline>
            </svg>
          </button>
          <span class="current-period">{{ currentPeriodLabel }}</span>
          <button
            @click="nextPeriod"
            class="nav-button"
            :disabled="isCurrentPeriod"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <polyline points="9,18 15,12 9,6"></polyline>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <h3>Income vs. Expenses ({{ groupMode }} - {{ currentPeriodLabel }})</h3>

    <div v-if="loading" class="loading-spinner">
      <div class="spinner"></div>
      <p>Loading transactions...</p>
    </div>

    <VChart
      v-else
      :option="chartOptions"
      style="width: 100%; height: 400px"
      :autoresize="true"
    />
  </div>
</template>

<script setup>
import { computed, ref } from "vue";
import { useTransactionStore } from "../stores/transactions";
import { use } from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import { BarChart, LineChart } from "echarts/charts";
import { DateTime } from "luxon";
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
} from "echarts/components";
import VChart from "vue-echarts";
import { formatCurrency } from "../utils";

// Register necessary ECharts components
use([
  CanvasRenderer,
  BarChart,
  LineChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
]);

const props = defineProps({
  chartType: {
    type: String,
    default: "bar",
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

const transactionStore = useTransactionStore();

const groupModes = ["daily", "weekly", "monthly", "yearly"];
const groupMode = ref("daily");

// Current period tracking
const currentDate = ref(DateTime.now());
const currentWeek = ref(DateTime.now().startOf("week"));
const currentMonth = ref(DateTime.now().startOf("month"));
const currentYear = ref(DateTime.now().startOf("year"));

const currentPeriodLabel = computed(() => {
  switch (groupMode.value) {
    case "daily":
      return currentDate.value.toFormat("MMM dd, yyyy");
    case "weekly":
      const weekStart = currentWeek.value;
      const weekEnd = weekStart.endOf("week");
      return `${weekStart.toFormat("MMM dd")} - ${weekEnd.toFormat(
        "MMM dd, yyyy"
      )}`;
    case "monthly":
      return currentMonth.value.toFormat("MMMM yyyy");
    case "yearly":
      return currentYear.value.toFormat("yyyy");
    default:
      return "";
  }
});

const isCurrentPeriod = computed(() => {
  const now = DateTime.now();
  switch (groupMode.value) {
    case "daily":
      return currentDate.value.hasSame(now, "day");
    case "weekly":
      return currentWeek.value.hasSame(now.startOf("week"), "week");
    case "monthly":
      return currentMonth.value.hasSame(now, "month");
    case "yearly":
      return currentYear.value.hasSame(now, "year");
    default:
      return true;
  }
});

const chartData = computed(() => {
  const periodData = getCurrentPeriodData();
  switch (groupMode.value) {
    case "daily":
      return transactionStore.getDailyChartData(
        periodData.start,
        periodData.end
      );
    case "weekly":
      return transactionStore.getWeeklyChartData(
        periodData.start,
        periodData.end
      );
    case "monthly":
      return transactionStore.getMonthlyChartData(
        periodData.start,
        periodData.end
      );
    case "yearly":
      return transactionStore.getYearlyChartData(
        periodData.start,
        periodData.end
      );
    default:
      return [];
  }
});

const getCurrentPeriodData = () => {
  switch (groupMode.value) {
    case "daily":
      return {
        start: currentDate.value.startOf("day"),
        end: currentDate.value.endOf("day"),
      };
    case "weekly":
      return {
        start: currentWeek.value.startOf("week"),
        end: currentWeek.value.endOf("week"),
      };
    case "monthly":
      return {
        start: currentMonth.value.startOf("month"),
        end: currentMonth.value.endOf("month"),
      };
    case "yearly":
      return {
        start: currentYear.value.startOf("year"),
        end: currentYear.value.endOf("year"),
      };
    default:
      return { start: DateTime.now(), end: DateTime.now() };
  }
};

const onGroupModeChange = () => {
  // Reset to current period when changing group mode
  const now = DateTime.now();
  currentDate.value = now;
  currentWeek.value = now.startOf("week");
  currentMonth.value = now.startOf("month");
  currentYear.value = now.startOf("year");
};

const previousPeriod = () => {
  switch (groupMode.value) {
    case "daily":
      currentDate.value = currentDate.value.minus({ days: 1 });
      break;
    case "weekly":
      currentWeek.value = currentWeek.value.minus({ weeks: 1 });
      break;
    case "monthly":
      currentMonth.value = currentMonth.value.minus({ months: 1 });
      break;
    case "yearly":
      currentYear.value = currentYear.value.minus({ years: 1 });
      break;
  }
};

const nextPeriod = () => {
  if (isCurrentPeriod.value) return;

  switch (groupMode.value) {
    case "daily":
      currentDate.value = currentDate.value.plus({ days: 1 });
      break;
    case "weekly":
      currentWeek.value = currentWeek.value.plus({ weeks: 1 });
      break;
    case "monthly":
      currentMonth.value = currentMonth.value.plus({ months: 1 });
      break;
    case "yearly":
      currentYear.value = currentYear.value.plus({ years: 1 });
      break;
  }
};

const chartOptions = computed(() => {
  const labels = chartData.value.map((item) => {
    switch (groupMode.value) {
      case "daily":
        return DateTime.fromISO(item.date).toFormat("HH:mm");
      case "weekly":
        return DateTime.fromISO(item.date).toFormat("MMM dd");
      case "monthly":
        return DateTime.fromISO(item.date).toFormat("dd");
      case "yearly":
        return DateTime.fromISO(item.date).toFormat("MMM");
      default:
        return item.date;
    }
  });

  const incomeData = chartData.value.map((item) => item.income);
  const expenseData = chartData.value.map((item) => item.expense);

  return {
    tooltip: {
      trigger: "axis",
      formatter: function (params) {
        let result = `<div style="font-weight: bold;">${params[0].axisValue}</div>`;
        params.forEach((param) => {
          const color = param.color;
          const name = param.seriesName;
          const value = formatCurrency(param.value);
          result += `<div style="margin: 4px 0;"><span style="display:inline-block;margin-right:5px;border-radius:10px;width:10px;height:10px;background-color:${color};"></span>${name}: ${value}</div>`;
        });
        return result;
      },
    },
    legend: { data: ["Income", "Expenses"] },
    grid: { left: "3%", right: "4%", bottom: "3%", containLabel: true },
    xAxis: {
      type: "category",
      data: labels,
      axisLabel: {
        rotate: groupMode.value === "daily" ? 45 : 0,
      },
    },
    yAxis: {
      type: "value",
      axisLabel: {
        formatter: function (value) {
          return formatCurrency(value);
        },
      },
    },
    series: [
      {
        name: "Income",
        type: props.chartType,
        data: incomeData,
        itemStyle: { color: "#10b981" },
      },
      {
        name: "Expenses",
        type: props.chartType,
        data: expenseData,
        itemStyle: { color: "#ef4444" },
      },
    ],
  };
});
</script>

<style scoped>
.chart-container {
  background-color: #fff;
  padding: 1rem;
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  gap: 1rem;
  position: relative;
  border: 1px solid #e0e0e0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.chart-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
  align-self: flex-end;

  @media (max-width: 490px) {
    justify-content: flex-end;
    flex-direction: column;
  }
}

.dropdown-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;

  @media (max-width: 490px) {
    align-self: flex-end;
  }
}

.group-select {
  padding: 0.4rem 0.8rem;
  border-radius: 6px;
  border: 1px solid #ccc;
  background-color: #fff;
}

.period-navigation {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  /* background-color: #f8f9fa; */
  /* padding: 0.5rem; */
  /* border-radius: 8px; */
  /* border: 1px solid #e0e0e0; */
}

.nav-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background-color: #fff;
  border-radius: 50%;
  cursor: pointer;
  transition: background-color 0.2s;
}

.nav-button:hover:not(:disabled) {
  background-color: #e9ecef;
}

.nav-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.current-period {
  font-weight: 500;
  min-width: 120px;
  text-align: center;
  font-size: 0.9rem;
}

.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
  gap: 1rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

@media (max-width: 768px) {
  .section-header {
    flex-direction: column;
    align-items: stretch;
  }

  .current-period {
    min-width: 100px;
    font-size: 0.8rem;
  }
}
</style>
