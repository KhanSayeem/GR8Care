# GR8Care Android Walkthrough Handoff

Date: 2026-08-07

## Purpose

Continue the GR8Care tutor walkthrough work from the committed Expo React Native checkpoint. The immediate goal is a low-friction Android emulator presentation that visually matches the Figma mobile screens closely enough for review, without requiring backend integration first.

## Current Direction

- Use the existing Expo React Native app under `mobile`.
- Run the app on Android emulator through Expo Go.
- Keep Android Studio as the SDK/emulator tool, not as the primary app-editing surface.
- Do not add machine-specific SDK paths, emulator names, or local device assumptions to source files.
- Do not put the user-forbidden readiness phrase on any app screen.

## Key Files

- `docs/frontend-walkthrough-plan.md`
- `docs/android-development-setup.md`
- `mobile/src/screens/auth/LoginScreen.tsx`
- `mobile/src/screens/walkthrough/`
- `mobile/src/data/walkthroughData.ts`
- `mobile/src/navigation/ProviderTabs.tsx`
- `mobile/src/navigation/ParticipantTabs.tsx`
- `mobile/src/navigation/AdminTabs.tsx`
- `mobile/src/navigation/tabIcons.tsx`
- `mobile/tailwind.config.js`

## Implemented In This Checkpoint

- Reworked the entry screen into a Figma-aligned role selection surface.
- Added seeded walkthrough data for classroom-safe visible flows.
- Added walkthrough screens for home, wellness/shift notes, education, matching, funding, and profile/account.
- Replaced placeholder tab screens across participant, provider, and admin navigators.
- Added bottom-tab Ionicons so Android does not render missing icon boxes.
- Switched custom font aliases to portable system fonts to avoid Expo runtime font warnings.
- Added Android setup documentation focused on teammate portability.

## Verified Locally

These checks passed before this handoff was written:

```powershell
cd mobile
npm exec -- tsc -- --noEmit
npm run lint
```

Also checked that the user-forbidden readiness phrase is not present in app copy:

```powershell
rg -n "<user-forbidden readiness phrase>" mobile/src
```

Android emulator state during the working session:

- AVD: `GR8Care_API_36`
- `adb devices` showed `emulator-5554 device`
- Expo Go loaded the app through `exp://127.0.0.1:8081` after `adb reverse tcp:8081 tcp:8081`

Treat the emulator name as local-only evidence, not a project requirement.

## Known Caveats

- `npm install` reported existing dependency audit findings. Do not run broad `npm audit fix --force` during walkthrough stabilization unless that is the task, because it may alter Expo dependency compatibility.
- The current screens use seeded frontend data. Backend/API integration is intentionally not required for the first tutor walkthrough.
- Some in-screen emoji icons remain in cards and role buttons. They rendered in the tested emulator, but if another Android image shows boxes, replace them with vector icons the same way the bottom tabs were fixed.
- There may be no native `android/` project directory because this is an Expo managed app. Teammates should run it from `mobile` after starting an emulator in Android Studio.

## Recommended Next Steps

1. Pull or use the committed checkpoint.
2. Start an Android emulator from Android Studio Device Manager.
3. Run:

```powershell
cd mobile
npm install
npm run android
```

4. Walk through provider/caregiver first, because that path currently has the fullest bottom-tab experience.
5. Continue visual alignment against the Figma file:

```text
https://www.figma.com/design/CupfAqI6CJTOR2kxjeltyl/GR8Care-App?node-id=18-2
```

## Suggested Skills

- `figma:figma-use` when comparing or pulling details from the Figma app screens.
- `design-taste-frontend` or `frontend-design:frontend-design` for further visual refinement.
- `handoff` when closing another checkpoint, but keep GR8Care handoffs in `docs/superpowers/handoffs/`.
