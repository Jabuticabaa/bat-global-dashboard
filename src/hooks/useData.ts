import { useState, useEffect } from 'react'
import type { HierarchyData, CountryData } from '../types'

export function useHierarchy() {
  const [data, setData] = useState<HierarchyData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('./data/hierarchy.json')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  return { data, loading }
}

export function useCountries() {
  const [data, setData] = useState<Record<string, CountryData> | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('./data/countries.json')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  return { data, loading }
}
