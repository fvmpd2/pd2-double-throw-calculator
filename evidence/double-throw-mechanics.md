# Double Throw mechanics audit — S14 launch, 25 October 2026

Scope: the locally captured S14 launch ProjectDiablo.dll, native D2Game.dll/D2Common.dll and pd2data tables. These findings come from static code tracing, not an instrumented runtime damage test. Addresses below are preferred virtual addresses, not ASLR runtime addresses. No installed game files were changed.

## Main findings

| Component | Finding |
|---|---|
| Local weapon ED | Included through the selected weapon’s throwing min/max damage. Each weapon retains its own base damage. |
| Off-weapon ED, strength/dexterity | Included by the missile damage builder. Attribute coefficients come from the weapon. |
| Throwing Mastery ED | Explicitly included through passive_mastery_throw_dmg. |
| Damage to demons/undead | Included as conditional damage stats; applies to matching target types. |
| Double Throw skill ED | Apparent wrong-projectile write in the bounce handler; see ordering below. |
| Projectile Pierce | Not enabled on Double Throw missiles. Pierce chance does not grant straight penetration or additional bounces. |
| Critical Strike / Deadly Strike | Supported, with a fresh impact-time critical calculation. CS is checked first; DS only if CS fails. |
| −enemy physical resistance | Applied to ordinary physical missile damage and explicitly to Open Wounds. Does not itself break physical immunity. |
| Open Wounds | Successful missile-hit events can proc it, including bounces; separate bleed damage, not multiplied by skill ED or crit. |

## Skill and missile data

Double Throw (skill 140): SrcDam 128/128, server do function 154, weapon selection 3, two attack-sequence throws. Skill ED S = 45 + 8*(skill level - 1) + 6*(Double Swing hard points + Frenzy hard points).

Contact count: min(3 + floor(skill level/3), 8). The counter includes the first contact. At the cap, each of the two projectile streams has at most eight contacts: sixteen total, not sixteen per weapon. Contacts are not guaranteed successful damage hits.

Missiles 702/703/704: source damage 128, hit function 30, damage function 16, Pierce disabled, LastCollide enabled, NextHit enabled with NextDelay 1. Search radius parameter is 15 subtiles. Skill Calc3, the separately supported first-contact bonus, is zero.

## ED ordering and apparent defect

1. Initial creation at ProjectDiablo 0x103B1570 builds the missile, then adds S to its DAMAGEPERCENT stat at 0x103B167B.
2. Bounce handler 0x103A7A40 keeps the old missile in ESI. It creates the child at 0x103A7BF6 and saves the new pointer at 0x103A7BFB.
3. It evaluates S at 0x103A7C10, but pushes ESI at 0x103A7C1A into AddStat 0x1030BD30. The destination is the OLD missile, not the newly created child.
4. The new missile is used separately for the decremented bounce counter at 0x103A7C25–28.
5. Native collision calls the hit handler before filling damage: D2Game 0x6FC5F045, then 0x6FC5F06B. FillDamage applies missile DAMAGEPERCENT before crit at 0x6FC5A709–24.
6. The common missile builder replacement 0x102FEB20 includes owner ED, mastery and attribute bonuses, but has no implicit Double Throw Calc1 addition. The child has no copied parent damage origin.

Predicted S applications per contact:

| Contact | S applications |
|---|---:|
| Initial projectile, successfully creates child | 2 |
| Bounce projectile, successfully creates child | 1 |
| Final bounce, no child | 0 |
| Initial projectile, no child | 1 |

“Two applications” means twice the skill ED added to the same ED bucket, not twice final damage. With weapon physical damage 100, other ED 200%, and S=400%, expected pre-crit physical damage is 1100 / 700 / 300 respectively.

For a completed eight-contact chain with otherwise identical conditions, 2+1+1+1+1+1+1+0 = 8 applications. This redistributes skill ED toward the first contact rather than automatically increasing the whole chain’s total. Different targets, resistances, weapons, missed contacts or broken chains complicate that aggregate comparison.

This is a concrete suspicious pointer and call-order finding. A controlled fixed-damage runtime test remains necessary before describing measured damage or submitting a fully reproduced bug report.

## Gear, passives and hand selection

The custom builder 0x102FEB20 reads selected throwing min/max damage (stats 159/160), source fraction, owner DAMAGEPERCENT, strength and dexterity weapon coefficients, Throwing Mastery ED, min/max ED and conditional demon/undead ED. Relevant region: 0x102FEEB5–0x102FF130. Throwing Mastery stat selection is explicit in 0x10306940: selector 1 uses stat 346, selector 2 uses throwing critical chance stat 347.

The original paired throws use the attack sequence’s hand selection. Bounces are newly created owner-derived missiles, not immutable copies of the original weapon’s finished damage. The active skill/sequence hand can therefore affect which weapon builds a bounce. D2Game selector 0x6FC572C0 and the common equipped-weapon selector distinguish sequence frames. Moving or holding throw can change this context; do not promise a guaranteed stronger-weapon chain without logging the live selector.

No missing general gear/mastery ED path was found. This does not establish that every item-specific conditional modifier has been tested.

## Critical and Deadly Strike

Impact handler 0x10304910 resolves the owner and missile skill, then invokes 0x10304B60. 0x103806A0 finds the owner's skill instance; it is not a stored original-weapon pointer. 0x10304B60 selects the current applicable weapon via 0x10330CF0 before rolling.

Patch metadata redirects the native missile critical call operand at Game RVA 0x3A730 to thunk 0x103A3700 and removes the subsequent original doubling block at RVA 0x3A734. Therefore the old native 2x Deadly Strike block must not be used as the PD2 result.

At 0x10304A80:
- CS bucket = applicable mastery critical chance + passive critical strike + item critical chance, capped at 75%.
- Roll CS first.
- If it fails, roll DS, capped at 75% plus increased maximum DS.
- A hit receives either CS, DS, or neither; not both.

At 0x10304B60:
- CS multiplier = (200 + applicable critical multiplier bonus)/100.
- DS multiplier = (150 + applicable deadly-strike multiplier bonus)/100.
- Only the physical damage field is multiplied.

With C and D expressed as fractions, expected multiplier = 1 + C*(Mcs-1) + (1-C)*D*(Mds-1). Example C=.30 and D=.50, default multipliers: 1.475. Combined crit-event chance is 65%, but these events have different multipliers.

## Physical resistance reduction

Initialization at 0x1036C3C7 puts stat 425 (passive_phys_pierce) into the physical damage descriptor. Resistance function 0x10303290 reads attacker pierce and target physical resistance; helper 0x103025C0 halves negative effective resistance for player-origin damage, with integer rounding.

For a nonimmune monster, ignoring other special effects: subtract pierce from the target's physical resistance, then halve a negative result, before the resistance multiplier. Thus 50 resistance with 20 pierce becomes 30; 0 resistance with 20 pierce becomes -10. Pierce is an attacker modifier, not a lasting curse on the target. It does not independently break resistance >=100.

This read occurs at damage application, so do not assume every impact-time modifier is permanently snapshotted when the original weapon is thrown.

## Open Wounds

Event callback slot 15 is replaced with 0x10346560 (registration 0x1036C433). It rolls Open Wounds chance per qualifying successful hit. Bleed is based on the dedicated level/Deep Wounds damage calculation, including stat 501; it is not a percentage of the throw's physical damage.

At 0x10346732–75 the handler explicitly reads target physical resistance (36), attacker physical pierce (425), and halves a negative result. Thus -enemy physical resistance improves bleed against nonimmune targets. Flat physical damage reduction is not read by this bleed calculation. Weapon/skill ED, CS and DS do not multiply it.

The handler tracks Open Wounds state 62 for the source, increments stack count stat 189 up to three (0x103468D9–0x10346926), and reapplies the state. The application structure uses duration 125 frames (5 seconds), from constant 0x1044FF60 and state routine 0x1036D940. Repeated contacts sustain the bleed; they do not create unlimited independent stacks.

Crushing Blow is a separate callback: it reads target physical resistance but not attacker stat 425. Do not transfer the normal-hit/OW pierce behavior to CB.

## Most useful runtime checks still outstanding

1. Fixed equal min/max weapons, remove critical chances, fixed-resistance high-life targets, compare first, intermediate and terminal contacts. This tests the suspected skill-ED destination and ordering.
2. Repeat with highly unequal weapons while logging sequence frame and selected hand at initial creation, child creation and impact. This settles animation-dependent weapon/stat selection without visual guesses.
3. Isolate positive physical resistance, compare pierce on/off for ordinary damage and for bleed alone; separately isolate Crushing Blow.
4. Compare Pierce 0 versus 100 with identical target placement; count child creation events, not apparent projectile graphics.
5. Log impact critical outcomes to verify per-contact rolls and local weapon critical multipliers under changing animation state.
