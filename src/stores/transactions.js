import { defineStore, storeToRefs } from "pinia";
import { computed } from "vue";
import { supabase } from "../supabase";
import { DateTime } from "luxon";

function toLocalDateString(dateObj) {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const day = String(dateObj.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export const useTransactionStore = defineStore("transactions", {
  state: () => ({
    allTransactions: [],
    transactions: [],
    purposes: [], // list of all transaction purposes
    loading: false,
    error: null,

    filters: {
      purpose: "", // filter by purpose name
      type: "", // 'income' or 'expense'
      searchQuery: "",
    },

    pagination: {
      page: 1,
      perPage: 10,
      total: 0,
    },
  }),

  getters: {
    totalIncome: (state) =>
      state.allTransactions
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + Number(t.amount), 0),

    totalExpenses: (state) =>
      state.allTransactions
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + Number(t.amount), 0),

    netBalance: (state) => state.totalIncome - state.totalExpenses,

    totalTransactions: (state) => state.allTransactions.length,

    recentActivity: (state) =>
      [...state.allTransactions]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5),

    getStatistics: (state) => {
      const thisMonth = toLocalDateString(new Date()).slice(0, 7);
      const lastMonth = toLocalDateString(
        new Date(new Date().setMonth(new Date().getMonth() - 1))
      ).slice(0, 7);

      const filterMonth = (txs, month) =>
        txs.filter((t) => t.date.startsWith(month));
      const sumByType = (txs, type) =>
        txs
          .filter((t) => t.type === type)
          .reduce((sum, t) => sum + Number(t.amount), 0);

      const thisTx = filterMonth(state.allTransactions, thisMonth);
      const lastTx = filterMonth(state.allTransactions, lastMonth);

      const thisIncome = sumByType(thisTx, "income");
      const thisExpense = sumByType(thisTx, "expense");
      const lastIncome = sumByType(lastTx, "income");
      const lastExpense = sumByType(lastTx, "expense");

      return {
        thisMonth: {
          income: thisIncome,
          expenses: thisExpense,
          net: thisIncome - thisExpense,
          transactions: thisTx.length,
        },
        lastMonth: {
          income: lastIncome,
          expenses: lastExpense,
          net: lastIncome - lastExpense,
          transactions: lastTx.length,
        },
        growth: {
          income: lastIncome
            ? ((thisIncome - lastIncome) / lastIncome) * 100
            : 0,
          expenses: lastExpense
            ? ((thisExpense - lastExpense) / lastExpense) * 100
            : 0,
          net:
            lastIncome - lastExpense
              ? ((thisIncome - thisExpense - (lastIncome - lastExpense)) /
                  (lastIncome - lastExpense)) *
                100
              : 0,
        },
      };
    },

    // Legacy chart data getters (kept for backward compatibility)
    incomeExpenseChartData: (state) => {
      const daily = {};
      state.allTransactions.forEach((t) => {
        const day = toLocalDateString(new Date(t.date));
        if (!daily[day]) daily[day] = { date: day, income: 0, expense: 0 };
        if (t.type === "income") daily[day].income += Number(t.amount);
        else if (t.type === "expense") daily[day].expense += Number(t.amount);
      });

      return Object.values(daily)
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 71)
        .reverse();
    },

    categoryChartData: (state) => {
      const totals = state.allTransactions.reduce((acc, t) => {
        const name = t.transaction_purposes?.name || "Other";
        if (t.type === "expense")
          acc[name] = (acc[name] || 0) + Number(t.amount);
        return acc;
      }, {});
      return Object.entries(totals).map(([name, value]) => ({ name, value }));
    },

    groupedByMonthYear: (state) =>
      state.allTransactions.reduce((res, t) => {
        const dateKey = t.date.split("T")[0];
        if (!dateKey) return res;
        const d = new Date(dateKey);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
          2,
          "0"
        )}`;
        (res[key] = res[key] || []).push(t);
        return res;
      }, {}),

    weeklyIncomeExpenseChartData: (state) => {
      const weekly = {};
      state.allTransactions.forEach((t) => {
        const d = new Date(t.date);
        const start = new Date(d);
        start.setDate(d.getDate() - d.getDay());
        const key = toLocalDateString(start);
        if (!weekly[key]) weekly[key] = { week: key, income: 0, expense: 0 };
        if (t.type === "income") weekly[key].income += Number(t.amount);
        else weekly[key].expense += Number(t.amount);
      });

      return Object.values(weekly)
        .sort((a, b) => new Date(b.week) - new Date(a.week))
        .reverse();
    },

    monthlyIncomeExpenseChartData: (state) => {
      const monthly = {};
      state.allTransactions.forEach((t) => {
        const d = new Date(t.date);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
          2,
          "0"
        )}`;
        if (!monthly[key]) monthly[key] = { date: key, income: 0, expense: 0 };
        if (t.type === "income") monthly[key].income += Number(t.amount);
        else monthly[key].expense += Number(t.amount);
      });

      return Object.values(monthly)
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .reverse();
    },

    yearlyIncomeExpenseChartData: (state) => {
      const yearly = {};
      state.allTransactions.forEach((t) => {
        const year = new Date(t.date).getFullYear();
        if (!yearly[year]) yearly[year] = { year, income: 0, expense: 0 };
        if (t.type === "income") yearly[year].income += Number(t.amount);
        else yearly[year].expense += Number(t.amount);
      });

      return Object.values(yearly)
        .sort((a, b) => b.year - a.year)
        .reverse();
    },

    monthlyBalances: (state) => {
      // Get all transactions sorted by date
      const sortedTransactions = [...state.allTransactions].sort(
        (a, b) => new Date(a.date) - new Date(b.date)
      );

      // Group transactions by month
      const monthlyGroups = sortedTransactions.reduce((acc, t) => {
        const d = new Date(t.date);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
          2,
          "0"
        )}`;
        if (!acc[key]) {
          acc[key] = {
            month: key,
            income: 0,
            expenses: 0,
            net: 0,
            transactions: [],
          };
        }

        const amount = Number(t.amount);
        if (t.type === "income") {
          acc[key].income += amount;
          acc[key].net += amount;
        } else {
          acc[key].expenses += amount;
          acc[key].net -= amount;
        }

        acc[key].transactions.push(t);
        return acc;
      }, {});

      // Calculate running balances
      const months = Object.keys(monthlyGroups).sort();
      let runningBalance = 0;

      return months.map((month) => {
        const monthData = monthlyGroups[month];
        const openingBalance = runningBalance;
        const closingBalance = runningBalance + monthData.net;
        runningBalance = closingBalance;

        return {
          month,
          monthName: DateTime.fromISO(`${month}-01`).toFormat("MMM yyyy"),
          openingBalance,
          closingBalance,
          income: monthData.income,
          expenses: monthData.expenses,
          net: monthData.net,
          transactionCount: monthData.transactions.length,
        };
      });
    },

    // Enhanced yearly balances with opening and closing
    yearlyBalances: (state) => {
      // Get all transactions sorted by date
      const sortedTransactions = [...state.allTransactions].sort(
        (a, b) => new Date(a.date) - new Date(b.date)
      );

      // Group transactions by year
      const yearlyGroups = sortedTransactions.reduce((acc, t) => {
        const year = new Date(t.date).getFullYear();
        if (!acc[year]) {
          acc[year] = {
            year,
            income: 0,
            expenses: 0,
            net: 0,
            transactions: [],
          };
        }

        const amount = Number(t.amount);
        if (t.type === "income") {
          acc[year].income += amount;
          acc[year].net += amount;
        } else {
          acc[year].expenses += amount;
          acc[year].net -= amount;
        }

        acc[year].transactions.push(t);
        return acc;
      }, {});

      // Calculate running balances
      const years = Object.keys(yearlyGroups).sort(
        (a, b) => parseInt(a) - parseInt(b)
      );
      let runningBalance = 0;

      return years.map((year) => {
        const yearData = yearlyGroups[year];
        const openingBalance = runningBalance;
        const closingBalance = runningBalance + yearData.net;
        runningBalance = closingBalance;

        return {
          year: parseInt(year),
          openingBalance,
          closingBalance,
          income: yearData.income,
          expenses: yearData.expenses,
          net: yearData.net,
          transactionCount: yearData.transactions.length,
        };
      });
    },

    // Current month and year balances for quick access
    currentPeriodBalances: (state) => {
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(
        now.getMonth() + 1
      ).padStart(2, "0")}`;
      const currentYear = now.getFullYear();

      const monthlyBalances = state.monthlyBalances;
      const yearlyBalances = state.yearlyBalances;

      const currentMonthData = monthlyBalances.find(
        (m) => m.month === currentMonth
      );
      const currentYearData = yearlyBalances.find(
        (y) => y.year === currentYear
      );

      return {
        currentMonth: currentMonthData || {
          month: currentMonth,
          monthName: DateTime.fromISO(`${currentMonth}-01`).toFormat(
            "MMM yyyy"
          ),
          openingBalance: 0,
          closingBalance: 0,
          income: 0,
          expenses: 0,
          net: 0,
          transactionCount: 0,
        },
        currentYear: currentYearData || {
          year: currentYear,
          openingBalance: 0,
          closingBalance: 0,
          income: 0,
          expenses: 0,
          net: 0,
          transactionCount: 0,
        },
      };
    },
  },

  actions: {
    // Helper method to filter transactions by date range
    getTransactionsInRange(startDate, endDate) {
      return this.allTransactions.filter((t) => {
        const transactionDate = DateTime.fromISO(t.date);
        return transactionDate >= startDate && transactionDate <= endDate;
      });
    },

    // Daily chart data for a specific day
    getDailyChartData(startDate, endDate) {
      const transactions = this.getTransactionsInRange(startDate, endDate);
      const hourly = {};

      // Initialize all hours of the day
      for (let hour = 0; hour < 24; hour++) {
        const hourKey =
          startDate.set({ hour }).toISODate() +
          `T${hour.toString().padStart(2, "0")}:00:00`;
        hourly[hourKey] = { date: hourKey, income: 0, expense: 0 };
      }

      // Aggregate transactions by hour
      transactions.forEach((t) => {
        const transactionDate = DateTime.fromISO(t.date);
        const hourKey = transactionDate.startOf("hour").toISO();

        if (!hourly[hourKey]) {
          hourly[hourKey] = { date: hourKey, income: 0, expense: 0 };
        }

        if (t.type === "income") {
          hourly[hourKey].income += Number(t.amount);
        } else if (t.type === "expense") {
          hourly[hourKey].expense += Number(t.amount);
        }
      });

      return Object.values(hourly).sort(
        (a, b) => new Date(a.date) - new Date(b.date)
      );
    },

    // Weekly chart data for a specific week
    getWeeklyChartData(startDate, endDate) {
      const transactions = this.getTransactionsInRange(startDate, endDate);
      const daily = {};

      // Initialize all days of the week
      let current = startDate.startOf("day");
      while (current <= endDate) {
        const dayKey = current.toISODate();
        daily[dayKey] = { date: dayKey, income: 0, expense: 0 };
        current = current.plus({ days: 1 });
      }

      // Aggregate transactions by day
      transactions.forEach((t) => {
        const transactionDate = DateTime.fromISO(t.date);
        const dayKey = transactionDate.toISODate();

        if (daily[dayKey]) {
          if (t.type === "income") {
            daily[dayKey].income += Number(t.amount);
          } else if (t.type === "expense") {
            daily[dayKey].expense += Number(t.amount);
          }
        }
      });

      return Object.values(daily).sort(
        (a, b) => new Date(a.date) - new Date(b.date)
      );
    },

    // Monthly chart data for a specific month
    getMonthlyChartData(startDate, endDate) {
      const transactions = this.getTransactionsInRange(startDate, endDate);
      const daily = {};

      // Initialize all days of the month
      let current = startDate.startOf("day");
      while (current <= endDate) {
        const dayKey = current.toISODate();
        daily[dayKey] = { date: dayKey, income: 0, expense: 0 };
        current = current.plus({ days: 1 });
      }

      // Aggregate transactions by day
      transactions.forEach((t) => {
        const transactionDate = DateTime.fromISO(t.date);
        const dayKey = transactionDate.toISODate();

        if (daily[dayKey]) {
          if (t.type === "income") {
            daily[dayKey].income += Number(t.amount);
          } else if (t.type === "expense") {
            daily[dayKey].expense += Number(t.amount);
          }
        }
      });

      return Object.values(daily).sort(
        (a, b) => new Date(a.date) - new Date(b.date)
      );
    },

    // Yearly chart data for a specific year
    getYearlyChartData(startDate, endDate) {
      const transactions = this.getTransactionsInRange(startDate, endDate);
      const monthly = {};

      // Initialize all months of the year
      let current = startDate.startOf("month");
      while (current <= endDate) {
        const monthKey = current.toISODate();
        monthly[monthKey] = { date: monthKey, income: 0, expense: 0 };
        current = current.plus({ months: 1 });
      }

      // Aggregate transactions by month
      transactions.forEach((t) => {
        const transactionDate = DateTime.fromISO(t.date);
        const monthKey = transactionDate.startOf("month").toISODate();

        if (monthly[monthKey]) {
          if (t.type === "income") {
            monthly[monthKey].income += Number(t.amount);
          } else if (t.type === "expense") {
            monthly[monthKey].expense += Number(t.amount);
          }
        }
      });

      return Object.values(monthly).sort(
        (a, b) => new Date(a.date) - new Date(b.date)
      );
    },

    async fetchTransactions(reset = false) {
      this.loading = true;
      this.error = null;
      try {
        const { data, error } = await supabase
          .from("transactions")
          .select(
            `
            id, date, amount, description, type, purpose_id, created_at, updated_at,
            transaction_purposes(id,name)
          `
          )
          .order("date", { ascending: false });
        if (error) throw error;
        this.allTransactions = data;

        let filtered = [...data];
        if (this.filters.purpose)
          filtered = filtered.filter(
            (t) => t.transaction_purposes?.name === this.filters.purpose
          );
        if (this.filters.type)
          filtered = filtered.filter((t) => t.type === this.filters.type);
        if (this.filters.searchQuery) {
          const q = this.filters.searchQuery.toLowerCase();
          filtered = filtered.filter((t) =>
            t.description.toLowerCase().includes(q)
          );
        }

        this.pagination.total = filtered.length;
        if (reset) this.pagination.page = 1;
        const start = (this.pagination.page - 1) * this.pagination.perPage;
        this.transactions = filtered.slice(
          start,
          start + this.pagination.perPage
        );
      } catch (err) {
        this.error = err.message;
      } finally {
        this.loading = false;
      }
    },

    async fetchPurposes() {
      this.loading = true;
      this.error = null;
      try {
        const { data, error } = await supabase
          .from("transaction_purposes")
          .select("id,name");
        if (error) throw error;
        this.purposes = data;
      } catch (err) {
        this.error = err.message;
      } finally {
        this.loading = false;
      }
    },

    async createTransaction(tx) {
      this.loading = true;
      this.error = null;
      try {
        const { error } = await supabase.from("transactions").insert([tx]);
        if (error) throw error;
        await this.fetchTransactions();
      } catch (err) {
        this.error = err.message;
      } finally {
        this.loading = false;
      }
    },

    async updateTransaction(id, updates) {
      this.loading = true;
      this.error = null;
      try {
        const { error } = await supabase
          .from("transactions")
          .update(updates)
          .eq("id", id);
        if (error) throw error;
        await this.fetchTransactions();
      } catch (err) {
        this.error = err.message;
      } finally {
        this.loading = false;
      }
    },

    async deleteTransaction(id) {
      this.loading = true;
      this.error = null;
      try {
        const { error } = await supabase
          .from("transactions")
          .delete()
          .eq("id", id);
        if (error) throw error;
        await this.fetchTransactions();
      } catch (err) {
        this.error = err.message;
      } finally {
        this.loading = false;
      }
    },

    async deleteMultipleTransactions(ids) {
      this.loading = true;
      this.error = null;
      try {
        const { error } = await supabase
          .from("transactions")
          .delete()
          .in("id", ids);
        if (error) throw error;
        await this.fetchTransactions();
      } catch (err) {
        this.error = err.message;
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async exportTransactions() {
      return this.transactions.map((t) => ({
        date: t.date,
        description: t.description,
        purpose: t.transaction_purposes?.name || "Other",
        amount: Number(t.amount),
        type: t.type,
      }));
    },

    async exportTransactionsGrouped() {
      const grouped = this.groupedByMonthYear;
      const out = [];
      Object.keys(grouped)
        .sort()
        .forEach((m) => {
          out.push({ month: m });
          grouped[m].forEach((t) =>
            out.push({
              date: t.date,
              description: t.description,
              purpose: t.transaction_purposes?.name || "Other",
              amount: Number(t.amount),
              type: t.type,
            })
          );
        });
      return out;
    },

    setFilter(key, value) {
      this.filters[key] = value;
      this.fetchTransactions(true);
    },
    setPage(page) {
      this.pagination.page = page;
      this.fetchTransactions();
    },
  },
});

export function useTransactions() {
  const store = useTransactionStore();
  const {
    transactions,
    allTransactions,
    purposes,
    loading,
    error,
    filters,
    pagination,
  } = storeToRefs(store);
  return {
    allTransactions,
    transactions,
    purposes,
    loading,
    error,
    filters,
    pagination,
    //
    totalIncome: computed(() => store.totalIncome),
    totalExpenses: computed(() => store.totalExpenses),
    netBalance: computed(() => store.netBalance),
    recentActivity: computed(() => store.recentActivity),
    incomeExpenseChartData: computed(() => store.incomeExpenseChartData),
    categoryChartData: computed(() => store.categoryChartData),
    getStatistics: computed(() => store.getStatistics),
    totalTransactions: computed(() => store.totalTransactions),
    groupedByMonthYear: computed(() => store.groupedByMonthYear),
    weeklyIncomeExpenseChartData: computed(
      () => store.weeklyIncomeExpenseChartData
    ),
    monthlyIncomeExpenseChartData: computed(
      () => store.monthlyIncomeExpenseChartData
    ),
    yearlyIncomeExpenseChartData: computed(
      () => store.yearlyIncomeExpenseChartData
    ),
    monthlyBalances: computed(() => store.monthlyBalances),
    yearlyBalances: computed(() => store.yearlyBalances),
    currentPeriodBalances: computed(() => store.currentPeriodBalances),
    //
    fetchTransactions: store.fetchTransactions,
    fetchPurposes: store.fetchPurposes,
    createTransaction: store.createTransaction,
    updateTransaction: store.updateTransaction,
    deleteTransaction: store.deleteTransaction,
    deleteMultipleTransactions: store.deleteMultipleTransactions,
    exportTransactions: store.exportTransactions,
    exportTransactionsGrouped: store.exportTransactionsGrouped,
    setFilter: store.setFilter,
    setPage: store.setPage,
    // New period-based chart data methods
    getDailyChartData: store.getDailyChartData,
    getWeeklyChartData: store.getWeeklyChartData,
    getMonthlyChartData: store.getMonthlyChartData,
    getYearlyChartData: store.getYearlyChartData,
  };
}
