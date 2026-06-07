# UniSpora

UniSpora is an interactive university discovery interface built around a cinematic Mapbox globe. It helps students explore universities by region, country, programs, scholarships, language, and location through a polished glassmorphism UI.

The project is a Vite + React application with TanStack Router, Mapbox GL, custom UI components, Appwrite Auth, and Appwrite-backed university data.

## Features

- Interactive 3D globe with clustered university markers
- Glassy university detail popups anchored to selected map points
- Continent and country filters with animated globe focus
- Search experience that expands from the top navigation
- Search suggestions for universities with Enter-to-focus behavior
- Light and dark globe modes while the rest of the UI remains visually consistent
- Login and sign-up glass modals over the globe
- Appwrite email/password auth, email verification, Google sign-in, and unique username reservations
- AI advisor page for university guidance
- Consultant listing and consultant profile views
- Student and consultant dashboard mockups
- Custom UniSpora branding and logo assets

## Tech Stack

- React 19
- TypeScript
- Vite
- TanStack Router
- Mapbox GL JS
- Tailwind CSS / custom CSS
- Lucide React icons

## Project Structure

```text
src/
  components/
    ai/                 AI advisor panel
    consultants/        Consultant cards
    globe/              Mapbox globe and university details panel
    layout/             App shell, top nav, branding, theme controls
    ui/                 Shared glass UI primitives
  data/
    appwriteUniversities.ts  Appwrite university data loader
    consultants.ts      Consultant dataset
  routes/               TanStack Router pages
  styles.css            Global UI, glass, modal, map, and responsive styles
```

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure Mapbox

Create a local environment file:

```bash
cp .env.example .env.local
```

Add your Mapbox and Appwrite settings:

```env
VITE_MAPBOX_TOKEN=your_mapbox_token_here
VITE_APPWRITE_ENDPOINT=https://fra.cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=your_appwrite_project_id
VITE_APPWRITE_DATABASE_ID=unispora
VITE_APPWRITE_UNIVERSITIES_COLLECTION_ID=universities
VITE_APPWRITE_USERNAMES_COLLECTION_ID=usernames
```

`.env.local` is intentionally ignored by Git so secrets are not pushed to GitHub.

### 3. Run locally

```bash
npm run dev
```

Then open:

```text
http://127.0.0.1:5173/
```

## Available Scripts

```bash
npm run dev
```

Start the local Vite development server.

```bash
npm run typecheck
```

Run TypeScript checks without emitting files.

```bash
npm run build
```

Create a production build.

## Notes

- The Mapbox token must be provided through `VITE_MAPBOX_TOKEN`.
- The `usernames` Appwrite collection is used to reserve unique usernames before account creation.
- Build output, local env files, generated Vite artifacts, and dependencies are ignored through `.gitignore`.

## Appwrite Username Registry

Create a `usernames` collection in the `unispora` database with these attributes:

- `username`: string, required, size 36
- `email`: string, optional, size 128
- `userId`: string, optional, size 64

Each username is stored as the document ID, so Appwrite rejects duplicates. The app reserves the username before creating the Auth user; if the reservation fails, account creation does not continue.

## Repository

GitHub: [shah-ahmad/UNISPORA](https://github.com/shah-ahmad/UNISPORA)
