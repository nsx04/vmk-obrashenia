import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_ANON_KEY, TG_BOT_NAME } from './env.js'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
export const TG_BOT = TG_BOT_NAME
