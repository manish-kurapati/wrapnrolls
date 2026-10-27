import { createClient } from '@supabase/supabase-js';

const config = window.WRAP_CONFIG || {};
const configured = /^https:\/\/[^/]+\.supabase\.co\/?$/.test(config.supabaseUrl || '') && Boolean(config.supabaseAnonKey);
export const supabase = configured ? createClient(config.supabaseUrl, config.supabaseAnonKey, {
  auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: false }
}) : null;
export const imageUrl = path => path ? supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl : '';
export const money = value => '$' + Number(value).toFixed(2);
export const safeExternalUrl = value => {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url.href : '';
  } catch { return ''; }
};
