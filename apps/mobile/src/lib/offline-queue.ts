import AsyncStorage from '@react-native-async-storage/async-storage'

import { supabase } from './supabase'
import type { WorkoutType } from './database.types'

const QUEUE_KEY = 'pending_workout_logs'

export interface PendingWorkoutLog {
  localId: string
  user_id: string
  type: WorkoutType
  weight_kg: number
  reps: number
  duration_minutes: null
  note: null
  xp_earned: number
  currency_earned: number
  logged_at: string
  platform_origin: 'ios'
}

async function readQueue(): Promise<PendingWorkoutLog[]> {
  const raw = await AsyncStorage.getItem(QUEUE_KEY)
  return raw ? (JSON.parse(raw) as PendingWorkoutLog[]) : []
}

async function writeQueue(queue: PendingWorkoutLog[]): Promise<void> {
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
}

export async function enqueueWorkoutLog(
  entry: Omit<PendingWorkoutLog, 'localId'>,
): Promise<void> {
  const queue = await readQueue()
  queue.push({ ...entry, localId: `${Date.now()}-${Math.random().toString(36).slice(2)}` })
  await writeQueue(queue)
}

export async function getPendingCount(userId: string): Promise<number> {
  const queue = await readQueue()
  return queue.filter((entry) => entry.user_id === userId).length
}

// Пытается отправить в Supabase каждую отложенную запись по очереди.
// Останавливается на первой сетевой ошибке — остальное остаётся в очереди
// до следующей попытки (следующий лог или открытие Home).
export async function flushWorkoutLogQueue(userId: string): Promise<{ synced: number; remaining: number }> {
  const queue = await readQueue()
  const mine = queue.filter((entry) => entry.user_id === userId)
  const others = queue.filter((entry) => entry.user_id !== userId)

  let synced = 0
  const stillPending: PendingWorkoutLog[] = []

  for (let i = 0; i < mine.length; i += 1) {
    const { localId, ...payload } = mine[i]
    const { error } = await supabase.from('workout_logs').insert(payload)

    if (error) {
      console.error('flushWorkoutLogQueue insert failed:', error.message)
      stillPending.push(...mine.slice(i))
      break
    }
    synced += 1
  }

  await writeQueue([...others, ...stillPending])
  return { synced, remaining: stillPending.length }
}
