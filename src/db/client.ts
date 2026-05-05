import { createClient } from '@supabase/supabase-js';
import { config } from '../config.js';

if (!config.supabase.url || !config.supabase.serviceRoleKey) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
}

export const supabase = createClient(config.supabase.url, config.supabase.serviceRoleKey, {
  auth: { persistSession: false },
});
