<template>
  <div class="all-transactions-page">
    <TransactionsTable
      :editable="true"
      @update:loading="transactionStore.loading"
      :adminMode="true"
    />

    <TransactionChart
      :transactions="transactionStore.allTransactions"
      :loading="transactionStore.loading"
      :adminView="true"
    />
  </div>
</template>

<script setup>
import TransactionChart from "../components/TransactionChart.vue";
import TransactionsTable from "../components/TransactionsTable.vue";
import { useTransactionStore } from "../stores/transactions";
const transactionStore = useTransactionStore();
</script>

<style scoped>
.all-transactions-page {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;

  @media (max-width: 768px) {
    gap: 1rem;
  }
}
</style>
