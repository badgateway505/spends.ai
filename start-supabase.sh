#!/bin/bash

# Start Supabase and repair database script
# This script will start Supabase and fix the database schema issues

echo "🚀 Starting Supabase local development environment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop and try again."
    exit 1
fi

# Start Supabase
echo "📦 Starting Supabase services..."
npx supabase start

if [ $? -ne 0 ]; then
    echo "❌ Failed to start Supabase. Trying to reset..."
    npx supabase db reset
fi

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 5

# Apply database repair
echo "🔧 Applying database repair..."
npx supabase db reset

# Run the repair script if reset doesn't work
echo "🩹 Running additional repairs..."
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -f repair-database.sql

echo "✅ Supabase is ready!"
echo "🌐 Studio: http://localhost:54323"
echo "🔗 API URL: http://localhost:54321"
echo "🔑 Anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"
echo ""
echo "💡 If you still see errors, try running: npx supabase db reset"
