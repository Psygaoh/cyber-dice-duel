# Browser prototype

Implemented from the two design specifications dated 2026-09-05. The later request adds online play, persistence, link invitations and QR codes to the original local-only design.

## Included

- Pure TypeScript rules engine, seeded rolls, one paid reroll, persistent resources, exact cube nets and origins from the reference SVG.
- Twelve dice per role, six content designs per role, compilation, Programs, ICE, movement, cell ownership changes, combat with defender-controlled Guard, breach, extraction and both Corp victory conditions.
- Three.js orthographic board with thin network tiles, eight-armed voxel octopus Avatar, six ICE silhouettes, blue Data tokens, and hierarchical hinge animation.
- All eleven patterns verified mathematically and against the source SVG. Animation starts with six cube faces and finishes at the same six board cells for all 44 rotations.
- Responsive browser interface, legal placement preview, rotate/find-space controls, movement highlights, replay download and a keyboard-accessible 2D grid fallback.
- Online rooms with anonymous room-scoped HttpOnly sessions. QR codes contain the same room invitation URL as the copy-link control.
- Server-authoritative saved game state in D1. Conditional seat claims and version-checked state writes prevent collisions. Duplicate accepted requests cannot roll or spend twice.
- Reconnection in the same browser; no automatic abandonment, turn timeout or Guard auto-response. Local practice is an explicitly temporary, same-screen duel.

## Deliberate baseline choices

The parent design leaves concrete unit effects open. They are defined in `src/game/content.ts` and described in the implementation plan. When fewer than three dice remain, roll every remaining die; this prevents exhaustion from stalling turns. The three-Daemon cap requires explicit replacement.

No optional advanced reaction cards, AI opponent, ranked matchmaking, account system or balance claims are included. Core Guard responses are implemented. Basic Corp attacks during Recon do not begin intrusion; the Runner's listed intrusion triggers govern the clock.

## Runtime scene contract

The board is the complete scene, with 15×11 one-unit cells. No architectural room shell, entrances, ceiling, city, decorative side structures or imported meshes are required by this game. The custom board adapter applies Build 3D Game Rooms' silhouette, contact and production-camera principles to procedural runtime pieces. It does not claim completion of Blender/Meshy room-production gates.

- Camera: orthographic, centered on the board; angled and top views, constrained zoom.
- Pieces: grounded on thin tiles, normally below one cell in footprint and one unit high; no terrain elevation.
- Avatar: eight radial voxel arms, compact red mantle, dark underside and square visor.
- Input: pointer/touch selection, arrow keys and Enter, labeled alternate grid.
- Readiness: scene mounts after WebGL initialization; unsupported WebGL switches to the 2D grid. Reduced-motion users skip the unfolding animation.
- Asset provenance: six original SVG symbols and exact net geometry from this repository; miniature meshes authored procedurally in source. No paid provider jobs or external mesh downloads.
- Budget target: capped device pixel ratio of 1.8, no post-processing, instanced base grid, no image textures, one small scene. This is a design target, not a measured hardware result.

The Game Development Studio `game-dev` executable is unavailable in the execution environment. Its asset-generation, GPU capture and hardware telemetry workflows were therefore not executed. No provider credentials or charges were used.

## Verification boundaries

Automated rules, geometric animation, and room API tests use Node's test runner. Room tests use real SQLite behind D1's prepared-statement interface, including concurrent seat claims and command races. The production build type-checks client and server and emits a Worker, client assets and the generated migration.

No interactive browser/device playtest or GPU performance measurement was run in this delivery environment. Balance, touch feel, and browser-specific behavior still need real playtesting. Tests prove rules and API behavior; they do not establish human-reviewed rendering quality.

## Network and state

The server keeps the seed and PRNG state private during an active online match. Each player's session cookie is independent of the shareable invitation. Only its SHA-256 digest is stored in D1. The match's authoritative state and canonical event history are saved together. Finished players can download the seed and events for deterministic replay.

The client refreshes roughly every 1.8 seconds while visible and pauses polling in hidden tabs. It never resolves rules locally for an online room. A stale action is rejected and the current snapshot is returned. Seats persist when a tab closes; reconnect using the same browser and room link. Clearing browser cookies loses the seat in this anonymous prototype.

Migrations are generated with Drizzle and applied at deployment, not in request handlers. Runtime queries use bound parameters. Only the primary key index is needed because all room operations look up one exact room ID.

## References used for implementation

- [Cloudflare D1 prepared statements](https://developers.cloudflare.com/d1/worker-api/prepared-statements/)
- [Cloudflare D1 database API](https://developers.cloudflare.com/d1/worker-api/d1-database/)
- [node-qrcode browser API](https://github.com/soldair/node-qrcode)
