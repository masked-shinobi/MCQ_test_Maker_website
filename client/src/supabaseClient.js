import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jfsolvejzswvggtsejol.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impmc29sdmVqenN3dmdndHNlam9sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1OTM5NzMsImV4cCI6MjA4ODE2OTk3M30.6gI43dHgdgvGGKm_JXHDe2oO85_Vpa0gT11j2S4_WhI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
