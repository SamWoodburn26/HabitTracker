import type { AppData } from '../types'
import { apiFetchAppData, apiSaveAppData } from '../lib/api'
import { migrateAppData, type LegacyAppData } from './storage'

export async function fetchCloudAppData(_userId: string): Promise<AppData | null> {
  const data = await apiFetchAppData()
  if (!data) return null
  return migrateAppData(data as LegacyAppData)
}

export async function saveCloudAppData(
  _userId: string,
  appData: AppData,
): Promise<void> {
  await apiSaveAppData(appData)
}
