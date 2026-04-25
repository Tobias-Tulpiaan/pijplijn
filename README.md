This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Production Deployment

### Database

De productie-database is een Neon PostgreSQL-instantie (`neon-sky-forest`), aangemaakt via Vercel Storage en automatisch gekoppeld via de `DATABASE_URL` environment variable in Vercel.

Vercel env vars die ingesteld moeten zijn:
- `DATABASE_URL` — Neon connection string (pooler URL)
- `AUTH_SECRET` — willekeurige geheime sleutel voor NextAuth
- `AUTH_URL` — publieke URL van de app (bijv. `https://pijplijn-tulpiaan.vercel.app`)

### Nieuwe migratie naar productie pushen

Voer nooit `prisma migrate dev` uit tegen de productie-database. Gebruik altijd `migrate deploy`:

```cmd
set "DATABASE_URL=<prod_connection_string>" && npx prisma migrate deploy
```

### Productie-database initialiseren (eenmalig)

```cmd
set "DATABASE_URL=<prod_connection_string>" && npx prisma migrate deploy && npx prisma db seed
```

De seed maakt twee gebruikers aan:
- **Tobias** (Tobias@tulpiaan.nl)
- **Ralf** (Ralf@tulpiaan.nl)

Standaardwachtwoord: `tulpiaan2026`

> **Pas dit wachtwoord direct aan** na de eerste login via de instellingen-pagina (of via de database rechtstreeks). Het standaardwachtwoord is alleen bedoeld voor de initiële setup.
