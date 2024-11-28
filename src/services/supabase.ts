// src/services/supabase.ts
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@env'; // Asegúrate de que @env esté bien configurado y que .env esté en la raíz

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Las variables de entorno no están configuradas correctamente.');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export { supabase };
