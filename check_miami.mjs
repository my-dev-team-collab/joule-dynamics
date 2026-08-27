import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase
    .from('v_rate_volatility')
    .select('property_id, property_name, market, platform, latitude, longitude')
    .ilike('market', '%Miami%')
    .limit(5);
  
  if (error) console.error(error);
  else console.log(data);
}

check();
