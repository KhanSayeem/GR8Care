# GR8Care

NDIS service-coordination app — ICT302 team project (S-TRAH).

## Structure

```
GR8Care/
  mobile/    # Expo React Native app (NativeWind, React Navigation, Zustand)
  backend/   # Node.js + Express API (MongoDB + Mongoose, JWT auth, Socket.io)
```

## Getting started

### Backend

```bash
cd backend
cp .env.example .env   # fill in MONGODB_URI and JWT_SECRET
npm install
npm run dev
```

### Mobile

```bash
cd mobile
npm install
npm start
```

## Team

| Member | Focus area |
| --- | --- |
| Mahmudul Hasan Tareq | Auth, User Management & AI Educator Bot |
| Md Billal Hossen Emon | Provider Matching, Compatibility Engine & Live Tracking |
| Ratul Kumar Bhowal | Booking, Scheduling/Rostering & Integration Lead |
| Md Shahedul Islam | Funding Tracker, Notifications & Admin |

## Contributing

- Branch from `main`, open a PR, and use the PR template.
- `main` is protected — merges require a passing CI run and at least one review.
- The design-system components in `mobile/src/components` are the single source of
  truth for Button, Card, Badge, Avatar, ProgressBar, and StatusBar — don't duplicate them.
