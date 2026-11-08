import { computed } from 'vue'
import type { IncidentFilters, IncidentSeverity, IncidentStatus } from '~/types'

const SEVERITIES: IncidentSeverity[] = ['critical', 'high', 'medium', 'low']
const STATUSES: IncidentStatus[] = ['investigating', 'identified', 'monitoring', 'resolved', 'postmortem']

type ArrayFilterKey = 'severity' | 'status' | 'serviceId' | 'teamId'

/** Reads a query value that may be a string, a comma-separated string or a repeated param. */
function parseArrayParam(param: unknown): string[] {
  if (!param) return []
  const parts = Array.isArray(param) ? param : String(param).split(',')
  return parts.filter((part): part is string => typeof part === 'string' && part !== '')
}

function queryString(param: unknown): string {
  return typeof param === 'string' ? param : ''
}

export function useIncidentFilters() {
  const route = useRoute()
  const router = useRouter()

  const filters = computed<IncidentFilters>({
    get() {
      const q = route.query
      return {
        search: queryString(q.search),
        // Unknown values in the URL are ignored instead of reaching the API
        severity: parseArrayParam(q.severity).filter((v): v is IncidentSeverity => SEVERITIES.includes(v as IncidentSeverity)),
        status: parseArrayParam(q.status).filter((v): v is IncidentStatus => STATUSES.includes(v as IncidentStatus)),
        serviceId: parseArrayParam(q.service),
        teamId: parseArrayParam(q.team),
        dateFrom: queryString(q.dateFrom),
        dateTo: queryString(q.dateTo)
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

  function updateFilter<K extends keyof IncidentFilters>(key: K, value: IncidentFilters[K]) {
    const current = { ...filters.value }
    current[key] = value
    filters.value = current
  }

  function toggleArrayFilter(key: ArrayFilterKey, value: string) {
    const current = filters.value
    const selected: string[] = current[key]
    const next = selected.includes(value)
      ? selected.filter(v => v !== value)
      : [...selected, value]
    filters.value = { ...current, [key]: next } as IncidentFilters
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
