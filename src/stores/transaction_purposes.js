import { ref, computed } from "vue";
import { defineStore, storeToRefs } from "pinia";
import { supabase } from "../supabase";

// Store definition
export const useTransactionPurposesStore = defineStore(
  "transactionPurposes",
  () => {
    // State
    const purposes = ref([]);
    const loading = ref(false);
    const error = ref(null);
    const pagination = ref({
      current_page: 1,
      per_page: 20,
      total: 0,
      last_page: 1,
    });

    // Getters
    const allPurposes = computed(() => purposes.value);
    const totalPages = computed(() => pagination.value.last_page);
    const currentPage = computed(() => pagination.value.current_page);

    // Actions
    const fetchPurposes = async (page = 1, perPage = 20, filters = {}) => {
      loading.value = true;
      error.value = null;
      try {
        let query = supabase
          .from("transaction_purposes")
          .select("*", { count: "exact" })
          .order("created_at", { ascending: false });

        if (filters.dateRange?.start)
          query = query.gte("created_at", filters.dateRange.start);
        if (filters.dateRange?.end)
          query = query.lte("created_at", filters.dateRange.end);
        if (filters.search) query = query.ilike("name", `%${filters.search}%`);

        const from = (page - 1) * perPage;
        const to = from + perPage - 1;
        query = query.range(from, to);

        const { data, error: fetchError, count } = await query;
        if (fetchError) throw fetchError;

        purposes.value = data || [];
        pagination.value = {
          current_page: page,
          per_page: perPage,
          total: count || 0,
          last_page: Math.ceil((count || 0) / perPage),
        };
      } catch (err) {
        error.value = err.message || "Failed to fetch purposes";
        console.error("Error fetching purposes:", err);
        throw err;
      } finally {
        loading.value = false;
      }
    };

    const createPurpose = async (purposeData) => {
      loading.value = true;
      error.value = null;
      try {
        const { data, error: createError } = await supabase
          .from("transaction_purposes")
          .insert([purposeData])
          .select()
          .single();

        if (createError) throw createError;
        purposes.value.unshift(data);
        return data;
      } catch (err) {
        error.value = err.message || "Failed to create purpose";
        console.error("Error creating purpose:", err);
        throw err;
      } finally {
        loading.value = false;
      }
    };

    const updatePurpose = async (id, purposeData) => {
      loading.value = true;
      error.value = null;
      try {
        const { data, error: updateError } = await supabase
          .from("transaction_purposes")
          .update(purposeData)
          .eq("id", id)
          .select()
          .single();

        if (updateError) throw updateError;
        const index = purposes.value.findIndex((p) => p.id === id);
        if (index !== -1) purposes.value[index] = data;
        return data;
      } catch (err) {
        error.value = err.message || "Failed to update purpose";
        console.error("Error updating purpose:", err);
        throw err;
      } finally {
        loading.value = false;
      }
    };

    const deletePurpose = async (id) => {
      loading.value = true;
      error.value = null;
      try {
        const { error: deleteError } = await supabase
          .from("transaction_purposes")
          .delete()
          .eq("id", id);

        if (deleteError) throw deleteError;
        purposes.value = purposes.value.filter((p) => p.id !== id);
        return true;
      } catch (err) {
        error.value = err.message || "Failed to delete purpose";
        console.error("Error deleting purpose:", err);
        throw err;
      } finally {
        loading.value = false;
      }
    };

    const getPurposeById = (id) => purposes.value.find((p) => p.id === id);
    const setPage = (page) => (pagination.value.current_page = page);
    const clearError = () => (error.value = null);
    const resetState = () => {
      purposes.value = [];
      loading.value = false;
      error.value = null;
      pagination.value = {
        current_page: 1,
        per_page: 20,
        total: 0,
        last_page: 1,
      };
    };

    return {
      purposes,
      loading,
      error,
      pagination,
      allPurposes,
      totalPages,
      currentPage,
      fetchPurposes,
      createPurpose,
      updatePurpose,
      deletePurpose,
      getPurposeById,
      setPage,
      clearError,
      resetState,
    };
  }
);

// Composable to use the store with refs and actions
export function useTransactionPurposes() {
  const store = useTransactionPurposesStore();
  const { purposes, loading, error, pagination } = storeToRefs(store);

  return {
    purposes,
    loading,
    error,
    pagination,
    allPurposes: store.allPurposes,
    totalPages: store.totalPages,
    currentPage: store.currentPage,

    // Actions
    fetchPurposes: store.fetchPurposes,
    createPurpose: store.createPurpose,
    updatePurpose: store.updatePurpose,
    deletePurpose: store.deletePurpose,
    getPurposeById: store.getPurposeById,
    setPage: store.setPage,
    clearError: store.clearError,
    resetState: store.resetState,
  };
}
