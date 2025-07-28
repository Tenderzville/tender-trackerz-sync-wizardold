import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mwggjriyxxknotymfsvp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13Z2dqcml5eHhrbm90eW1mc3ZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg0OTc4MjIsImV4cCI6MjA2NDA3MzgyMn0.ksDROGnFHmiIW9ij1HuisTFRBm91F35MEfpIGwThT7Y';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
});