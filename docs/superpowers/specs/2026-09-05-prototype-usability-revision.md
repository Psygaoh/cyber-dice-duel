# Cyber Dice Duel — Prototype Usability Revision

**Status:** Requested; implementation pending
**Date:** 2026-09-05
**Applies to:** The deployed browser prototype and the rules baseline in `2026-09-05-cyber-dice-duel-design.md`

## Goal

Make the board state, dice flow, unit identities, Runner actions, and victory conditions understandable without requiring the player to scroll away from the game or learn the interface by trial and error.

This revision keeps the existing loadouts and dice-face distributions. The Runner instead gains one predictable free step each turn. This improves minimum mobility without changing the probability of Move, Deploy, or Ability results across the Runner roster.

## 1. Persistent dice access

- The active player's dice tray must remain reachable from the board and action view at all times.
- On desktop, use a viewport-anchored tray or compact drawer. Opening it must not require scrolling to the bottom of the document.
- On narrow screens, use a persistent bottom handle that expands into a touch-friendly tray.
- The compact state must show the current phase, selected-dice count, rolled results, and whether compilation is available.
- Expanding or collapsing the tray must preserve selection, placement, and inspection state.
- Dice controls must have visible keyboard focus and a minimum 44 × 44 CSS-pixel touch target.

## 2. Keyboard controls

Shortcuts mirror visible controls and only run when their action is legal. They do not fire while the player is typing in an input, textarea, or select.

| Key | Action |
| --- | --- |
| `?` | Open the play recap and shortcut reference |
| `D` | Focus or toggle the dice tray |
| Arrow keys | Move focus among dice or board cells, depending on the focused region |
| `Space` | Select or clear the focused die |
| `R` | Roll the selected dice during dice selection |
| `L` | Lock rolled results |
| `Q` / `E` | Rotate a deployment 90° counterclockwise / clockwise |
| `M` | Enter Move targeting for the selected unit |
| `A` | Enter Attack targeting for the selected unit |
| `C` | Enter the Runner's Corrupt action or a Corp Utility action |
| `B` | Breach the Data Node under the Avatar when legal |
| `Escape` | Cancel the current targeting mode or close the topmost popup |

The interface must display the relevant shortcut beside each visible action. Disabled actions remain disabled when invoked from the keyboard. Ending a turn has no single-key shortcut because it passes control to the opponent.

## 3. Play recap

- Keep a persistent **How to play** control in the top-right corner of the game view.
- `?` opens the same popup.
- The first screen is a concise role-aware recap that fits without scrolling at common desktop sizes:
  - Runner: breach any two Data Nodes, then return to the Gateway.
  - Corp: crash the Avatar or reduce the Intrusion Window to zero.
  - Turn loop: choose dice, roll, optionally reroll, lock, optionally unfold, act, end turn.
  - Current movement costs and the Runner's free-step availability.
- A secondary **Full field guide** action exposes detailed symbols, Programs, ICE, combat, and cube nets.
- The popup includes the keyboard reference and returns focus to the control that opened it.

## 4. Data Nodes are traversable tiles

- Each Data Node must have a solid tile background at the same elevation as path cells. It must never read as a hole, pedestal, or impassable object.
- Once connected by a path, its cell is traversable under normal movement rules and participates in legal-path highlights.
- The Data marker sits above the solid tile and remains visible after the cell changes ownership or is breached.
- Ownership tint, Data identity, breach state, and movement highlight must remain distinguishable from one another.

## 5. Runner free step

At the start of every Runner action phase, the Avatar receives one free orthogonal step.

- The step may enter any adjacent, connected, unoccupied path or Data cell.
- It ignores that destination's normal backdoor or secured-cell entry cost. Explicit surcharges from Firewall or another named effect must still be paid.
- It uses the normal collision, connectivity, and board-boundary rules.
- It may be used before, between, or after movement bought with Move resources.
- It cannot be stored, transferred, or used more than once in a Runner turn.
- The movement display must show whether the free step is available or spent, separately from paid Mobility Points.

## 6. Bidirectional deployment rotation

- Deployment controls expose separate counterclockwise and clockwise buttons.
- Both buttons update the net preview, degree label, legality result, and board ghost immediately.
- `Q` and `E` invoke the same commands.
- Four turns in either direction return to the initial orientation; rotation never reflects a net.

## 7. Unit names and visual identity

- Hovering a unit shows a label next to that unit with its name, category, current Integrity, and maximum Integrity. Keyboard focus and touch selection expose the same information.
- The board footer may repeat the information but is not the only place where the unit name appears.
- The Avatar, Sentry, Hunter, Firewall, and three Utility ICE types require distinct silhouettes at gameplay zoom.
- ICE types also receive a persistent base glyph or pattern so identity does not depend on colour alone.
- Selected, targetable, damaged, and hostile states are overlays on the unit's identity rather than replacements for it.

Minimum silhouettes:

| Unit | Readable shape cue |
| --- | --- |
| Avatar | Low, radial eight-armed voxel octopus |
| Sentry | Broad guard profile with a forward visor |
| Hunter | Narrow, forward-leaning pursuit profile |
| Firewall | Wide, immobile wall or shield profile |
| Repair Utility | Tool-arm or cross-shaped service profile |
| Reinforce Utility | Layered armour or projecting-shield profile |
| Sanitise Utility | Antenna or scanning-array profile |

## 8. Runner coding and compilation feedback

Runner actions that represent coding must be easier to discover and target.

- When compilation is available, the dice tray expands or raises a persistent callout, and every eligible Deploy die receives a strong animated outline.
- Starting compilation keeps the chosen die and cube net visible while the board shows a high-contrast six-cell ghost and marked origin.
- The placement panel keeps both rotation controls and the final **Unfold here** action visible throughout targeting.
- Corrupt and Breach show their Ability cost before activation and highlight every legal target on the board.
- Hovering or focusing a legal target previews the result in plain language.
- A successful compile, Corrupt, or Breach uses a short code-stream effect connecting the Avatar or die to the affected cells. Reduced-motion mode replaces movement with a high-contrast state flash.
- Success and rejection feedback is visible beside the action and announced through the existing live status region.

## Acceptance checks

- At 1366 × 768 and 390 × 844, a player can inspect and choose dice from the game view without scrolling to the end of the page.
- A keyboard-only player can select dice, roll, reroll, lock, rotate and place a net, move, attack, Corrupt, Breach, cancel, and open the recap.
- The recap states both victory conditions and the complete turn loop within its first screen.
- Data Nodes remain solid and traversable in both 3D and accessible-grid views.
- Rules tests prove the free step resets once per Runner turn, cannot be reused, respects collision and explicit surcharges, and composes correctly with paid movement.
- Every unit type can be identified by silhouette or base glyph at the default camera distance, and its name is available by hover, focus, or touch selection.
- Compilation and Runner Ability actions expose legal targets, costs, previews, success, and failure without relying on the event log.
