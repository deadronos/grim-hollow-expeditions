# Grim Hollow Expeditions

Browser-based dark fantasy action crawler MVP inspired by Diablo structure and Hades-style room flow. The current build is a focused vertical slice: one warrior class, short expeditions, distinct enemy types, randomized loot, a Bone Warden boss fight, and gold-based hub upgrades.

## Stack

- TypeScript
- React
- React Three Fiber
- Zustand
- Vite

## MVP Features

- Isometric-style combat arena rendered in WebGL
- Warrior kit with basic attack, Ground Slam, and Dash
- Fixed run structure with start, combat, treasure, elite, and boss rooms
- Skeleton Soldier, Skeleton Archer, Exploding Skull, Crypt Brute, and Bone Warden encounters
- Weapon, armor, and ring drops with common, magic, and rare rarities
- Hub progression with permanent gold upgrades
- Inventory compare flow, cooldown HUD, room banners, and run summary

## Controls

- `WASD`: move
- Mouse: aim
- Left click: basic attack
- `1` or `Q`: Ground Slam
- `2` or `Space`: Dash
- `E`: pick up nearby loot

## Development

```bash
npm install
npm run dev
```

## Verification

```bash
npm run lint
npm run build
```

## Notes

- Meta progression is persisted in `localStorage`.
- The current build is intentionally scoped as a polished vertical slice rather than a full ARPG system.
