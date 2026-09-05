# Cyber Dice Duel — Control and Escape Balance Pass

**Status:** Proposed; specification only, not implemented
**Date:** 2026-09-05
**Parent design:** [`2026-09-05-cyber-dice-duel-design.md`](2026-09-05-cyber-dice-duel-design.md)
**Reason:** Playtest feedback after the usability revision

## Problem statement

The current prototype can make the Corp feel unable to reposition its ICE, while the Runner can be sealed behind a Corp perimeter with no legal six-cell compilation. Deployed ICE also reads more like a collection of attackable bodies than a network of active control tools.

This pass should make the board contestable without turning it into a hard-lock puzzle:

- Corp units need a reliable minimum of movement and more meaningful zones of influence.
- Runner needs a small, resource-paid way to extend a route when a full die net cannot fit.
- Temporary control should be readable, spend a real resource, and expire predictably.
- Existing six-cell dice, the shared symbol vocabulary, and the two victory conditions remain intact.

## Scope boundary

This is a rules proposal for the next implementation pass. It does not change code, migrations, the current public build, dice-face distributions, or the existing iteration 02 usability acceptance checks. Values below are starting points for playtesting, not final balance claims.

## 1. Corp mobility floor

### 1.1 Free patrol

At the start of every Corp action phase, the Corp may make **one free patrol step** with one movable ICE.

- The chosen ICE moves one orthogonal cell.
- The destination must be an in-bounds, connected, unoccupied **Corp-secured** cell.
- The step does not spend Command Points, but it still obeys the unit's movement cap for the turn.
- Firewall remains immobile and cannot patrol.
- A patrol is optional and cannot be saved for a later turn.

This is a repositioning floor, not a free attack or a free way to cross the Runner's territory.

### 1.2 More useful Move results

Each Corp Move resource grants **3 Command Points** for the current turn, up from the current baseline of 2.

- Command Points can still be distributed among several ICE.
- Secured-cell entry costs 1; Runner-backdoor entry costs 2.
- Each movable ICE keeps its per-turn movement cap of at most two cells unless a later content change explicitly says otherwise.
- Unused Command Points expire at end of turn.

The patrol and paid movement are separate actions. A Corp may patrol and then spend Command Points on the same ICE if its movement cap allows it.

## 2. ICE control roles

Every deployed ICE should create a board decision beyond “walk adjacent and attack.” The first pass uses the existing six Corp templates:

| ICE | New/clarified role | Starting rule |
| --- | --- | --- |
| Sentry | Ranged guard | Basic attack may target an enemy at orthogonal Manhattan range 1–2. No line-of-sight subsystem is added yet. One attack per turn still applies. |
| Hunter | Pursuit | Keeps Move 2 and melee attack. Its value is reliable repositioning and pressure on the Avatar rather than a second ranged turret. |
| Firewall | Slow zone | Every adjacent destination costs Runner +1 movement, for both paid movement and the free step. Multiple Firewalls may add their surcharges. |
| Repair Utility | Sustain | Spend 1 Ability to restore 2 Integrity to self or adjacent damaged ICE. |
| Reinforce Utility | Shield or wall | Spend 1 Ability either to grant 1 Shield to self/adjacent ICE or to create one temporary Lockdown marker (Section 3). |
| Sanitise Utility | Territory control | Spend 1 Ability to turn one adjacent eligible Runner backdoor into a Corp-secured cell. |

The initial implementation should prefer clear, distinct roles over adding more unit types. A later content pass may add dedicated turret or trap units only if these roles still feel too similar after playtesting.

## 3. Timed Lockdown marker

The Reinforce Utility can spend 1 Ability to create a **Lockdown** marker on one eligible cell within one orthogonal step of that Utility.

### 3.1 Placement

A Lockdown target must be:

- an existing path cell controlled by the Corp;
- empty of units and other Lockdown markers;
- not the Gateway, Core, or a Data Node;
- inside the board.

Creating a Lockdown does not change cell ownership or delete the underlying path.

### 3.2 Effect and expiry

- While active, the marked cell is impassable to the Runner.
- Adjacent destinations cost the Runner +1 movement, in addition to Firewall surcharges.
- Corp ICE may enter or leave the marked cell normally.
- A Lockdown lasts for **two Corp action phases**, then expires during the next system tick. Reapplying it refreshes its expiry but does not stack another wall or surcharge.
- The board, action panel, and event log must show the remaining duration as `2 turns` / `1 turn`.

The marker is intentionally temporary. It can delay a route or hold a corridor, but it cannot permanently remove a Data Node or victory location from the board.

## 4. Runner Code Block

The Runner may spend **2 Code** to place a single backdoor block when a full six-cell compilation cannot provide a useful route.

### 4.1 Command

Call the action `codeBlock` in the rules engine and event log. It may be used at most once during each Runner action phase and does not consume the normal one-die compilation slot.

The target must be:

- an empty, in-bounds cell orthogonally adjacent to any Runner-controlled path cell;
- free of units, existing paths, Gateway, and Core;
- allowed to contain a Data marker, in which case the marker remains visible and breachable later.

On success, the target becomes one Runner backdoor cell. The Code resource is spent, no die is removed from the loadout, and the action does not itself start Intrusion. Entering Corp territory, Corrupting a cell, attacking, or attempting a breach still follows the existing Intrusion triggers.

### 4.2 Interaction with Corp control

Code Block is a route-extension tool, not a bypass:

- Firewall surcharges apply to entering or leaving the new route as usual.
- A Lockdown cell remains impassable to the Runner.
- Corp Sanitise may convert the new backdoor when its normal target rules are satisfied.
- Code Block cannot overwrite an existing cell or remove a Corp unit.

The UI must show the 2-Code cost, every legal target, and any Firewall/Lockdown surcharge before confirmation. If no full net placement is legal but at least one Code Block target exists, the action remains available and is called out in the dice tray.

## 5. Turn and state requirements

The implementation will need explicit, serializable state for:

- whether the Corp's free patrol has been used this action phase;
- each timed Lockdown marker, its source, and its remaining Corp-turn duration;
- whether the Runner's Code Block has been used this action phase.

All three flags reset at the appropriate action phase and cannot be restored by refresh or reconnect. Replays must include the accepted commands and reconstruct marker expiry deterministically.

## 6. Accessibility and feedback

- Add a visible **Patrol** action for Corp when a legal free destination exists, including a `1 free step` indicator.
- Highlight Sentry's range-2 targets and label the attack range in the action panel.
- Show Lockdown markers as solid, high-contrast cell overlays with a countdown and a plain-language tooltip: `Runner cannot enter · adjacent cells +1 movement`.
- Add a **Code Block** action with the `2 Code` cost and a target preview. Keep it available before or after compilation and paid movement, subject to the once-per-turn flag.
- Announce successful placement, expiry, blocked entry, and insufficient resources through the existing status region and event log.
- Preserve keyboard and touch access from the iteration 02 usability revision.

## 7. Required tests before implementation is considered complete

Rules tests must cover:

- Corp free patrol is optional, once per action phase, secured-cell-only, and cannot move Firewall or exceed the ICE cap.
- One Corp Move grants 3 Command Points; paid movement remains immutable on rejection.
- Sentry can attack range 2; other basic attacks keep their existing range and one-attack limit.
- Firewall surcharge applies to paid movement and Runner free step; multiple sources add predictably.
- Reinforce creates a Lockdown only on eligible cells, spends exactly 1 Ability, blocks Runner entry, adds adjacent surcharge, and expires after two Corp phases.
- Lockdown refresh does not stack; Core, Gateway, Data, occupied, and Runner-owned targets are rejected.
- Code Block spends 2 Code, creates exactly one Runner cell, preserves a Data marker, works when no full net fits, and can be used only once per Runner action phase.
- Code Block cannot overlap paths/units or ignore Lockdown; Corp Firewall and Sanitise still interact with it.
- Refresh/replay reconstructs patrol, Code Block, and Lockdown state without a second use or early expiry.
- Online commands reject stale or illegal control actions without mutating the saved room.

## 8. Tuning questions for playtest

The first implementation should keep these as named constants so they can be tuned without redesigning commands:

| Parameter | Starting value | Question |
| --- | ---: | --- |
| Corp Command Points per Move | 3 | Does Corp reposition enough without flooding the board? |
| Free patrol distance | 1 cell | Is the mobility floor useful when the network branches? |
| Sentry attack range | 2 orthogonal | Does this create threat without making approach impossible? |
| Code Block cost | 2 Code | Is the escape valve reachable but not automatic? |
| Lockdown cost | 1 Ability | Does Corp have to choose between wall, shield, and other utility? |
| Lockdown duration | 2 Corp phases | Is the timer long enough to matter but short enough to avoid a permanent lock? |

Balance is not accepted from these numbers alone. The event log and physical-device playtests should report dead turns, blocked routes, average ICE survival, Code Block use, Lockdown expiry, and both victory rates before values are made permanent.

## Non-goals

- No new die symbol or additional dice faces.
- No permanent walls, invisible traps, or effects that delete a path.
- No full line-of-sight, facing, overwatch, or reaction-chain subsystem in this pass.
- No AI, matchmaking, account, or room-version compatibility work beyond the existing single-ruleset closure policy.
