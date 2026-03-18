# Grim Hollow Expeditions — MVP Idea Prompt

## Project summary

Build a browser-based dark fantasy action crawler inspired by Diablo, but scoped for a realistic solo or small-team web MVP.

The game should be built with:
- TypeScript
- React
- React Three Fiber (r3f)
- Zustand
- Vite

Optional libraries:
- `@react-three/drei`
- Rapier for collision / hit volumes if helpful

The goal is **not** to make a full Diablo clone.
The goal is to make a **small, polished, room-based, run-based action loot crawler** that feels good within a short session and is technically maintainable.

---

## Product vision

The player descends into cursed crypts beneath a ruined cathedral, clearing compact combat rooms, collecting randomized loot, defeating elites and a boss, then returning to a hub with resources for persistent upgrades.

Target feel:
- dark fantasy
- punchy and readable combat
- strong loot excitement
- short replayable runs
- highly shareable as a browser game

Session target:
- 10 to 20 minute runs

This should feel like:
- Diablo-inspired structure
- Hades-lite room progression
- simplified web-friendly scope

---

## MVP design goals

Prioritize these goals:
1. Combat must feel responsive and readable.
2. Loot drops must feel meaningful quickly.
3. Runs must be short and replayable.
4. Scope must stay intentionally narrow.
5. Architecture must support future expansion without a rewrite.

Avoid building an engine for its own sake.
Build a playable vertical slice first.

---

## MVP feature set

### 1. Player character

Implement exactly **one class** for MVP:
- Warrior

Warrior starter kit:
- basic melee attack
- one heavy attack skill (for example Ground Slam)
- one mobility or defensive skill (for example Dash or Shield Slam)

Player controls:
- WASD movement
- mouse aim
- left click basic attack
- hotkeys for 2 active skills
- pickup/interact key if needed

Do **not** implement click-to-move pathfinding in MVP.

---

### 2. Camera and presentation

Use a fixed angled top-down / isometric-like camera.

Requirements:
- stable framing
- readable combat space
- no free camera
- stylized low-poly or minimal dark fantasy visuals
- moody lighting, fog, torches, readable telegraphs

Prioritize readability over realism.

---

### 3. Dungeon structure

Use **room-based progression**, not a giant continuous map.

MVP room flow:
- start room
- several combat rooms
- one elite room
- one boss room
- optional treasure or healing room

Dungeon generation can be lightweight.
A simple connected sequence of handcrafted or semi-randomized rooms is enough.

Each room should:
- lock on encounter start
- spawn enemies based on room type
- unlock after clear
- grant reward after completion

---

### 4. Enemies

Implement exactly these MVP enemies:

1. Skeleton Soldier
- melee chaser
- basic contact or swing attack

2. Skeleton Archer
- ranged attacker
- forces movement and positioning

3. Exploding Skull
- fragile fast enemy
- rushes the player and explodes on contact or low range

4. Crypt Brute
- slower, tankier, heavier hitter
- used as elite or mini-elite

Boss:
- The Bone Warden
- large melee attacks
- readable telegraphs
- summon phase or shockwave phase

All enemy behavior should be simple but distinct.

---

### 5. Loot and inventory

Keep itemization intentionally small.

MVP gear slots:
- weapon
- armor
- ring

MVP item rarities:
- common
- magic
- rare

MVP combat stats:
- max health
- damage
- attack speed
- crit chance
- armor
- move speed
- life steal or life on hit

MVP affixes pool:
- +flat damage
- +max health
- +attack speed
- +crit chance
- +armor
- +move speed
- +life steal

Requirements:
- dropped items can be compared quickly
- equipping upgrades should be easy
- stats should be understandable at a glance

Do not create a huge affix pool in MVP.

---

### 6. Rewards and progression

Per-run rewards:
- gear drops
- gold
- healing or blessing reward after some rooms

Persistent progression:
- gold-based meta upgrades in the hub

MVP meta upgrade examples:
- small max health bonus
- small starting damage bonus
- slightly higher rare drop chance
- improved healing efficiency

Persistent progression should support replayability without invalidating the run itself.

---

### 7. UI

Implement clean functional UI for MVP:
- health bar
- skill hotbar / cooldown display
- room clear / reward feedback
- simple inventory/equipment panel
- tooltip compare for current vs new item
- run end summary
- hub upgrade screen

UI should be clear and minimal, not overloaded.

---

### 8. Juice / feel

Even in MVP, combat should have feedback.

Include lightweight juice such as:
- hit flashes
- damage numbers
- weapon trails or slash effect
- enemy death burst
- boss telegraph decals
- loot beam or glow for better items
- simple screen shake on heavy impact if tasteful

This is important. A tiny polished game beats a technically broader but lifeless one.

---

## Technical architecture requirements

### Core rule

Do **not** put all moment-to-moment combat state directly into React component state.

Preferred architecture:
- React for menus, HUD, inventory, overlays
- r3f for rendering the world and actors
- gameplay simulation in a dedicated game/sim layer
- Zustand for higher-level app/game state and bridges to UI
- fixed timestep update for gameplay

### Simulation model

Use a fixed-step gameplay loop, for example 30 or 60 Hz.

Simulation responsibilities:
- input processing
- movement
- cooldowns
- AI decisions
- attacks
- hit detection
- damage resolution
- death handling
- loot spawning
- room encounter state

Render layer responsibilities:
- actor transforms
- animation state
- camera
- VFX
- environment rendering

### State guidance

Organize data so combat and entity simulation can scale without rerendering the whole React tree constantly.

---

## Suggested folder structure

```txt
src/
  app/
    App.tsx
    providers/

  game/
    core/
      constants.ts
      random.ts
      fixedStep.ts
      types.ts

    sim/
      world.ts
      gameLoop.ts
      commands.ts

    entities/
      entity.ts
      components.ts
      factories.ts

    combat/
      attacks.ts
      damage.ts
      cooldowns.ts
      hitDetection.ts

    ai/
      enemyBrain.ts
      behaviors/

    dungeon/
      roomTypes.ts
      roomGenerator.ts
      encounterGenerator.ts
      rewards.ts

    loot/
      itemTypes.ts
      affixes.ts
      lootTables.ts
      itemGeneration.ts

    progression/
      runState.ts
      metaProgression.ts
      saveData.ts

  render/
    scene/
      GameScene.tsx
      CameraRig.tsx
      Lighting.tsx
      RoomRenderer.tsx

    actors/
      PlayerActor.tsx
      EnemyActor.tsx
      LootActor.tsx
      ProjectileActor.tsx

    effects/
      HitFlash.tsx
      LootBeam.tsx
      DamageNumbers.tsx
      GroundTelegraph.tsx

  state/
    uiStore.ts
    gameBridge.ts
    saveStore.ts

  ui/
    hud/
    inventory/
    menus/
    tooltips/
    runSummary/

  assets/
    models/
    textures/
    audio/
```

Keep code modular and easy to grow.

---

## Implementation phases

### Phase 1 — Vertical slice

Goal: produce one fun playable run.

Implement:
- Warrior class
- player movement and attacks
- 4 normal enemies
- 1 boss
- room progression
- loot drops and equipment
- simple HUD and inventory
- hub with at least 2 to 4 upgrades
- save/load for persistent gold and upgrades

Success condition:
- the game is fun for at least 10 to 15 minutes despite limited content

### Phase 2 — Replayability pass

Implement:
- elite modifiers
- treasure/healing/shrine rooms
- more room variations
- more item affixes
- better boss presentation
- more audiovisual polish
- more progression options

Success condition:
- repeated runs feel different enough to stay interesting

### Phase 3 — Expansion

Possible additions after MVP:
- second class such as Archer or Cleric
- status effects
- more bosses
- more biomes
- skill modifiers
- better procedural generation
- codex/bestiary

Do not build Phase 3 systems before Phase 1 is already fun.

---

## Non-goals for MVP

Do **not** implement these in the first version:
- multiplayer
- full open dungeon world
- click-to-move pathfinding
- giant passive skill tree
- dozens of item slots
- many classes
- deep narrative campaign
- advanced crafting
- highly realistic graphics
- engine-level abstraction for hypothetical future games

If a decision threatens scope, choose the simpler option.

---

## Quality bar

The project should aim for:
- clean architecture
- clear naming
- easy local setup
- strong first-play experience
- browser performance that remains stable with several enemies and effects
- code that is understandable to continue later

Prefer pragmatic solutions over overengineering.

---

## Deliverables requested from the coding agent

Build a working MVP scaffold and initial implementation with:
- Vite + TypeScript + React + r3f setup
- runnable development environment
- modular folder structure matching the design above
- one playable run loop
- one boss encounter
- loot/equipment flow
- persistent meta progression
- simple placeholder visuals acceptable at first, but readable and coherent

Also include:
- README with setup and controls
- clear separation between simulation, rendering, and UI
- comments only where helpful
- no unnecessary framework complexity

---

## Guidance for Copilot / Codex / coding agent

When implementing this project:
- focus on a playable MVP, not theoretical completeness
- keep systems small and explicit
- prefer a clean vertical slice over broad unfinished features
- avoid premature generalization
- use placeholder geometry and simple effects where needed
- make combat readable first, pretty second
- make loot understandable first, deep second
- keep the architecture extensible but not overabstracted

If tradeoffs are required, prioritize in this order:
1. responsive gameplay feel
2. readable combat
3. simple loot/progression loop
4. maintainable architecture
5. visual polish
6. content volume

---

## One-sentence directive

Create a small but polished browser-based dark fantasy room-crawler MVP with real-time combat, loot, one playable class, one biome, one boss, and persistent progression, using TypeScript, React, and React Three Fiber with a clean simulation/render/UI separation.
