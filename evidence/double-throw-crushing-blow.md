# Double Throw Crushing Blow — S14 launch trace

Snapshot: analysis/s14-launch-2026-10-25.

Event callback table in D2Game at preferred VA 0x6FD277A8, slot 16 originally points to vanilla 0x6FCCCC30. ProjectDiablo registration at 0x1036C43A replaces slot 16 with 0x10346B10. Thus vanilla fractions must not be substituted for this patch.

Relevant launch handler locations:
- 0x10346BF5: stat 136 (item_crushingblow), combined with applicable item/skill event stats; random roll modulo 100 at 0x10346C48–5C.
- 0x10346C62: default divisor 8.0 from 0x1044FAB0.
- 0x10346C91: target primeevil predicate; special monster-ID sets checked by 0x10371400. Special set divisor 30.0; other Prime Evil divisor 70 + (100 - current HP percent) * 10.
- 0x10346CE6–D28: monster player-count life bonus divided by 50 added to the Prime Evil divisor when positive.
- 0x10346D38–D6D: missile event 6 multiplies divisor by 1.5 outside PvP-map-specific branch; PvP branch instead multiplies by 2.
- 0x10346DC3–DDE: stat 268 (item_crushingblow_efficiency), including applicable item helper contribution.
- 0x10346DE0–E30: current HP divided by divisor / (1 + effectiveness/100).
- 0x10346DF4 and 0x10346E36–E80: reads target physical resistance stat 36; rejects resistance >=100, applies resistance to computed CB damage. This path does not read attacker physical-pierce stat or skill ED.
- No 65%-remaining-life cutoff appears in this callback.

Double Throw initial and bounce missiles are weapon-source missiles. Bounces use the ordinary successful-missile damage event path, so each qualifying successful contact can trigger CB. Potential 16 contacts per paired throw must not be equated to 16 hits against one target or 16 guaranteed CB rolls: misses, block, collision delay, target availability and chain termination matter.

Single-player, no special skill modifier, PvE examples before resistance: normal ranged divisor 12; ordinary Prime Evil ranged divisor 1.5 * (70 + 10 * missing-life percentage points). At full life this is 105; at half life 855. Special-boss sets require separate classification; do not assign every map boss the same divisor.

These are file/code-derived mechanics, not measured damage from a runtime test.
