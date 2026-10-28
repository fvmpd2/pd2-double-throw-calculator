# Double Throw model — S14, checked 28 October 2026

This is a personal calculator with explicit, editable inputs. It does not claim to reproduce every runtime collision, item proc or rounding boundary. Values default to an illustrative build, not your imported character. Skills include equipment/Battle Command already; synergy fields are hard points.

## Weapon and direct damage

Each hand has its own base, local ED, flat min/max, ethereal flag, IAS, elemental damage and combat modifiers. Ethereal increases the base by 50% with truncation before local ED. Local flat damage follows local ED. A separate maximum-damage-per-level field adds floor(rate × character level) in base mode; printed-range mode assumes it is already included. Printed-range mode takes the item's final **throwing** min/max directly; no second ethereal/ED application. Use this mode for unusual per-level or asymmetric local ED rolls. Base type supplies the actual S14 throwing values and 75/75 strength/dexterity coefficients; printed mode allows coefficient/WSM overrides.

Shared gear flat min/max is added to each selected weapon, then off-weapon ED is applied: attributes + mastery + skill ED + Battle Command + eligible aura ED + matching demon/undead ED + manually entered other ED. Weapon-local ED and combat stats from the opposite hand are excluded. All displayed endpoint calculations approximate fixed-point roll rounding; they do not enumerate the game's complete random distribution. Mixed min/max ED jewel bugs and opaque item-specific derived stats should use an observed/printed range.

Throwing Mastery ED: 30 + 5 × (level − 1). Mastery crit uses the game's diminishing formula, parameters 0/35. Double Throw ED: 45 + 8 × (level − 1) + 6 × (Double Swing + Frenzy hard points). Battle Command damage: 20 + 3 × (level − 1). Party aura recipients receive aura columns only; own equipped auras additionally receive their passive column, per the earlier aura audit. Aura levels are assumed active, effective and in range. Enter only the winning source of each aura.

Crit and DS affect physical damage only. Crit is rolled first and capped at 75%. DS is rolled only on failed Crit and capped at min(100, 75 + maximum DS). Defaults: Crit ×2, DS ×1.5; multiplier bonuses add. Average = (1−C−(1−C)D) + C×CM + (1−C)D×DM. Chance to roll either is C + (1−C)D. CB and OW roll separately.

Direct elemental damage has its own mastery/resistance/pierce inputs. Its physical ED and Crit/DS multiplier are absent. Poison accepts a **combined equipped** rate and base duration per hand, rather than guessing raw poison-source length averaging. The explicit poison-duration model applies half poison pierce to PLR; it is an editable modelling assumption, not a newly verified poison-duration audit. Poison refresh is not modelled as unlimited additive casts and is excluded from direct DPS.

Flat Damage +X (stat111) is not presumed to add universal throwing damage: the audited missile builder does not directly add it. Do not put an unverified Damage +X value into shared flat damage. If an item has a verified contribution already included in its printed throw range, use that range. Chance-to-cast spells, splash, target-specific scripted modifiers, damage conversion/absorb, PvP and leech are not simulated. Manual hit/application chance can represent special avoidance/defense behaviour.

## Resistance, CB and bleed are different paths

Amp uses 14 + level + floor(Curse Mastery hard points / 2). Other breaking reductions are entered separately, as magnitudes. Each source is halved/truncated against original immunity. With multiple other sources on an immune target, enter their already-combined effective reduction carefully: the one aggregate box cannot preserve each source's separate odd-number rounding. Item physical pierce cannot break immunity. Ordinary hits and OW halve negative effective physical resistance with truncation and use a −100 floor in the ordinary-hit model.

**CB ignores item pierce**, uses the target's physical resistance after curses, and is not multiplied by ED or Crit/DS. Its raw negative resistance is not given the ordinary damage half-negative adjustment in this model, following the callback read. Ranged divisor is 1.5 × [8 + player-count HP bonus / 50] for ordinary monsters, 1.5 × [70 + 10 × missing life percentage points + bonus / 50] for ordinary Prime Evils, or 1.5 × [30 + bonus / 50] for the verified special set. Player-count HP bonus is 70 × (players − 1) for 1–8 players. Enter actual maximum HP, including existing multiplayer/map scaling; it is not multiplied again. CB damage = current HP / divisor × (1 + efficiency/100) × resistance factor. The result is capped to current HP. No 65%-life cutoff was found. Never infer the special set merely from a monster being a map boss.

The CB DPS display is a snapshot at the selected HP percentage, not sustained damage as life falls. Two expected per-hand procs are summed at that snapshot; it is not an exact stochastic HP trajectory.

OW is one source's bleed state: up to 3 stacks, shared expiry 125 frames (5 seconds), refreshed on a successful proc. A proc at three stacks refreshes without adding a fourth drain. Deep Wounds uses its EMax tiers and Grim Ward synergy from Skills.txt; its chance is 5 + floor(level/2). The launch callback computes frame drain in 1/256 HP as level scaling + **40** + 5 × total Deep Wounds/item damage stat, then physical resistance/pierce. The +40 is explicit at launch VA 1034661D (different from an older reference's +25). Level scaling uses [9,18,27,36,45] over bands ending at 15/30/45/60; the first four values are at 1044FDD0 and 45 is placed on the stack at 103465F8. Reported item/skill damage-stat values are not automatically equal to final DPS.

The window model tracks stack/expiry probabilities and expected drain for one attacker against one target, starting without bleed. It uses independent hit/proc chances for the two original throws; it excludes other attackers, extra bounce contacts, target death, travel time and time spent moving. Different hands can add different bleed drains. Refreshing is modelled rather than summing full 5-second damage per throw. This is an expectation model, not a kill-time simulation.

## Timing and bounces

PD2 picks the faster weapon from −WSM + local IAS, ties choosing hand B. Its IAS + other gear IAS + 2 × Increased Speed hard points go through EIAS = floor(120×IAS/(120+IAS)). Add Frenzy skill speed, Fanaticism and other speed; subtract WSM and the sequence adjustment 30, then clamp speed 15–175. Double Throw sequence 15 has 12 records; throws occur at records 5 and 9. Pair frames = ceil(12×256/rate) − 1, rate = floor(256×speed/100). This is the full paired throw, not frames per individual missile. Observed-frame override is available. Frenzy assumes the selected active buff is fully charged; skill ED is not copied from Frenzy into Double Throw.

Contacts per stream are capped at min(3+floor(level/3),8), including the first. Thus at most 16 contacts per pair; no guaranteed 16 hits on one target. Projectile Pierce does not add straight penetration/bounces. The two original projectiles use their own weapons. Bounce creation and impact can use the current skill/animation's weapon selector. Choose original-stream hand or all A/all B as explicit sensitivity scenarios; none establishes live selection.

The static-code audit predicts skill ED applications [2,1,…,1,0] for a completed chain, because the child-creation handler appears to add ED to the old missile before its damage is filled. A standalone initial contact with no child has one application. The pack table defaults to this **static prediction**, with a uniform-ED alternative. It assumes all selected contacts are reached and share the entered target conditions; hit chance reduces damage but does not stochastically terminate the assumed chain. It excludes CB/OW from pack totals.

## Evidence

- [Double Throw audit](evidence/double-throw-mechanics.md)
- [Crushing Blow audit](evidence/double-throw-crushing-blow.md)
- [Inactive off-hand combat-stat audit](evidence/split-throw-offhand.md)
- [Table hashes / formulas](evidence/provenance.json)
- [PD2 IAS reference and extracted sequence](https://roofooevazan.github.io/pd2-ias-calc/) and [PD2 Advanced Stats](https://github.com/RoofooEvazan/pd2-advanced-stats) were used as cross-checks, not as a replacement for the supplied launch code when it differs.

The 28 October installed update's relevant TXT records matched launch. No new combat-code change was confirmed by that comparison; this is not a semantic proof of all DLL behaviour. Static findings, especially bounce ordering/selection, still need controlled runtime measurements.

## Stutter step versus continuous throwing

The visible playstyle comparison uses the user-specified scenarios: main-hand stats for a stutter-step bounce and a 50/50 mean of both hands for continuous throwing. Select which weapon is the main hand. It compares one successful intermediate bounce before/after resistance, plus an expectation including each hand's hit/block chance, and the final-bounce result. Intermediate contacts have one copy of skill ED; audited final contacts have zero (uniform mode retains one). It does not assert how many projectile streams survive, nor compare movement-adjusted DPS. Initial throws, the pack estimate and on-hit-effect models remain separate. These selector scenarios are assumptions, pending live tracing.
