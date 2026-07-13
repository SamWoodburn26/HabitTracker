import type { AppData } from '../types'
import { getSupabase } from '../lib/supabase'
import { migrateAppData, type LegacyAppData } from './storage'

export async function fetchCloudAppData(userId: string): Promise<AppData | null> {
  const supabase = getSupabase()
  if (!supabase) return null

  const { data, error } = await supabase
    .from('user_app_data')
    .select('data')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    console.error('Failed to load cloud data', error)
    throw error
  }
  if (!data?.data) return null
  return migrateAppData(data.data as LegacyAppData)
}

export async function saveCloudAppData(
  userId: string,
  appData: AppData,
): Promise<void> {
  const supabase = getSupabase()
  if (!supabase) return

  const { error } = await supabase.from('user_app_data').upsert(
    {
      user_id: userId,
      data: appData,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  )

  if (error) {
    console.error('Failed to save cloud data', error)
    throw error
  }
}
