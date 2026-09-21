import { computed } from 'vue'
import type { IncidentFilters, IncidentSeverity, IncidentStatus } from '~/types'

export function useIncidentFilters() {
  const route = useRoute()
  const router = useRouter()

  const filters = computed<IncidentFilters>({
    get() {
      const q = route.query
      return {
        search: (q.search as string) || '',
        severity: parseArrayParam(q.severity),
        status: parseArrayParam(q.status),
        serviceId: parseArrayParam(q.service),
        teamId: parseArrayParam(q.team),
        dateFrom: (q.dateFrom as string) || '',
        dateTo: (q.dateTo as string) || ''
      }
    },
    set(value: IncidentFilters) {
      const query: Record<string, string> = {}
      if (value.search) query.search = value.search
      if (value.severity.length) query.severity = value.severity.join(',')
      if (value.status.length) query.status = value.status.join(',')
      if (value.serviceId.length) query.service = value.serviceId.join(',')
      if (value.teamId.length) query.team = value.teamId.join(',')
      if (value.dateFrom) query.dateFrom = value.dateFrom
      if (value.dateTo) query.dateTo = value.dateTo
      router.replace({ query })
    }
  })

  function parseArrayParam(param: string | string[] | undefined | null): string[] {
    if (!param) return []
    if (Array.isArray(param)) return param
    return param.split(',').filter(Boolean)
  }

  function updateFilter<K extends keyof IncidentFilters>(key: K, value: IncidentFilters[K]) {
    const current = { ...filters.value }
    current[key] = value
    filters.value = current
  }

  function toggleArrayFilter(key: 'severity' | 'status' | 'serviceId' | 'teamId', value: string) {
    const current = { ...filters.value }
    const arr = current[key]
    if (arr.includes(value)) {
      current[key] = arr.filter(v => v !== value) as any
    } else {
      current[key] = [...arr, value] as any
    }
    filters.value = current
  }

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
  }

  const hasActiveFilters = computed(() => {
    const f = filters.value
    return !!(
      f.search ||
      f.severity.length ||
      f.status.length ||
      f.serviceId.length ||
      f.teamId.length ||
      f.dateFrom ||
      f.dateTo
    )
  })

  return {
    filters,
    updateFilter,
    toggleArrayFilter,
    resetFilters,
    hasActiveFilters
  }
}
