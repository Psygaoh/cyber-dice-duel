# Cyber Dice Duel — Resume TODO

This is the hand-off checklist for the current iteration. The working tree already contains the iteration 02 usability and rules changes, but they are not yet the released version.

## Product decision to preserve

- There is one active ruleset. `src/game/content.ts` owns `RULES_VERSION`.
- When the server sees a room created with an older rules version, it returns `410 RULES_UPDATED` for reads, joins, commands, and replay export. The client clears that room from the URL/local storage and tells both players to create a new duel.
- Do not add a legacy-rules compatibility path. When rules change again, bump the version, add/update the closure test, and close old rooms with the same flow.

## Required before merging iteration 02

- [ ] Remove the temporary `qa.html` responsive-test harness; it must not ship.
- [ ] Make the create/join dialog keep its context and show a friendly transport error when the API returns an empty/non-JSON response.
- [ ] Finish one clean browser pass at 1366×768 and 390×844:
  - [ ] Dice tray stays reachable without page-end scrolling and remains usable while the board/action area scrolls.
  - [ ] `?`, `D`, arrows, Space, `R`, `L`, `Q`/`E`, `M`, `A`, `C`, `B`, and Escape work only when their action is legal.
  - [ ] Compile, rotate both directions, place a net, Corrupt, Breach, and the Runner free step show targets, costs, and result feedback.
  - [ ] Unit names appear on hover, keyboard focus, and touch selection; glyphs/silhouettes distinguish every unit type without colour alone.
  - [ ] The recap states both victory conditions and the turn loop in its first view.
- [ ] Run the real two-session room flow through the UI: create, copy/share link, QR value, join the other seat, see state sync, take turns, and verify an outdated room closes with the “start a new duel” prompt.
- [ ] Run `npm test` (expected: 37 tests) and `npm run build`; fix any regression before review.
- [ ] Ask for a final read-only code review, resolve any concrete findings, and update the usability spec status from “implementation pending” to the shipped iteration status.

## Merge and publish checklist

- [ ] Stage only the intended source, tests, and docs; confirm `qa.html` is absent.
- [ ] Commit the exact tested tree on `codex/browser-prototype`.
- [ ] Push that commit to the GitHub branch and update PR #4 with the test/build results and the WebGL test limitation.
- [ ] Mark PR #4 ready, wait for required CI, then merge it.
- [ ] Push the same exact source commit to the Sites source branch, package the successful build, save a Site version, and deploy it publicly to the existing project.
- [ ] Poll the deployment until it reports `succeeded`, then record the resulting public URL in the hand-off.
- [ ] Stop the supervised preview after QA and leave no temporary local server or test file running.

## Known validation limit

The browser QA environment currently has WebGL disabled, so it can validate the accessible grid and controls but not the live Three.js rendering, miniature silhouettes, or code-stream effects. A post-release playtest on a WebGL-capable desktop and phone is still required.

## Next iteration backlog (after this release)

- [ ] Playtest the asymmetric balance: free-step value, Firewall surcharge, Ability costs, intrusion timing, and Corp response windows.
- [ ] Test QR scanning and touch targeting on two physical devices over a reachable network.
- [ ] Verify reconnect/refresh behavior during every phase, including while a player is targeting a cell.
- [ ] Add explicit room lifecycle/expiry and an operator-friendly way to diagnose abandoned rooms if playtests need it.
- [ ] Revisit 3D performance and effect readability on mid-range mobile hardware once GPU captures are available.
- [ ] Expand automated accessibility checks (focus order, announcements, reduced motion, and keyboard-only completion of a full duel).
