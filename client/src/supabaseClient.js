// client/src/supabaseClient.js
import { createClient } from '@supabase/supabase-js'

// Twój adres URL i Klucz API
const supabaseUrl = 'https://ojlctytzmuadnvvzbgaq.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qbGN0eXR6bXVhZG52dnpiZ2FxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxNzE5ODcsImV4cCI6MjA3OTc0Nzk4N30.WGKHmRKVFUvkygOgfu13juDgVrdKNagrxUM9J8q3DhY'

export const supabase = createClient(supabaseUrl, supabaseKey)