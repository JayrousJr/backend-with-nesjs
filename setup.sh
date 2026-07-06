#!/usr/bin/env bash
set -e

BOLD='\033[1m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${BOLD}${CYAN}"
echo "  ┌─────────────────────────────────────┐"
echo "  │     NestJS GraphQL Template Setup    │"
echo "  └─────────────────────────────────────┘"
echo -e "${NC}"

# --- Project name ---
read -rp "Project name (kebab-case, e.g. my-saas-api): " PROJECT_NAME
if [[ -z "$PROJECT_NAME" ]]; then
  echo "Project name is required." && exit 1
fi

# --- Database name ---
DB_DEFAULT="${PROJECT_NAME//-/_}_db"
read -rp "Database name [${DB_DEFAULT}]: " DB_NAME
DB_NAME="${DB_NAME:-$DB_DEFAULT}"

# --- Description ---
read -rp "Project description (optional): " DESCRIPTION

echo ""
echo -e "${BOLD}Setting up ${GREEN}${PROJECT_NAME}${NC}${BOLD}...${NC}"
echo ""

# 1. Remove template git history
rm -rf .git
echo "  Removed template .git history"

# 2. Initialize fresh repo
git init -q
echo "  Initialized new git repository"

# 3. Update package.json
sed -i "s/\"name\": \"nestjs-graphql-template\"/\"name\": \"${PROJECT_NAME}\"/" package.json
sed -i "s/\"description\": \".*\"/\"description\": \"${DESCRIPTION}\"/" package.json
echo "  Updated package.json (name: ${PROJECT_NAME})"

# 4. Update Kafka group ID
sed -i "s/nestjs-graphql-template/${PROJECT_NAME}/g" src/config/env.validation.ts
sed -i "s/nestjs-graphql-template/${PROJECT_NAME}/g" .env.example
echo "  Updated config defaults"

# 5. Update Swagger title
sed -i "s/NestJS GraphQL Template/${PROJECT_NAME}/g" src/main.ts
echo "  Updated Swagger title"

# 6. Create .env from example
if [[ ! -f .env ]]; then
  cp .env.example .env
  sed -i "s/nestjs_db/${DB_NAME}/" .env
  echo "  Created .env (database: ${DB_NAME})"
else
  echo "  .env already exists — skipped"
fi

# 7. Install dependencies
echo ""
echo "  Installing dependencies..."
pnpm install --silent 2>/dev/null || npm install --silent 2>/dev/null
echo "  Dependencies installed"

# 8. Generate Prisma client
echo "  Generating Prisma client..."
npx prisma generate --no-hints 2>/dev/null
echo "  Prisma client generated"

# 9. Initial commit
git add -A
git commit -q -m "Initial commit from nestjs-graphql-template"
echo "  Created initial commit"

# 10. Remove this setup script
rm -f setup.sh
git add -A
git commit -q -m "Remove setup script"

echo ""
echo -e "${BOLD}${GREEN}Done!${NC} Next steps:"
echo ""
echo "  1. Create your database:  createdb ${DB_NAME}"
echo "  2. Edit .env with your JWT secrets and database password"
echo "  3. Run migrations:        npx prisma migrate dev"
echo "  4. Seed the database:     npx prisma db seed"
echo "  5. Start the server:      pnpm start:dev"
echo ""
