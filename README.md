# ⛪ Life Groups Hub

A community calendar and communication platform for life groups, small groups, church teams, or any close-knit community.

## Features

- **📅 Calendar** — Monthly calendar with event creation, editing, color coding, and an upcoming events sidebar
- **💡 Ideas Board** — Members can suggest ideas, upvote favorites, and leave comments
- **💬 Group Chat** — Real-time-style messaging with avatars and message grouping
- **📢 Communications** — Post announcements, prayer requests, celebrations, needs, and reminders with emoji reactions
- **🔐 Password Gate** — Simple shared password to keep the space private to your group
- **👤 Name + Avatar Picker** — Each member picks their name and avatar each session

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- npm (included with Node.js)

### Installation

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/life-groups-hub.git
cd life-groups-hub

# Install dependencies
npm install

# Start the dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for Production

```bash
npm run build
```

The built files will be in the `dist/` folder — deploy them to any static host (Netlify, Vercel, GitHub Pages, Cloudflare Pages, etc).

## Configuration

Edit `src/config.js` to customize your group's instance:

```js
const config = {
  groupName:     "Life Groups Hub",     // Name shown in the header
  groupPassword: "lifegroup2025",       // 🔑 Change this!
  groupSubtitle: "Your community...",   // Subtitle on the login screen
  groupIcon:     "⛪",                  // Emoji in the header
};
```

**Change the password before sharing with your group.**

## Data Storage

All data is stored in the browser's `localStorage`. This means:

- Data persists between page refreshes on the same browser/device
- When the window gains focus, it re-syncs from localStorage (basic multi-tab support on the same device)
- Data does **not** automatically sync across different devices or browsers in real time

For a fully shared, real-time experience across devices, you would need to add a backend (e.g. Supabase, Firebase, or a simple Express + PostgreSQL server). This repo is intentionally kept dependency-free for easy self-hosting.

## Deploying to Netlify (Free)

1. Push this repo to GitHub
2. Go to [netlify.com](https://netlify.com) → New site from Git
3. Select your repo
4. Build command: `npm run build`
5. Publish directory: `dist`
6. Click Deploy

## Deploying to GitHub Pages

```bash
npm install --save-dev gh-pages
```

Add to `package.json`:
```json
"scripts": {
  "deploy": "gh-pages -d dist"
}
```

Then:
```bash
npm run build
npm run deploy
```

## Tech Stack

- [React 18](https://react.dev/)
- [Vite](https://vitejs.dev/)
- Browser `localStorage` for persistence
- No external UI libraries — pure CSS-in-JS

## License

MIT — free to use, modify, and share.
