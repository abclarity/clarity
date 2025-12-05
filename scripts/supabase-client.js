const SUPABASE_URL = 'https://kplfdvobyeopkgqulrcf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwbGZkdm9ieWVvcGtncXVscmNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5NTA3ODcsImV4cCI6MjA4MDUyNjc4N30.e7Lp4glj9jbtPDvW34kpiRtv3RPmv69_ny7aq6LA-y0';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

window.SupabaseClient = supabase;
