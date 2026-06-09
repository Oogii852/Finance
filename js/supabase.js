import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = "https://tfkiiziaaemayejtqohu.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRma2lpemlhYWVtYXllanRxb2h1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5NDU2NzYsImV4cCI6MjA5NjUyMTY3Nn0.KkLUwGa7M4nJ38cPob-Vy240v58jTslkKrBtXMvxhew";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log("Холбогдсон байна", supabase);