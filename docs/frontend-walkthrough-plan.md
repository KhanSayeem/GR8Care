# GR8Care Frontend Walkthrough Plan

Date: 2026-08-04

## Decision

Use the existing Expo React Native app as the lowest-friction tutor walkthrough surface and run it on an Android emulator through Expo Go.

## Why

- Matches the mobile Figma screens more closely than Expo Web.
- Avoids requiring a physical phone during the walkthrough.
- Avoids requiring MongoDB or backend availability for the first visual pass.
- Keeps the implementation inside the current app instead of creating a separate throwaway web project.
- Lets backend/API wiring continue issue by issue after the visible user flows are present.

## First Slice

Build seeded frontend screens that are honest walkthrough data:

- Role choice entry screen
- Support Worker home
- Support Worker wellness and shift-note helper
- NDIS education library
- Provider matching
- Funding tracker

## Run Path

```powershell
cd mobile
npm install
npm run android
```

Backend setup remains useful for later integration work, but it should not block the first frontend walkthrough.

## Figma Alignment

Figma source: https://www.figma.com/design/CupfAqI6CJTOR2kxjeltyl/GR8Care-App?node-id=18-2

Reference screens inspected:

- S01 Splash
- S03 Role Selection
- S06 Participant Dashboard
- S16 Funding Tracker

Implementation should follow the existing Figma direction: 390px mobile frame, cream app background, dark teal hero surfaces, coral primary accents, strong headings, clean body text, 16-20px rounded cards, and compact bottom-tab navigation.
