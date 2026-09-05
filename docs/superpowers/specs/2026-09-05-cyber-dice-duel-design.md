# Cyber Dice Duel — Prototype Design

**Status:** Proposed prototype baseline  
**Date:** 2026-09-05  
**Scope:** Core gameplay and implementation boundaries for the first playable browser prototype

## 1. Product vision

Cyber Dice Duel is an asymmetric two-player tactical browser game inspired by the spatial dice mechanics of *Dungeon Dice Monsters* and the attacker-versus-defender tension of cyberpunk intrusion fiction.

One player is the **Runner**, a hacker infiltrating a corporate network to steal visible Data and escape. The other is the **Corp**, which constructs secured infrastructure and deploys ICE to contain or crash the Runner.

Every turn begins with custom dice. Dice results create resources, while successful deployment rolls let a die unfold into a six-cell network path. The board therefore grows during play. Randomness represents the instability of the Matrix and the difficulty of compiling code under pressure; stored resources and paid rerolls keep that randomness tactical.

The prototype must balance two equally important decision spaces:

1. **Dice economy:** selecting dice, accepting or rerolling results, storing symbols, and timing abilities.
2. **Territory:** constructing routes, controlling cells, moving units, and flipping network ownership.

## 2. Design principles

- **Shared language, asymmetric outcomes.** Both roles use the same turn structure and symbol vocabulary, but their dice distributions, pieces, and tactical goals differ.
- **One agile intruder versus distributed defence.** The Runner controls one mobile Avatar; the Corp controls several slower ICE units.
- **Visible objectives.** Data locations are public. Decisions come from routing, timing, resource use, and board control rather than hidden objective tokens.
- **Randomness with agency.** Rolls constrain plans, but stored Code can buy a reroll.
- **The board is contested.** Backdoors and secured cells change movement costs and can be flipped individually.
- **Short, tunable prototype.** Initial values are configuration, not permanent balance decisions.
- **Original presentation.** Terminology, art, interface, units, and fiction must remain original rather than reproducing Yu-Gi-Oh! or Netrunner assets or branding.

## 3. Roles and victory conditions

### 3.1 Runner

The Runner begins at the **Gateway** with one **Avatar**.

The Runner wins immediately after:

1. breaching any two of the three Data Nodes;
2. carrying the two acquired Data;
3. returning the Avatar to the Gateway.

The Runner has only this victory condition, but has several ways to improve the attempt: construct shortcuts, corrupt secured cells, install Programs, destroy ICE, and recover time by breaching Data Nodes.

### 3.2 Corp

The Corp begins at the **Core** with secured infrastructure and one basic Sentry ICE.

The Corp wins immediately if the Avatar's Integrity reaches zero.

The Corp also wins when the Intrusion Window reaches zero at the system tick, unless the Runner has already completed extraction during that turn.

## 4. Board and initial scenario

The prototype uses a rectangular **15 × 11** orthogonal grid. Coordinates are zero-based, with the Runner on the left and the Corp on the right.

Permanent locations:

- Gateway: `(0, 5)`
- Corp Core: `(14, 5)`
- Data Node A: `(10, 2)`
- Data Node B: `(11, 5)`
- Data Node C: `(10, 8)`

Initial Runner backdoor cells:

- `(1, 5)`, `(2, 5)`, `(2, 4)`, `(2, 6)`, `(3, 4)`, `(3, 6)`

Initial Corp secured cells:

- `(13, 5)`, `(12, 5)`, `(12, 4)`, `(12, 6)`, `(11, 4)`, `(11, 6)`

A basic Sentry ICE begins at `(13, 5)`. The Runner takes the first turn.

Data Nodes are permanent markers on grid coordinates. A path may be placed over an unconnected Data Node, making it part of the traversable network without removing the objective.

## 5. Match phases and clock

### 5.1 Recon phase

The match begins in Recon. The Intrusion Window does not decrease while the players construct their initial networks.

The Corp's ability to deploy and bank resources makes indefinite Runner stalling strategically disadvantageous. The prototype will record Recon length; a hard Recon limit is deliberately excluded until playtests show that one is needed.

### 5.2 Intrusion phase

Intrusion begins when the Runner performs any of the following for the first time:

- enters a secured Corp cell;
- corrupts a secured Corp cell;
- attacks an ICE;
- attempts to breach any Data Node.

When triggered, the Intrusion Window is set to **12**. The triggering round does not reduce it. Starting with the following system tick, it decreases by one after every complete round.

Successfully breaching a Data Node restores **2** rounds, up to the maximum of 12. Each Data Node grants this restoration only once.

## 6. Dice loadouts and symbols

Each player has a **12-die loadout**. Every die:

- is associated with one deployable Program or ICE;
- contains exactly six faces;
- references one connected six-cell path pattern;
- remains available until compiled;
- leaves the loadout for the rest of the match after compilation.

Both roles use the same six face types:

| Symbol | General purpose |
| --- | --- |
| Deploy | Contributes to compiling one rolled die |
| Move | Generates movement for the Avatar or command points for ICE |
| Attack | Pays for attacks |
| Guard | Prevents damage or activates defensive effects |
| Code | Pays for a reroll |
| Ability | Pays for breaches and role-specific abilities |

Runner dice favour Move, Code, and Ability. Corp dice favour Deploy, Guard, and Attack. Individual units and Programs are balanced through face distribution, stats, and activation costs rather than die levels.

### 6.1 Roll procedure

At the start of a player's turn:

1. Choose three available dice from the loadout.
2. Roll all three.
3. Optionally spend one Code stored before the current roll to reroll one die.
4. Lock the final results.
5. If at least two dice show Deploy, optionally compile one of the dice showing Deploy.
6. Add every non-Deploy final result to its matching persistent resource pool.
7. Return all rolled but uncompiled dice to the loadout.

Only one die may be compiled per turn. Deploy faces used or unused during resolution are not stored.

Each resource pool is capped at **9**. Results above the cap are lost. Resources remain between turns until spent.

## 7. Compiling and path placement

A compiled die unfolds into its associated six-cell path pattern.

A cube has exactly **11 distinct valid six-cell nets**. The prototype catalogs them as `NET-01` through `NET-11`, and every die references one of these validated patterns.

The authoritative visual reference is [The 11 valid cube nets](../../reference/cube-nets-reference.svg). Pattern data must use the same numbering and exact cell geometry as that reference.

Before placement, the pattern may be rotated in 90-degree increments but cannot be reflected. A placement is legal only if:

- every cell is inside the board;
- no cell overlaps an existing path, Gateway, or Core;
- at least one cell is orthogonally adjacent to a cell controlled by the deploying player;
- all six new cells remain connected through the pattern.

Every new cell begins under the deploying player's control:

- Runner cells become **backdoors**.
- Corp cells become **secured cells**.

Paths belonging to both players form one traversable network when they touch orthogonally. Units may cross between them by paying the relevant movement cost.

After a legal Runner compilation, the associated Program is installed or resolved. After a legal Corp compilation, the associated ICE is deployed on the pattern's designated origin cell.

If no legal placement exists, the player cannot compile that die and keeps it in the loadout. The Deploy results are still lost for the turn.

### 7.1 Prototype visual treatment

The deployment must visually preserve the physical logic of an unfolding cube:

- a six-sided die appears on the selected origin cell;
- its faces hinge outward in sequence;
- all six faces finish flat on the board as one connected cube net;
- the completed path is a thin tile layer on a simple rectangular grid, not elevated terrain;
- units remain small voxel miniatures standing on path cells;
- Data Nodes remain simple one-cell tokens;
- the prototype board has no surrounding city, cliffs, towers, decorative side structures, or environmental flourishes;
- gameplay UI is limited to clean screen-edge panels and does not obscure the grid.

The cyberpunk identity comes from colour, emissive circuitry, materials, units, particles, and UI—not from changing the board into a landscape.

## 8. Territory and cell flipping

Territory ownership belongs to individual path cells rather than the complete six-cell pattern.

- Runner effects **corrupt** secured cells into backdoors.
- Corp effects **sanitize** backdoors into secured cells.
- Flipping changes ownership and movement cost but never removes the physical path.
- Gateway and Core cells cannot be flipped.
- Data Node markers remain present if their path cell changes ownership.
- A cell occupied by an enemy unit cannot be flipped until that unit is destroyed or displaced.
- An effect must explicitly define its range and number of cells affected.

This creates a persistent territorial struggle without making a single effect reverse an entire six-cell deployment.

## 9. Runner rules

The Runner controls one Avatar. The Avatar never moves for free.

Spending one Move grants **4 Mobility Points** for the current turn:

- entering a backdoor costs 1 point;
- entering a secured cell costs 2 points;
- additional Firewall or ability costs are added to the destination cost;
- unused points expire at the end of the turn.

Multiple Move symbols may be spent in one turn. The Avatar may retrace cells and change direction, provided every step is legal.

Compiled Runner dice create paths and provide one of three Program types:

- **Exploit:** a one-use immediate or reactive effect, then discarded.
- **Daemon:** a persistent upgrade attached to the Avatar.
- **Payload:** an effect installed on a legal network cell and triggered later.

The Avatar has three Daemon slots. Installing a fourth requires discarding one installed Daemon.

Runner Exploits may create reaction windows during the Corp turn. For the prototype, at most one defending-player reaction may resolve in response to a single opposing action; reactions do not form chains.

## 10. Corp rules

The Corp controls multiple ICE units. ICE never moves for free unless an ability explicitly says otherwise.

Spending one Move grants **2 Command Points** for the current turn:

- moving an ICE one secured cell costs 1 point;
- entering a backdoor costs 2 points;
- Command Points may be distributed among different ICE;
- a movable ICE may travel at most two cells during a Corp turn;
- unused Command Points expire at the end of the turn.

ICE categories:

- **Sentry:** stationary or extremely limited patrol; protects a location.
- **Hunter:** mobile ICE able to pursue the Avatar.
- **Firewall:** immobile ICE that blocks or increases traversal costs.
- **Utility:** repairs ICE, reinforces cells, or sanitizes backdoors.

An ICE's card definition can further restrict movement. Corp movement must support activating more than one ICE in the same turn when enough Command Points are available.

## 11. Actions, combat, and damage

After dice resolution and any compilation, the active player may spend stored resources in any legal order.

Basic combat rules:

- attacks target an orthogonally adjacent enemy;
- one Attack resource activates one basic attack;
- a unit can make at most one basic attack per turn unless an ability says otherwise;
- an attack deals damage equal to the attacker's Power;
- the defender may spend Guard resources during the response window;
- each Guard prevents 1 damage unless an ability states a different value;
- damage reduces the target's Integrity;
- an ICE at zero Integrity is deleted from the board;
- an Avatar at zero Integrity immediately loses the match.

Deleting a unit does not delete or change ownership of the cell beneath it.

The initial stat scale should remain small: typical Power from 1–3, ICE Integrity from 1–5, Avatar Power at **2**, and Avatar Integrity at **8**. These values are configuration and require playtesting.

## 12. Data breach and extraction

A Data Node can be breached when:

- the Avatar occupies its connected path cell;
- that node has not already been breached;
- the Runner can spend **2 Ability** resources.

Breaching immediately:

1. marks the node as breached;
2. gives the Runner one Data;
3. restores two Intrusion rounds, capped at 12;
4. opens a reaction window for eligible Corp effects.

After collecting two Data, the Runner must return to the Gateway. Entering the Gateway with two Data completes extraction immediately, before the system tick.

Data cannot be dropped or stolen in the first prototype.

## 13. Turn and round sequence

A complete round contains:

1. **Runner turn**
   - Choose and roll three dice.
   - Optionally reroll.
   - Resolve symbols and optional compilation.
   - Take actions in any legal order.
   - Resolve end-of-turn effects.
2. **Corp turn**
   - Choose and roll three dice.
   - Optionally reroll.
   - Resolve symbols and optional compilation.
   - Take actions in any legal order.
   - Resolve end-of-turn effects.
3. **System tick**
   - Resolve round-based effects.
   - If Intrusion was active before this round began, reduce the window by one.
   - Check timeout victory.

The Runner acts first in every round for the prototype. Alternating initiative is outside the initial scope.

## 14. Prototype content scope

The first playable needs enough content to exercise the rules, not a complete collectible roster.

Runner content:

- two Exploit designs;
- two Daemon designs;
- two Payload designs;
- two copies of each die, for 12 dice total.

Corp content:

- one Sentry design;
- one Hunter design;
- one Firewall design;
- three Utility designs covering repair, reinforcement, and sanitization;
- two copies of each die, for 12 dice total.

Every content definition must be data-driven so stats, faces, patterns, costs, and effects can be tuned without changing board or turn logic.

## 15. Software boundaries

The gameplay rules must be independent from the rendering framework.

Recommended logical modules:

- **Game state:** board, ownership, units, resources, loadouts, objectives, phase, turn, and winner.
- **Commands:** roll, reroll, compile, place pattern, move, flip, attack, guard, activate ability, breach, and end turn.
- **Rules engine:** validates commands and produces deterministic state transitions.
- **Random source:** injectable and seedable; only dice rolling depends on it.
- **Content registry:** data definitions for dice, patterns, Programs, ICE, and scenario values.
- **Presentation layer:** renders state and dispatches commands without embedding rules.
- **Event log:** records rolls, commands, reactions, state changes, and victory for debugging and playtest analysis.

The first prototype is a local open-information duel. Accounts, backend persistence, network multiplayer, matchmaking, AI opponents, progression, monetization, and final audiovisual polish are explicitly outside this design.

## 16. Invalid actions and recovery

The rules engine must reject invalid commands without mutating game state and return a machine-readable reason suitable for UI feedback.

Examples include:

- insufficient resources;
- illegal path placement;
- movement through a disconnected or occupied cell;
- exceeding an ICE movement cap;
- targeting a non-adjacent enemy;
- breaching an unavailable Data Node;
- acting outside the current turn or response window;
- using a compiled die again.

A rejected command remains visible in development logs but does not enter the canonical gameplay event history.

## 17. Testing strategy

The prototype requires automated tests for:

- seeded dice rolls and paid rerolls;
- compilation eligibility and loadout removal;
- all rotations of the 11 valid cube-net patterns, with reflection rejected;
- board boundaries, overlap, and connectivity;
- asymmetric movement costs and per-turn caps;
- cell corruption and sanitization;
- combat, Guard prevention, deletion, and Avatar crash;
- Recon-to-Intrusion transitions;
- timer restoration, cap, and timeout;
- Data breach and extraction;
- rejection of invalid commands without state mutation;
- replaying an event log to reproduce the same final state.

Balance values require playtesting rather than unit-test assertions. The event log should expose average Recon length, Intrusion duration, dice rerolls, successful compilations, cells flipped, ICE deployed, damage dealt, Data breached, and winner.

## 18. Initial balance configuration

| Parameter | Initial value |
| --- | ---: |
| Board width | 15 |
| Board height | 11 |
| Dice per loadout | 12 |
| Dice rolled per turn | 3 |
| Deploy faces required | 2 |
| Compilations per turn | 1 |
| Resource pool cap | 9 |
| Code cost per reroll | 1 |
| Rerolls per turn | 1 |
| Runner Mobility Points per Move | 4 |
| Corp Command Points per Move | 2 |
| Maximum ICE movement per turn | 2 cells |
| Avatar Power | 2 |
| Avatar Integrity | 8 |
| Data required | 2 of 3 |
| Data breach cost | 2 Ability |
| Intrusion Window | 12 rounds |
| Time restored per Data | 2 rounds |
| Daemon slots | 3 |

## 19. Prototype success criteria

The baseline is successful when two players can complete a full local duel and:

- every turn offers a meaningful dice or board decision;
- both players expand and contest the same network;
- the Runner feels significantly more mobile than any individual ICE;
- the Corp can coordinate several slower units;
- bad rolls create pressure without commonly producing several dead turns;
- the Intrusion Window pressures the Runner after contact without punishing pre-contact deployment luck;
- both victory paths for the Corp and the extraction path for the Runner occur during testing;
- a match can be reproduced from its seed and event log.

The first playtest milestone should prioritize rule clarity and pacing. Content variety, advanced reactions, additional scenarios, and final balance come afterward.
