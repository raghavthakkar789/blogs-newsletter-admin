# Backend API

Express.js backend with TypeScript, Prisma, and PostgreSQL.

## Setup

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env` and configure
3. Generate Prisma Client: `npm run prisma:generate`
4. Push database schema: `npm run prisma:push`
5. Seed database: `npm run prisma:seed`
6. Start dev server: `npm run dev`

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run prisma:generate` - Generate Prisma Client
- `npm run prisma:push` - Push schema to database
- `npm run prisma:migrate` - Create migration
- `npm run prisma:seed` - Seed database
- `npm run prisma:studio` - Open Prisma Studio

## Environment Variables

See `.env.example` for required variables.

