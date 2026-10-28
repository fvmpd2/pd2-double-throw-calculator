# PD2 Double Throw calculator

A personal S14 calculator for two throwing weapons: local stats, ethereal bases, shared equipment, skills, auras, IAS, physical/elemental damage, Crit/DS, Crushing Blow and Open Wounds.

- Separate inputs and damage breakdowns for each hand.
- Base + local-stat mode, or enter the item's printed throwing range.
- Stutter-step versus continuous bounce damage compares the selected main hand with the average of both weapons, before/after resistance.
- Direct DPS includes hit/block chance. CB is a current-life snapshot; OW models stack buildup/refresh over a time window.
- Bounce/pack scenarios expose the code-derived ED ordering and uncertain hand selection.
- Builds stay in the browser. Save/load JSON, automatic local save, or copy a build link.

Defaults are an example, not an imported character. Enter final skill levels including equipment/Battle Command; synergies are hard points. Do not add weapon-local bonuses again as shared gear.

See [mechanics, sources and limits](MECHANICS.md). Chance-to-cast spells, splash and exact runtime collision/weapon-selection histories are not simulated; the calculator does not claim every item proc is automatic.

Open `index.html` locally or host these static files on GitHub Pages. No install/build step.

```sh
node test.cjs
node browser-test.cjs # Playwright; optional PD2_BROWSER_PATH for browser executable
```
