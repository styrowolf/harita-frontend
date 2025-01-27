import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://guhhzhglreuvznbkdylv.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd1aGh6aGdscmV1dnpuYmtkeWx2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc4NDcwMjEsImV4cCI6MjA1MzQyMzAyMX0.cJ6GoceHOak3HRVyficntAvBmbU5RcfdvcAAHoYuFMo";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default supabase;