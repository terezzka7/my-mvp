// Mirrors supabase/schema.sql, generated from product_book.md §10.
// Same shape as src/lib/database.types.ts in the web app (root) — one
// Supabase project/schema, duplicated here since web and mobile are
// separate npm packages with no shared workspace set up.

export type OauthProvider = 'email' | 'apple' | 'google'
export type PlatformOriginUser = 'ios' | 'web' | 'android' | 'tg-bot'
export type PlatformOriginWorkout = 'ios' | 'web' | 'tg-bot'
export type SubscriptionStatus = 'free' | 'trial' | 'active' | 'expired'
export type WorkoutType = 'strength' | 'cardio' | 'flexibility' | 'sports' | 'other'
export type ChallengeType = 'workout_count' | 'duration_total' | 'streak' | 'type_specific'
export type UserChallengeStatus = 'active' | 'completed' | 'failed'
export type ItemType = 'skin' | 'equipment' | 'frame' | 'animation'
export type ItemSlot = 'head' | 'body' | 'weapon' | 'cloak' | 'background' | 'card_frame'
export type ItemRarity = 'common' | 'rare' | 'epic' | 'legendary'
export type PurchasedWith = 'earned_currency' | 'premium_currency' | 'reward'
export type TemplateCategory = 'body' | 'style'

export type UsersRow = {
  id: string
  created_at: string
  updated_at: string
  email: string | null
  username: string
  display_name: string | null
  oauth_provider: OauthProvider | null
  telegram_id: number | null
  platform_origin: PlatformOriginUser
  referral_source: string | null
  referred_by: string | null
  subscription_status: SubscriptionStatus
  subscription_expires_at: string | null
  currency_earned: number
  currency_premium: number
  push_enabled: boolean
  reminder_enabled: boolean
  is_private: boolean
}

export type CharactersRow = {
  id: string
  user_id: string
  name: string
  level: number
  xp_current: number
  xp_to_next: number
  body_template_id: string
  style_template_id: string
  image_url: string
  equipped_items: string[] | null
  created_at: string
  updated_at: string
}

export type WorkoutLogsRow = {
  id: string
  user_id: string
  type: WorkoutType
  duration_minutes: number | null
  weight_kg: number | null
  reps: number | null
  note: string | null
  xp_earned: number
  currency_earned: number
  logged_at: string
  platform_origin: PlatformOriginWorkout
  created_at: string
  updated_at: string
}

export type ChallengesRow = {
  id: string
  title: string
  description: string
  type: ChallengeType
  target_value: number
  duration_days: number
  xp_reward: number
  currency_reward: number
  is_seasonal: boolean
  starts_at: string
  ends_at: string
  created_at: string
  updated_at: string
}

export type UserChallengesRow = {
  id: string
  user_id: string
  challenge_id: string
  progress: number
  status: UserChallengeStatus
  completed_at: string | null
  created_at: string
  updated_at: string
}

export type ItemsRow = {
  id: string
  name: string
  description: string | null
  type: ItemType
  slot: ItemSlot | null
  image_url: string
  price_earned: number | null
  price_premium: number | null
  is_seasonal: boolean
  available_from: string | null
  available_until: string | null
  rarity: ItemRarity
  created_at: string
  updated_at: string
}

export type UserItemsRow = {
  id: string
  user_id: string
  item_id: string
  purchased_with: PurchasedWith
  created_at: string
}

export type ShareCardsRow = {
  id: string
  user_id: string
  character_snapshot: Record<string, unknown>
  stats_snapshot: Record<string, unknown>
  frame_item_id: string | null
  og_image_url: string | null
  platform_shared_to: string | null
  created_at: string
}

export type StreaksRow = {
  id: string
  user_id: string
  current_streak: number
  longest_streak: number
  last_workout_date: string
  created_at: string
  updated_at: string
}

export type TemplateAssetsRow = {
  id: string
  category: TemplateCategory
  name: string
  criteria_tags: string[]
  image_url: string
  created_by: string | null
  created_at: string
  updated_at: string
}

export type PublicProfileView = {
  user_id: string
  username: string
  display_name: string | null
  level: number
  xp_current: number
  image_url: string
}

type Relationship = {
  foreignKeyName: string
  columns: string[]
  isOneToOne?: boolean
  referencedRelation: string
  referencedColumns: string[]
}

type TableDef<Row extends { id: string }, Relationships extends Relationship[] = []> = {
  Row: Row
  Insert: Omit<Row, 'id' | 'created_at' | 'updated_at'> &
    Partial<Pick<Row, 'id'>> & { created_at?: string; updated_at?: string }
  Update: Partial<Row>
  Relationships: Relationships
}

export type Database = {
  public: {
    Tables: {
      users: TableDef<
        UsersRow,
        [
          {
            foreignKeyName: 'users_referred_by_fkey'
            columns: ['referred_by']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      >
      characters: TableDef<
        CharactersRow,
        [
          {
            foreignKeyName: 'characters_user_id_fkey'
            columns: ['user_id']
            isOneToOne: true
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'characters_body_template_id_fkey'
            columns: ['body_template_id']
            isOneToOne: false
            referencedRelation: 'template_assets'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'characters_style_template_id_fkey'
            columns: ['style_template_id']
            isOneToOne: false
            referencedRelation: 'template_assets'
            referencedColumns: ['id']
          },
        ]
      >
      workout_logs: TableDef<
        WorkoutLogsRow,
        [
          {
            foreignKeyName: 'workout_logs_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      >
      challenges: TableDef<ChallengesRow>
      user_challenges: TableDef<
        UserChallengesRow,
        [
          {
            foreignKeyName: 'user_challenges_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'user_challenges_challenge_id_fkey'
            columns: ['challenge_id']
            isOneToOne: false
            referencedRelation: 'challenges'
            referencedColumns: ['id']
          },
        ]
      >
      items: TableDef<ItemsRow>
      user_items: TableDef<
        UserItemsRow,
        [
          {
            foreignKeyName: 'user_items_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'user_items_item_id_fkey'
            columns: ['item_id']
            isOneToOne: false
            referencedRelation: 'items'
            referencedColumns: ['id']
          },
        ]
      >
      share_cards: TableDef<
        ShareCardsRow,
        [
          {
            foreignKeyName: 'share_cards_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'share_cards_frame_item_id_fkey'
            columns: ['frame_item_id']
            isOneToOne: false
            referencedRelation: 'items'
            referencedColumns: ['id']
          },
        ]
      >
      streaks: TableDef<
        StreaksRow,
        [
          {
            foreignKeyName: 'streaks_user_id_fkey'
            columns: ['user_id']
            isOneToOne: true
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      >
      template_assets: TableDef<TemplateAssetsRow>
    }
    Views: {
      public_profiles: {
        Row: PublicProfileView
        Relationships: []
      }
    }
    Functions: Record<string, never>
    Enums: {
      oauth_provider: OauthProvider
      platform_origin_user: PlatformOriginUser
      platform_origin_workout: PlatformOriginWorkout
      subscription_status: SubscriptionStatus
      workout_type: WorkoutType
      challenge_type: ChallengeType
      user_challenge_status: UserChallengeStatus
      item_type: ItemType
      item_slot: ItemSlot
      item_rarity: ItemRarity
      purchased_with: PurchasedWith
      template_category: TemplateCategory
    }
  }
}
