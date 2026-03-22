#!/bin/bash
set -e

echo "🚀 Setting up AI-Auto-SaaS..."

# Check required tools
command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required. Install from https://nodejs.org"; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "❌ npm is required."; exit 1; }

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Setup environment
if [ ! -f .env.local ]; then
  echo "📝 Creating .env.local from .env.example..."
  cp .env.example .env.local
  echo "⚠️  Please fill in your environment variables in .env.local"
else
  echo "✅ .env.local already exists"
fi

# Generate Prisma client
echo "🗄️  Generating Prisma client..."
npx prisma generate

# Run database migrations (if DATABASE_URL is set)
if grep -q 'DATABASE_URL="postgresql' .env.local 2>/dev/null; then
  echo "🗄️  Running database migrations..."
  npx prisma migrate dev --name init || echo "⚠️  Migration failed. Set your DATABASE_URL first."
else
  echo "⚠️  DATABASE_URL not set. Skipping migrations."
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Fill in .env.local with your credentials"
echo "  2. Run database migrations: npx prisma migrate dev"
echo "  3. Start the dev server: npm run dev"
echo "  4. In another terminal, run the generation worker: npm run worker"
echo "  5. Open http://localhost:3000"
echo ""
echo "📚 See README.md for detailed setup instructions."
