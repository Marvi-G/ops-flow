import { ref, computed } from 'vue'
import type { Incident, IncidentFilters, PaginationState } from '~/types'
import { incidentRepository } from '~/services/repository'

export function useIncidents() {
  const incidents = ref<Incident[]>([])
  const loading = ref(false)
  const total = ref(0)
  const filters = ref<Partial<IncidentFilters>>({
    search: '',
    severity: [],
    status: [],
    serviceId: [],
    teamId: [],
    dateFrom: '',
    dateTo: ''
  })
  const pagination = ref<PaginationState>({
    page: 1,
    pageSize: 20,
    total: 0
  })

  async function fetch() {
    loading.value = true
    try {
      const result = await incidentRepository.list(filters.value, pagination.value)
      incidents.value = result.data
      total.value = result.total
      pagination.value.total = result.total
    } finally {
      loading.value = false
    }
  }

  const hasActiveFilters = computed(() => {
    const f = filters.value
    return !!(
      f.search ||
      f.severity?.length ||
      f.status?.length ||
      f.serviceId?.length ||
      f.teamId?.length ||
      f.dateFrom ||
      f.dateTo
    )
  })

  function resetFilters() {
    filters.value = {
      search: '',
      severity: [],
      status: [],
      serviceId: [],
      teamId: [],
      dateFrom: '',
      dateTo: ''
    }
    pagination.value.page = 1
  }

  return {
    incidents,
    loading,
    total,
    filters,
    pagination,
    hasActiveFilters,
    fetch,
    resetFilters
  }
}
