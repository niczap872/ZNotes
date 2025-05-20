# NoteTabs

A notebook application with tabs and Google login functionality, built with React and Supabase.

## Features

- 📝 Create multiple notebooks
- 📑 Organize content with tabs
- 🔄 Real-time saving
- 🔐 Secure authentication with Google
- 👤 User profile management
- 📱 Responsive design

## Tech Stack

- **Frontend**: React, React Router, TailwindCSS
- **Backend**: Supabase (PostgreSQL, Authentication, Storage)
- **Build Tool**: Vite

## Prerequisites

- Node.js (v14+ recommended)
- npm or yarn
- Supabase account

## Setup Instructions

### 1. Clone the repository

```bash
git clone https://your-repository-url/note-tabs.git
cd note-tabs
```

### 2. Install dependencies

```bash
npm install
# or
yarn
```

### 3. Set up Supabase

1. Create a new Supabase project
2. Run the SQL script in `supabase/schema.sql` in the SQL Editor
3. Set up Google OAuth provider in Supabase Authentication settings
4. Get your Supabase URL and anon key from the API settings

### 4. Configure environment variables

Create a `.env` file in the root directory with the following variables:

```
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### 5. Start the development server

```bash
npm run dev
# or
yarn dev
```

## Database Schema

The application uses the following tables:

- `profiles`: User profile information
- `notebooks`: Collection of notebooks owned by users
- `tabs`: Tabs within notebooks
- `notes`: Content for each tab

## Deployment

### Build for production

```bash
npm run build
# or
yarn build
```

The build output will be in the `dist` directory, which can be deployed to services like Netlify, Vercel, or any static hosting provider.

## Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add some amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is licensed under the MIT License.