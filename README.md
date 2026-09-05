# Cyber Dice Duel

A browser-based asymmetric tactical game for two players. The Runner unfolds backdoors, steals two Data and escapes; the Corp builds secured routes and deploys ICE to stop them.

## Play

Choose **Create a duel**, enter a callsign and pick Runner or Corp. Share the invite link or QR code with your opponent. They claim the other seat without an account. Reopen the same room link in the same browser to resume.

**Try a local duel** runs a temporary same-screen game: pass control between players after each turn or Guard response. Online rooms are saved on the server.

Each turn: choose three dice, roll, optionally spend a saved Code to reroll once, lock results, optionally unfold a Deploy die, spend resources, then end the turn. The in-game field guide covers every rule, Program, ICE ability and the eleven canonical cube nets.

## Run locally

Requires Node.js 24 (the test suite uses Node's built-in SQLite).

```bash
npm ci
npm test
npm run build
npx wrangler d1 migrations apply cyber-dice-duel-local --local
npm start
```

Open the local URL printed by Wrangler. Use separate browser profiles for the two player sessions. When testing over a LAN, start Wrangler with an externally reachable interface and open the app using that LAN address so invitations contain the correct origin.

For frontend development, keep the local Worker running on port 8787 and run `npm run dev` in a second terminal. Vite proxies `/api` to the Worker. Rebuild Worker code after changing server/rules files, or restart the production local flow above.

## Source map

| Path | Responsibility |
| --- | --- |
| `src/game/` | Pure deterministic rules, content, cube nets, movement and replay |
| `src/server/` | Authoritative room API, anonymous sessions, D1 state and revision checks |
| `src/render/` | Three.js board, procedural miniatures, exact hinge unfolding |
| `src/ui/` | React game controls, QR invitations, field guide, accessible grid |
| `db/schema.ts`, `drizzle/` | Schema and generated migration |
| `docs/prototype-implementation.md` | Scope, concrete rules, provenance and verification limits |

`npm test` verifies rules, net geometry, folding geometry, deterministic replay, room authentication and simultaneous join/action conflicts. `npm run build` type-checks and emits client assets, an ESM Worker and migrations. CI runs both.

## Design references

- [Prototype gameplay and architecture specification](docs/superpowers/specs/2026-09-05-cyber-dice-duel-design.md)
- [Rules-engine vertical slice specification](docs/superpowers/specs/2026-09-05-rules-engine-vertical-slice.md)
- [First usability revision: persistent dice, shortcuts, movement, unit clarity, and coding feedback](docs/superpowers/specs/2026-09-05-prototype-usability-revision.md)
- [Resume TODO and release checklist](docs/TODO.md)
- [Reference image: the 11 valid cube nets](docs/reference/cube-nets-reference.svg)
- [Reference image: shared dice symbols](docs/reference/dice-symbols-reference.svg)
- [Issue tracker](https://github.com/Psygaoh/cyber-dice-duel/issues)



Individual symbol assets:

- [Deploy](docs/reference/symbols/deploy.svg)
- [Move](docs/reference/symbols/move.svg)
- [Attack](docs/reference/symbols/attack.svg)
- [Guard](docs/reference/symbols/guard.svg)
- [Code](docs/reference/symbols/code.svg)
- [Ability](docs/reference/symbols/ability.svg)
