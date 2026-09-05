# Browser prototype implementation plan

**Goal:** A complete asymmetric browser duel with persistent two-player rooms and link/QR invitations.

**Architecture:** A pure deterministic TypeScript engine is shared by the React interface and an authoritative Cloudflare Worker. D1 stores room state; version-checked updates prevent simultaneous commands overwriting each other. Three.js renders a simple 15×11 board and hinged cube nets.

**Spec:** Both 2026-09-05 specifications in `docs/superpowers/specs/`. The user's browser multiplayer request supersedes the original local-only scope.

## Constraints and concrete prototype decisions

- Preserve the exact 11 net geometries, origins and six symbols from the repository.
- 12 dice per role, existing face distributions, resource cap 9; roll three or all remaining dice when fewer than three remain. No dice are replenished.
- One Code reroll using pre-roll resources, one compilation, then actions and end turn.
- Runner 8 Integrity/2 Power; move grants 4 points. Corp move grants 2 points, individual ICE cap 2 (Sentry 1, Firewall 0).
- Combat has a defender-controlled Guard response, one response per attack. Disconnects do not silently accept damage.
- Breach costs 2 Ability. Two Data plus return to Gateway wins. Timer begins at 12 on intrusion, skips its triggering round, restores 2 per new breach.
- Fill unspecified content with data-driven baseline effects: Breach/Sprint exploits; Ghost/Daemon upgrades; Spike/Payload cell traps. Corp Sentry, Hunter, Firewall, Repair, Reinforce, Sanitise.
- Basic corruption costs 1 Ability, range one from Avatar; Utility abilities cost 1 Ability, range one from acting ICE. Repair restores 2 Integrity, reinforce adds 1 shield (cap 2), sanitise flips one unoccupied enemy cell.
- Compilation installs at the marked origin. A fourth daemon explicitly replaces a selected slot. Payloads are one-use cell effects. No optional advanced reaction cards in this baseline.
- Host chooses role; first valid join atomically claims the other role. Anonymous room-scoped HttpOnly session cookies; invite codes are unguessable. Seed stays server-side until game over.
- Reconnection restores state. Background polling pauses when hidden and backs off on errors. Game actions are idempotent and checked against the displayed revision.
- Public access is necessary for the requested second player to follow a link without a ChatGPT account.
- No paid asset services. The board is not an architectural room: no shell, doors, ceiling, environment, or Meshy/Blender export is required. Apply the 3D-room workflow's camera, support and silhouette constraints to procedural runtime pieces.

## Execution

- [x] Rules: add tests for all nets/rotations, dice, placement, movement, reactions, victory, rejected-command immutability and replay; run `npm run test:rules`; implement focused `src/game` modules until passing.
- [x] Presentation: build `src/ui`, `src/render` and `src/styles.css`; typed state and command interfaces contain all gameplay logic. Render six connected hinged faces, mini voxel octopus, ICE, data tokens and legal-placement feedback.
- [x] Multiplayer: implement `src/server`, `db/schema.ts`, generated migration and API integration tests. Verify separate sessions, full-room rejection, resume, stale revisions, idempotency and invalid commands.
- [x] Delivery: run `npm test` and production build; inspect compiled artifacts and migration. Commit exact source, push GitHub feature branch, open a PR, publish the complete Site and verify final status.

## Follow-up: first usability revision

The approved requirements and acceptance checks are in [`docs/superpowers/specs/2026-09-05-prototype-usability-revision.md`](../specs/2026-09-05-prototype-usability-revision.md).

- [ ] Make the dice tray persistently reachable and add the role-aware play recap plus keyboard reference.
- [ ] Add contextual keyboard commands with visible shortcut hints and legal-action guards.
- [ ] Render Data Nodes as solid traversable tiles in 3D and accessible-grid views.
- [ ] Add the Runner's once-per-turn free step and its deterministic rules tests.
- [ ] Add counterclockwise and clockwise deployment controls and shortcuts.
- [ ] Add world-space unit labels, distinct ICE silhouettes, and non-colour identity glyphs.
- [ ] Improve compilation, Corrupt, and Breach affordances, target previews, and action feedback.
- [ ] Run automated checks and keyboard, desktop, mobile, and reduced-motion playtests before redeployment.
