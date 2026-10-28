# Split Throw off-hand audit

Static inspection, 28 October 2026. Current S14 data and native DLLs; launch ProjectDiablo addresses below map into the updated build. No runtime damage experiment was performed.

## Results

Inactive off-hand weapon combat stats must not be treated as shield stats. Native D2Game weapon-stat merging calls D2Common through thunk 6FC2A8C2 (IAT 6FD185C0; actual current ordinal 10164), resolving to D2Common 6FD8AC90. Do not use vanilla-reference ordinal 10523: current DLL ordinals are different.

D2Common 6FD8AC90 switches lists between active/inactive status using flag 40000000. Inactive-list routine 6FD8A030 iterates stats and subtracts those carrying the ItemStatCost damage-related bit; the test is at 6FD8A0C5–D1. Noncombat stats remain attached. D2Game 6FC57540 and onward performs weapon-list selection/merging. PD2 missile critical handler explicitly selects the currently applicable weapon before rolling.

S14 ItemStatCost marks Astreon-relevant stats damage-related: IAS93, Damage+111, percentage AR119, magic damage min/max52/53, CB136 and slow150. Local weapon ED is also not shield off-weapon ED. Thus the inactive Astreon is not a transferable +125 damage / 33CB / 40IAS package. Damage+ property is `dmg`, writing item_normaldamage111; Properties notes column 89 is not its stat ID. The missile physical builder does not directly add stat111, which is additional evidence against assuming a universal Damage+ bonus but is not itself a complete proof of all derived-stat paths.

Lance Guard shield bonuses: DS25–35, DS multiplier25, dex12–16. Phoenix shield ED250–300. Shield stats do not undergo the inactive weapon damage-related exclusion. A shield may therefore supply offensive stats that the same stats on an inactive second weapon do not.

Aura-equipped weapons are a separate case: an aura can grant owner bonuses without the weapon being used to strike. Speed base/dual-wield timing is separate from transferring printed off-hand IAS; do not assert that an off-hand weapon cannot affect animation timing.

Optimization: do not promise Lance Guard always beats Phoenix. High Warshrike CS leaves fewer failed-CS rolls for DS, reducing the marginal value of Lance Guard. Compare actual crit, ED, shield jewels and final attack breakpoint. Skill synergy damage and mastery provide substantial off-weapon ED; aura and curse setup must also be held constant.
