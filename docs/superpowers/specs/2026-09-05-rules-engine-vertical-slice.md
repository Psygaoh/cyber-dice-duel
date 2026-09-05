# Cyber Dice Duel — Rules-Engine Vertical Slice Specification

**Status:** Ready for implementation  
**Date:** 2026-09-05  
**Parent design:** `docs/superpowers/specs/2026-09-05-cyber-dice-duel-design.md`

## Goal

Build a deterministic, renderer-independent simulation of one complete Runner/Corp round. The slice must prove that the dice economy, validated cube-net deployment, asymmetric movement, invalid-command handling, and event replay work before browser presentation is added.

## Non-goals

This slice does not include rendering, animation, online multiplayer, accounts, advanced Program or ICE abilities, combat, Data breaches, extraction, matchmaking, or final balance tuning.

## Runtime choices

- TypeScript with strict type checking.
- A small pure rules package with no DOM or rendering imports.
- Vitest (or the repository's equivalent test runner) for unit and replay tests.
- Seedable pseudo-random source injected into the rules engine; no direct global randomness.
- JSON-serializable state and event records.

## Source layout

Create the following focused modules under `src/game/`:

| File | Responsibility |
| --- | --- |
| `symbols.ts` | `Deploy`, `Move`, `Attack`, `Guard`, `Code`, `Ability` constants and symbol types |
| `content.ts` | Runner and Corp die templates, two copies of each template, and initial scenario constants |
| `random.ts` | Seeded random interface and implementation used only by dice rolls |
| `dice.ts` | Loadout selection, three-die rolls, Code reroll, Deploy counting, compilation eligibility |
| `resources.ts` | Six persistent pools, cap 9, add/spend operations, rejection reasons |
| `cube-nets.ts` | NET-01 through NET-11 cell data, four rotations, reflection rejection |
| `board.ts` | 15×11 coordinates, ownership, path cells, Gateway/Core, legal placement checks |
| `movement.ts` | Runner Mobility Points and Corp Command Points with movement costs and caps |
| `commands.ts` | Typed command union and machine-readable rejection codes |
| `state.ts` | Complete serializable game state and initial-state factory |
| `engine.ts` | Command validation, state transitions, turn sequence, and event emission |
| `replay.ts` | Rebuild state from seed plus accepted event log |

Tests live under `src/game/__tests__/`, with one test file per focused module and a final `replay.test.ts`.

## Canonical data

### Symbols

The six shared symbols are fixed for this slice:

| Symbol | Runner use | Corp use |
| --- | --- | --- |
| `Deploy` | Compile a die into a backdoor path | Compile a die into a secured route |
| `Move` | 4 Mobility Points | 2 Command Points |
| `Attack` | Damage ICE or Programs | Damage the Avatar or Programs |
| `Guard` | Prevent damage and protect extraction | Prevent damage and protect ICE/Core |
| `Code` | Store for one paid reroll | Store for one paid reroll |
| `Ability` | Breach/corrupt and trigger Exploits | Repair/reinforce/sanitize and activate Utility ICE |

Each die has exactly six faces. Use two copies of each template below (12 dice per side); every template has two `Deploy` faces for the baseline.

Runner templates:

| Template | Faces |
| --- | --- |
| Breach | `Deploy Deploy Move Attack Code Ability` |
| Sprint | `Deploy Deploy Move Move Code Ability` |
| Ghost | `Deploy Deploy Move Move Code Guard` |
| Spike | `Deploy Deploy Attack Attack Code Ability` |
| Daemon | `Deploy Deploy Move Code Code Ability` |
| Payload | `Deploy Deploy Move Attack Ability Guard` |

Corp templates:

| Template | Faces |
| --- | --- |
| Sentry | `Deploy Deploy Guard Guard Attack Code` |
| Hunter | `Deploy Deploy Move Attack Guard Code` |
| Firewall | `Deploy Deploy Guard Guard Code Ability` |
| Repair Utility | `Deploy Deploy Guard Code Code Ability` |
| Reinforce Utility | `Deploy Deploy Guard Guard Ability Attack` |
| Sanitise Utility | `Deploy Deploy Attack Guard Code Ability` |

### Board and paths

- Board dimensions: 15 columns × 11 rows, zero-based coordinates.
- Gateway: `(0,5)`.
- Core: `(14,5)`.
- Start with the initial Runner and Corp path cells from the parent design.
- A compiled die references one of the 11 valid cube nets in `docs/reference/cube-nets-reference.svg`.
- Placement may rotate a net by 0°, 90°, 180°, or 270°; reflection is invalid.
- A placement must be in bounds, non-overlapping, connected internally, and adjacent to the deploying side's existing path.
- Compiling creates six owned path cells and removes that die from the loadout.

## State interfaces

Use explicit serializable types equivalent to:

```ts
type Side = 'runner' | 'corp';
type Coord = { x: number; y: number };
type Owner = Side | null;
type Symbol = 'deploy' | 'move' | 'attack' | 'guard' | 'code' | 'ability';

type ResourcePools = Record<Exclude<Symbol, 'deploy'>, number>;

type DieState = {
  id: string;
  side: Side;
  template: string;
  faces: Symbol[];
  compiled: boolean;
  netId: string;
};

type GameState = {
  seed: string;
  phase: 'recon' | 'intrusion';
  activeSide: Side;
  round: number;
  board: BoardState;
  resources: Record<Side, ResourcePools>;
  loadouts: Record<Side, DieState[]>;
  rolled: RolledDie[];
  movement: MovementState;
  eventLog: GameEvent[];
  winner: Side | null;
};
```

## Turn and command behavior

1. Active side chooses exactly three uncompiled dice.
2. Engine rolls them using the injected seedable source.
3. Active side may spend at most one stored `Code` to reroll one die.
4. Results are locked. If at least two show `Deploy`, the side may compile one of those dice.
5. Every final non-Deploy result is added to its matching pool, capped at 9.
6. Actions may spend resources in any legal order.
7. Ending the turn passes control; after Corp, the system tick advances the round and intrusion timer according to the parent design.

The engine must reject commands that use unavailable dice, reroll without Code, reroll twice, compile without two Deploy results, spend beyond a pool, place an illegal net, move beyond the active movement budget, or act outside the active side's turn.

Every rejection returns a stable code such as `DIE_UNAVAILABLE`, `NO_CODE`, `DEPLOY_REQUIREMENT_NOT_MET`, `RESOURCE_INSUFFICIENT`, `ILLEGAL_PLACEMENT`, `MOVEMENT_LIMIT`, or `WRONG_TURN` and leaves state unchanged.

## Movement

Runner:

- each `Move` spent grants 4 Mobility Points for the turn;
- backdoor entry costs 1;
- secured-cell entry costs 2;
- points expire at end of turn.

Corp:

- each `Move` spent grants 2 Command Points;
- secured-cell entry costs 1;
- backdoor entry costs 2;
- points can be distributed across ICE;
- a single ICE may move at most two cells per Corp turn;
- points expire at end of turn.

## Event log and replay

Accepted commands append immutable events containing command type, acting side, relevant identifiers, random results, and resulting state hash. Rejected commands are exposed to development diagnostics but are not part of the canonical replay log.

`replay(seed, events)` must reconstruct the same final JSON state and state hashes as the original run. The replay path must never call an unseeded random source.

## Required tests

- Seeded rolls produce identical results for identical seeds.
- One Code reroll works; a second reroll or missing Code is rejected.
- Resource pools cap at 9 and reject overspending without mutation.
- Two Deploy results enable one compilation; fewer do not.
- Compiled dice leave the loadout and cannot be reused.
- All rotations of NET-01 through NET-11 can be validated; reflections are rejected.
- Placement rejects out-of-bounds, overlap, disconnected, and non-adjacent patterns.
- Runner and Corp movement costs differ as specified; Corp per-ICE cap is enforced.
- Invalid commands preserve a byte-equivalent state snapshot.
- A full seeded round replays to the same state and event log.

## Completion criteria

Issue #3 is complete when the tests pass, a fixture can execute one full Runner turn and one full Corp turn, the replay test is deterministic, and the engine exposes metrics for Deploy results, compilations, rerolls, and resources gained/spent. Browser UI work begins only after this slice is reviewed.
