import AsyncStorage from '@react-native-async-storage/async-storage'

import { supabase } from './supabase'
import type { WorkoutType } from './database.types'

const QUEUE_KEY = 'pending_workout_logs'

export type Intensity = 'easy' | 'medium' | 'hard' | 'max'

export interface PendingWorkoutLog {
  localId: string
  user_id: string
  type: WorkoutType
  weight_kg: number | null
  reps: number | null
  duration_minutes: number | null
  // Optional: entries queued by older app versions don't have it.
  intensity?: Intensity | null
  note: null
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
//
// xp_earned/currency_earned больше не считает клиент — каждая запись
// уходит через Edge Function on-workout-logged (§10/§13.2), которая
// сама вычисляет XP по приросту к предыдущему логу и обновляет
// streaks/characters.
export interface FlushResult {
  synced: number
  remaining: number
  // Sum of XP the server awarded for the entries sent in this call, and the
  // character as it stands after the last one (null if nothing was sent).
  xpEarned: number
  character: { level: number; xp_current: number; xp_to_next: number } | null
}

export async function flushWorkoutLogQueue(userId: string): Promise<FlushResult> {
  const queue = await readQueue()
  const mine = queue.filter((entry) => entry.user_id === userId)
  const others = queue.filter((entry) => entry.user_id !== userId)

  let synced = 0
  let xpEarned = 0
  let character: FlushResult['character'] = null
  const stillPending: PendingWorkoutLog[] = []

  for (let i = 0; i < mine.length; i += 1) {
    const { localId, user_id, ...payload } = mine[i]
    const { data, error } = await supabase.functions.invoke('on-workout-logged', { body: payload })

    if (error) {
      console.error('flushWorkoutLogQueue invoke failed:', error.message)
      stillPending.push(...mine.slice(i))
      break
    }
    synced += 1
    xpEarned += data?.workoutLog?.xp_earned ?? 0
    character = data?.character ?? character
  }

  await writeQueue([...others, ...stillPending])
  return { synced, remaining: stillPending.length, xpEarned, character }
}
