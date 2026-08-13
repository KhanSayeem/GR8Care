# GR8Care Fast Continuation Handoff

Date: 2026-08-13

## Purpose

Continue GR8Care development from the committed repository state after the high-throughput issue batch. The next session should move quickly, use subagents for independent work, and unblock Android visual verification for mobile UI PRs before merging them.

Repository:

```text
C:\Users\Hi\Documents\GitHub\Miscellanious\GR8Care
```

Current source of truth:

```text
origin/main after merge commit d202eba07e4f81eceb07b4a8942445fe3e6e1e54
```

This handoff is repo-local by user requirement. Keep future handoffs in:

```text
docs/superpowers/handoffs/
```

Do not move handoffs to a temp directory even if the generic handoff skill suggests it.

## Read First

Start the next session by reading:

```text
docs/superpowers/handoffs/2026-08-13-gr8care-fast-continuation-handoff.md
docs/frontend-walkthrough-plan.md
docs/android-development-setup.md
docs/superpowers/handoffs/2026-08-07-gr8care-android-walkthrough-handoff.md
```

If `AGENTS.md` exists in the fresh worktree, read it first. In this worktree, `rg --files | rg "(^|/)AGENTS\.md$"` found no repo-local `AGENTS.md`.

## Hard Constraints

- Preserve unrelated dirty and untracked files. Current recurring untracked folders are `.worktrees/` and `artifacts/`.
- Do not add machine-specific SDK paths, emulator names, or local device assumptions to project code.
- Do not commit generated native Android folders, build outputs, Gradle caches, `node_modules`, `.expo`, or local Android state.
- Do not put the user-forbidden readiness phrase on any app screen.
- Do not claim Android visual verification without actual emulator screenshots from the current branch.
- For frontend work, use the existing Expo React Native patterns, Figma alignment, and current seeded-data walkthrough style.
- Keep the app/emulator screen centered during Android checks.

## Dependency Reuse

Optimize setup time. Do not reinstall from scratch unless dependency checks fail.

Use existing dependency folders when the worktree already has them:

```powershell
Test-Path mobile\node_modules
Test-Path backend\node_modules
```

If dependencies are present, run checks directly:

```powershell
cd mobile
npm exec -- tsc -- --noEmit
npm run lint

cd ..\backend
npm test
npm run lint
```

If a fresh Codex worktree lacks `node_modules`, prefer a local copy or install only where needed:

```powershell
robocopy C:\Users\Hi\.codex\worktrees\5f1d\GR8Care\mobile\node_modules .\mobile\node_modules /MIR /XD .cache .vite
robocopy C:\Users\Hi\.codex\worktrees\5f1d\GR8Care\backend\node_modules .\backend\node_modules /MIR /XD .cache
```

If copying is not viable, run `npm install` in only the package that needs it. Avoid `npm audit fix --force`; prior sessions saw existing audit findings and broad fixes risk Expo compatibility.

## Figma And UI Source

Use the Figma connector/plugin for design reference. Figma file:

```text
https://www.figma.com/design/CupfAqI6CJTOR2kxjeltyl/GR8Care-App?node-id=18-2
```

Known Figma-aligned direction:

- 390px centered mobile frame.
- Cream app background.
- Dark teal hero surfaces.
- Coral primary accents.
- Strong headings, clean body text.
- Compact card and tab navigation.
- Avoid crowded bottom tabs; use reachable sub-screens when a sixth tab would harm mobile spacing.

Use the Figma plugin/connector to inspect the relevant screens before UI changes. Use shadcn premade blocks/components wherever useful for web/admin-style surfaces, but do not force shadcn into React Native screens where the existing mobile design system is `Card`, `Button`, `Badge`, `ProgressBar`, `Ionicons`, and `ScreenShell`.

## Completed In This Batch

Merged:

- PR #129, issue #104: multilingual voice-to-voice orchestration backend.
  - Merge commit: `8f1469559bdb198b2f53411e21d339e993328949`
  - Adds `/voice/orchestrate`.
  - Supports English, Arabic, Vietnamese language resolution and same-language TTS metadata.
- PR #131, issue #46: document templates backend.
  - Merge commit: `6a3b5be2fecc8a102701d3c444fbfc5e3568cebc`
  - Adds `/document-templates`, fill output, and deterministic PDF export.
- PR #133, issue #63: provider availability endpoint.
  - Merge commit: `d202eba07e4f81eceb07b4a8942445fe3e6e1e54`
  - Adds `POST /providers/me/availability`.
  - Provider/supportWorker role gated, validates weekday and HH:mm time blocks.

Draft, green CI, not merged:

- PR #130, issue #74: S17 Notifications screen UI.
  - Branch: `codex/issue-74-notifications-integration`
  - CI: backend pass, mobile pass, CodeRabbit skipped/pass because draft.
  - Status: implementation ready for visual verification, but not visually verified.
- PR #132, issue #62: Set Availability sub-screen UI.
  - Branch: `codex/issue-62-set-availability-integration`
  - CI: backend pass, mobile pass, CodeRabbit skipped/pass because draft.
  - Status: implementation ready for visual verification, but not visually verified.

Both draft PRs are intentionally held because the Android visual pass did not complete.

## Android Visual Blocker

The emulator exists and was started:

```text
GR8Care_API_36
```

Treat that name as local evidence only. Do not encode it in project code.

Commands that worked:

```powershell
emulator -list-avds
Start-Process -FilePath emulator -ArgumentList @('-avd','GR8Care_API_36')
adb wait-for-device shell getprop sys.boot_completed
adb reverse tcp:8081 tcp:8081
powershell.exe -NoProfile -ExecutionPolicy Bypass -File mobile\scripts\center-android-emulator.ps1 -AvdName GR8Care_API_36 -WaitSeconds 5 -StabilizeSeconds 1
```

Metro bundled successfully from current branches, including localhost mode:

```text
Android Bundled ... mobile\node_modules\expo\AppEntry.js
```

But Expo Go crashed back to the Android launcher after bundling. Logcat showed host Expo Go runtime errors, not a normal React screen render:

```text
Current Activity is of incorrect class, expected AppCompatActivity, received LauncherActivity
Unable to attach a rootView to ReactInstance when UIManager is not properly initialized
Process: host.exp.exponent
```

Expo Go installed version observed:

```text
host.exp.exponent versionName=2.31.2 versionCode=249
```

Useful screenshots/logs from this failed verification attempt are in:

```text
artifacts/android-visual/
```

Those artifacts are local evidence only and should stay untracked unless explicitly requested.

## Recommended Next Moves

1. Fix or bypass Android visual verification first.
   - Preferred: run a project dev build for `com.gr8care.app` so visual checks do not depend on crashing Expo Go.
   - Alternative: repair/reinstall a compatible Expo Go for this SDK/runtime and retest.
   - Do not commit generated native Android files unless the issue is explicitly to add dev-client/native build support.
2. Once Android renders current mobile branches, visually verify PR #130:
   - Participant home.
   - Tap notification bell.
   - Notifications screen top and lower scroll.
   - Mark all read state.
   - Check clipping, overlap, missing icons, status/nav bar spacing, centered app frame, and Figma alignment.
3. Visually verify PR #132:
   - Provider or support worker home with Set Availability quick action.
   - Availability screen top.
   - Day selector, add block, toggle, text fields, remove block, save state.
   - Check same visual concerns as above.
4. If screenshots pass, mark PR #130 and PR #132 ready and merge under the user's standing approval once CI is green.
5. Continue API/backend work in parallel while visual verification is being fixed. Good next candidates:
   - #75 Wire Notifications to GET `/notifications` and mark-read endpoint.
   - #61 Wire Provider Schedule to GET `/providers/me/schedule`.
   - #65 Wire Booking Detail to GET `/bookings/:id` and PATCH `/bookings/:id`.
   - Avoid decision-needed issues #108 and #111.
   - Avoid `mvp-descope` issues unless the user explicitly pulls them back in.
   - Avoid `blocking` issues #68-#70 unless the blocker is resolved.

## Workflow Optimization

Use subagents aggressively but safely:

- Main agent owns the immediate critical path.
- Spawn read-only triage agents for live issue ranking.
- Spawn implementation agents only for disjoint write scopes:
  - backend API issue vs mobile UI issue is safe.
  - two mobile UI issues touching the same navigation/data files are not safe unless one is read-only.
- For sidecar coding agents, require:
  - branch name,
  - commit hash,
  - changed file paths,
  - checks run and result,
  - screenshot path if any,
  - concerns.
- Main agent must review sidecar diffs before integrating.
- Keep mobile UI PRs draft until emulator screenshots exist.

## Android Run Checklist

From `mobile`:

```powershell
npm exec -- tsc -- --noEmit
npm run lint
```

Start centered Android workflow:

```powershell
cd mobile
npm run android:centered
```

If manually controlling Metro:

```powershell
$existing = Get-NetTCPConnection -LocalPort 8081 -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
foreach ($procId in $existing) { Stop-Process -Id $procId -Force }
adb reverse tcp:8081 tcp:8081
npx expo start --android --localhost --port 8081 --clear
```

If Expo Go continues crashing, stop spending time on repeated relaunches. Move to dev build or a specific Expo Go/runtime fix.

## New Thread Prompt

Use this exact prompt to start the next Codex task:

```text
Continue GR8Care from the committed repo-local handoff.

Repository: C:\Users\Hi\Documents\GitHub\Miscellanious\GR8Care
Handoff: docs/superpowers/handoffs/2026-08-13-gr8care-fast-continuation-handoff.md
Branch/source state: origin/main after d202eba07e4f81eceb07b4a8942445fe3e6e1e54, plus the handoff commit on codex/handoff-2026-08-13-continuation.

Start by reading AGENTS.md if present, then read the handoff, docs/frontend-walkthrough-plan.md, docs/android-development-setup.md, and docs/superpowers/handoffs/2026-08-07-gr8care-android-walkthrough-handoff.md. Treat the repo as source of truth and preserve unrelated changes.

Primary objective: unblock Android visual verification and finish PR #130 and PR #132. Use the existing dependency installations when possible instead of reinstalling everything from scratch. Check mobile/backend node_modules first; if a fresh worktree lacks dependencies, reuse/copy from an existing GR8Care worktree when practical, or install only the package that needs it. Do not run broad forced dependency upgrades.

Use the Figma connector/plugin with https://www.figma.com/design/CupfAqI6CJTOR2kxjeltyl/GR8Care-App?node-id=18-2 for UI references. Use existing React Native design components and patterns; use shadcn premade blocks/components where relevant for web/admin surfaces rather than inventing custom UI.

Keep the Android emulator/app window centered. Do not claim visual verification without actual screenshots. For #130 capture participant home, notifications top/lower, and mark-all-read state. For #132 capture provider/support worker home and Set Availability top/lower/save state. Inspect clipping, overlap, missing icons, status/nav bar spacing, centered frame, and Figma alignment.

Optimize workflow: use agents/subagents for independent work. Main agent should own the visual-verification blocker; sidecar agents can continue API/backend issues or do read-only issue triage. Do not let agents edit overlapping mobile navigation/data files in parallel.

Open/draft PR status at handoff: #130 and #132 are draft with green CI but blocked on visual proof. Merged in the last batch: #129, #131, #133.
```

## Suggested Skills

- `handoff` when closing the next checkpoint, but keep output repo-local.
- `figma:figma-use` for the GR8Care Figma source.
- `superpowers:dispatching-parallel-agents` and `superpowers:subagent-driven-development` for safe parallel work.
- `superpowers:verification-before-completion` before marking PRs ready.
- `design-taste-frontend` or `frontend-design:frontend-design` for mobile UI polish.
