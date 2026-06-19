# Shopify Discount Manager

An embedded Shopify application to list, create, edit, and delete basic code discounts. Built on top of the Shopify React Router v7 template.

## Tech Stack
* **Framework**: React Router v7 (React & Node.js backend)
* **UI**: Shopify Polaris Web Components (`s-*` custom elements)
* **GraphQL**: Shopify Admin API integration
* **Session Storage**: Prisma ORM with PostgreSQL (both local development and production)

## Getting Started

### Prerequisites
* Install Node.js (matching version constraints in `package.json`)
* Install [Shopify CLI](https://shopify.dev/docs/apps/tools/cli)
* A Shopify Partner account and a development store
* A running PostgreSQL database (local or remote hosted)

### Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a `.env` file in the root of the project and add your database URL:
   ```env
   POSTGRES_URL="postgresql://username:password@localhost:5432/your_database"
   ```
3. Initialize database schemas:
   ```bash
   npm run setup
   ```

### Local Development
To start your local server and tunnel to your Shopify dev store:
```bash
npm run dev
```
Press `P` in the terminal to open the installation page. Once installed, the app will run embedded in the Shopify Admin.

## Key Files
* **[discounts.js](file:///home/maruburu/Projects/prodiax-case-study/discount-manager/app/graphql/discounts.js)**: Centralized GraphQL query and mutation definitions.
* **[DiscountForm.jsx](file:///home/maruburu/Projects/prodiax-case-study/discount-manager/app/components/DiscountForm.jsx)**: Shared form component used by both the creation and editing routes.
* **[app._index.jsx](file:///home/maruburu/Projects/prodiax-case-study/discount-manager/app/routes/app._index.jsx)**: The dashboard route that lists discounts and coordinates deletions. It utilizes loader-merging to bypass index lag when redirecting.
* **[app.discounts.new.jsx](file:///home/maruburu/Projects/prodiax-case-study/discount-manager/app/routes/app.discounts.new.jsx)**: Route handling the creation form submission.
* **[app.discounts.edit.jsx](file:///home/maruburu/Projects/prodiax-case-study/discount-manager/app/routes/app.discounts.edit.jsx)**: Route handling the edit form rendering and submission.

## Deployment to Vercel

Vercel is a serverless platform. Because of this, SQLite cannot be used in production. You must connect to an external hosted database (such as Vercel Postgres, Supabase, or Neon).

### Steps
1. Create a hosted PostgreSQL database and copy the connection string.
2. Link the repository to your Vercel account and set the following environment variables in Vercel settings:
   * `SHOPIFY_API_KEY`: Client ID from Partner Dashboard
   * `SHOPIFY_API_SECRET`: Client secret from Partner Dashboard
   * `SHOPIFY_APP_URL`: Your live production Vercel URL
   * `SCOPES`: `read_discounts,write_discounts`
   * `POSTGRES_URL`: Your Postgres connection string
3. Deploy the application using Vercel.
4. Run db push against your remote database from your local machine:
   ```bash
   POSTGRES_URL="your-production-postgres-url" npx prisma db push
   ```
5. Update `application_url` and `redirect_urls` in `shopify.app.toml` to match your Vercel domain, then run:
   ```bash
   npm run deploy
   ```
