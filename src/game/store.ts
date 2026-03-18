import { create } from 'zustand'
import {
  createRooms,
  getBaseStats,
  getBlessings,
  getEnemyName,
  getStarterEquipment,
  getUpgradeCost,
  makeDropForRoom,
  rarityColors,
} from './content'
import {
  add,
  angleFrom,
  clamp,
  clampVec,
  distance,
  dot,
  fromAngle,
  length,
  normalize,
  scale,
  subtract,
  vec,
} from './math'
import type {
  DamageText,
  Effect,
  EnemyState,
  EnemyType,
  Equipment,
  GameInput,
  Item,
  ItemSlot,
  LootDrop,
  MetaState,
  NearbyLootInfo,
  Phase,
  PlayerState,
  Projectile,
  RoomState,
  RunStats,
  StatBlock,
  SummaryState,
  Telegraph,
  UpgradeKey,
  Vec2,
} from './types'

const STORAGE_KEY = 'grim-hollow-expeditions-meta-v1'
const ROOM_BOUNDARY = 7.6
const PLAYER_RADIUS = 0.52
const PICKUP_RANGE = 1.9
const MELEE_ARC = Math.cos(Math.PI / 2.8)

type GameState = {
  phase: Phase
  meta: MetaState
  rooms: RoomState[]
  roomIndex: number
  player: PlayerState
  equipment: Equipment
  backpack: Item[]
  enemies: EnemyState[]
  projectiles: Projectile[]
  telegraphs: Telegraph[]
  loot: LootDrop[]
  effects: Effect[]
  damageTexts: DamageText[]
  runStats: RunStats
  message: string
  summary: SummaryState | null
  screenShake: number
  inventoryOpen: boolean
  startRun: () => void
  returnToHub: () => void
  buyUpgrade: (key: UpgradeKey) => void
  tick: (dt: number, input: GameInput) => void
  advanceRoom: () => void
  interact: () => void
  equipItem: (itemId: string) => void
  toggleInventory: () => void
}

type PersistedMeta = Pick<GameState, 'meta'>

const id = () => crypto.randomUUID()

const loadMeta = (): MetaState => {
  const fallback: MetaState = {
    goldBank: 0,
    upgrades: {
      vitality: 0,
      edge: 0,
      fortune: 0,
      grace: 0,
    },
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return fallback
    }

    const parsed = JSON.parse(raw) as PersistedMeta
    if (!parsed?.meta) {
      return fallback
    }

    return {
      goldBank: parsed.meta.goldBank ?? 0,
      upgrades: {
        vitality: parsed.meta.upgrades.vitality ?? 0,
        edge: parsed.meta.upgrades.edge ?? 0,
        fortune: parsed.meta.upgrades.fortune ?? 0,
        grace: parsed.meta.upgrades.grace ?? 0,
      },
    }
  } catch {
    return fallback
  }
}

const persistMeta = (meta: MetaState) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ meta }))
}

const createPlayer = (): PlayerState => ({
  pos: vec(0, -1.8),
  facing: Math.PI / 2,
  hp: 100,
  attackCooldown: 0,
  slamCooldown: 0,
  dashCooldown: 0,
  dashTimer: 0,
  invuln: 0,
  flash: 0,
})

const defaultRunStats = (): RunStats => ({
  gold: 0,
  blessing: 'No blessing claimed yet.',
  rareBonus: 0,
  enemiesSlain: 0,
})

const createEnemy = (type: EnemyType, index: number): EnemyState => {
  const angle = (Math.PI * 2 * index) / 5
  const ring = type === 'bone-warden' ? 3.8 : 4.8
  const spawn = add(vec(0, 1.5), scale(fromAngle(angle), ring))

  switch (type) {
    case 'skeleton-soldier':
      return {
        id: id(),
        type,
        name: getEnemyName(type),
        pos: spawn,
        hp: 28,
        maxHp: 28,
        speed: 2.5,
        radius: 0.48,
        damage: 12,
        attackCooldown: 0.8,
        flash: 0,
        elite: false,
        windup: 0,
        patternIndex: 0,
      }
    case 'skeleton-archer':
      return {
        id: id(),
        type,
        name: getEnemyName(type),
        pos: spawn,
        hp: 22,
        maxHp: 22,
        speed: 2,
        radius: 0.45,
        damage: 9,
        attackCooldown: 1.4,
        flash: 0,
        elite: false,
        windup: 0,
        patternIndex: 0,
      }
    case 'exploding-skull':
      return {
        id: id(),
        type,
        name: getEnemyName(type),
        pos: spawn,
        hp: 12,
        maxHp: 12,
        speed: 3.8,
        radius: 0.34,
        damage: 20,
        attackCooldown: 0.4,
        flash: 0,
        elite: false,
        windup: 0,
        patternIndex: 0,
      }
    case 'crypt-brute':
      return {
        id: id(),
        type,
        name: getEnemyName(type),
        pos: spawn,
        hp: 78,
        maxHp: 78,
        speed: 1.6,
        radius: 0.82,
        damage: 18,
        attackCooldown: 1.5,
        flash: 0,
        elite: true,
        windup: 0,
        patternIndex: 0,
      }
    case 'bone-warden':
      return {
        id: id(),
        type,
        name: getEnemyName(type),
        pos: vec(0, 2.8),
        hp: 240,
        maxHp: 240,
        speed: 1.5,
        radius: 1.08,
        damage: 22,
        attackCooldown: 2.2,
        flash: 0,
        elite: true,
        windup: 0,
        patternIndex: 0,
      }
  }
}

const spawnRoomEnemies = (room: RoomState): EnemyState[] => {
  let seed = 0
  return room.spawns.flatMap((spawn) =>
    Array.from({ length: spawn.count }, () => {
      const enemy = createEnemy(spawn.type, seed)
      seed += 1
      return enemy
    }),
  )
}

const addStats = (base: StatBlock, extra: Partial<StatBlock>): StatBlock => ({
  maxHealth: base.maxHealth + (extra.maxHealth ?? 0),
  damage: base.damage + (extra.damage ?? 0),
  attackSpeed: base.attackSpeed + (extra.attackSpeed ?? 0),
  critChance: base.critChance + (extra.critChance ?? 0),
  armor: base.armor + (extra.armor ?? 0),
  moveSpeed: base.moveSpeed + (extra.moveSpeed ?? 0),
  lifeSteal: base.lifeSteal + (extra.lifeSteal ?? 0),
})

const sumEquipmentStats = (equipment: Equipment): StatBlock => {
  let total: StatBlock = {
    maxHealth: 0,
    damage: 0,
    attackSpeed: 0,
    critChance: 0,
    armor: 0,
    moveSpeed: 0,
    lifeSteal: 0,
  }

  for (const item of Object.values(equipment)) {
    total = addStats(total, item.stats)
  }

  return total
}

const getDerivedStats = (state: GameState): StatBlock => {
  const base = getBaseStats()
  const equipped = sumEquipmentStats(state.equipment)
  const withGear = addStats(base, equipped)
  const withMeta = addStats(withGear, {
    maxHealth: state.meta.upgrades.vitality * 8,
    damage: state.meta.upgrades.edge * 1.2,
  })

  let blessingBonus: Partial<StatBlock> = {}
  if (state.runStats.blessing.startsWith('Sanctified edge')) {
    blessingBonus = { damage: 3 }
  } else if (state.runStats.blessing.startsWith('Fleet oath')) {
    blessingBonus = { moveSpeed: 0.75 }
  } else if (state.runStats.blessing.startsWith('Ravenous sigil')) {
    blessingBonus = { lifeSteal: 0.04 }
  }

  const result = addStats(withMeta, blessingBonus)
  return {
    maxHealth: result.maxHealth,
    damage: result.damage,
    attackSpeed: result.attackSpeed,
    critChance: clamp(result.critChance, 0, 0.85),
    armor: result.armor,
    moveSpeed: result.moveSpeed,
    lifeSteal: clamp(result.lifeSteal, 0, 0.45),
  }
}

const scaleDamageByArmor = (damage: number, armor: number): number =>
  damage * (100 / (100 + Math.max(0, armor * 8)))

const createDamageText = (pos: Vec2, value: string, color: string): DamageText => ({
  id: id(),
  pos,
  value,
  ttl: 0.85,
  color,
})

const applyDamageToPlayer = (state: GameState, amount: number, pos: Vec2, label?: string) => {
  if (state.player.invuln > 0) {
    return
  }

  const derived = getDerivedStats(state)
  const taken = scaleDamageByArmor(amount, derived.armor)
  state.player.hp = Math.max(0, state.player.hp - taken)
  state.player.flash = 0.18
  state.damageTexts.push(createDamageText(pos, `-${Math.round(taken)}`, '#ff9486'))
  state.message = state.player.hp <= derived.maxHealth * 0.25 ? 'The crypt bites deep. Heal or disengage.' : state.message

  if (state.player.hp <= 0) {
    endRun(state, false)
  } else if (label) {
    state.damageTexts.push(createDamageText(add(pos, vec(0.2, 0.2)), label, '#f6eedf'))
  }
}

const applyDamageToEnemy = (
  state: GameState,
  enemy: EnemyState,
  amount: number,
  crit: boolean,
) => {
  enemy.hp = Math.max(0, enemy.hp - amount)
  enemy.flash = 0.15
  state.damageTexts.push(
    createDamageText(enemy.pos, `${crit ? 'Crit ' : ''}${Math.round(amount)}`, crit ? '#ffe39b' : '#ffffff'),
  )

  if (enemy.hp > 0) {
    return
  }

  state.effects.push({
    id: id(),
    type: 'burst',
    pos: enemy.pos,
    radius: enemy.type === 'bone-warden' ? 2.2 : enemy.elite ? 1.4 : 0.9,
    ttl: 0.45,
    duration: 0.45,
  })
  state.runStats.enemiesSlain += 1
  state.runStats.gold += enemy.type === 'bone-warden' ? 140 : enemy.elite ? 40 : 12
  if (enemy.type === 'exploding-skull') {
    state.effects.push({
      id: id(),
      type: 'burst',
      pos: enemy.pos,
      radius: 1.2,
      ttl: 0.35,
      duration: 0.35,
    })
  }
  maybeSpawnLoot(state, enemy)
}

const maybeSpawnLoot = (state: GameState, enemy: EnemyState) => {
  const currentRoom = state.rooms[state.roomIndex]
  if (!currentRoom) {
    return
  }

  const baseChance =
    enemy.type === 'bone-warden'
      ? 1
      : enemy.elite
        ? 0.85
        : enemy.type === 'exploding-skull'
          ? 0.2
          : 0.35
  const chance = Math.min(1, baseChance + state.meta.upgrades.fortune * 0.04 + state.runStats.rareBonus)
  if (Math.random() > chance) {
    return
  }

  const slots: ItemSlot[] = ['weapon', 'armor', 'ring']
  const slot = slots[Math.floor(Math.random() * slots.length)]
  state.loot.push({
    id: id(),
    item: makeDropForRoom(slot, state.meta, state.roomIndex + 1),
    pos: add(enemy.pos, vec(Math.random() * 0.4 - 0.2, Math.random() * 0.4 - 0.2)),
  })
}

const finalizeRoomIfClear = (state: GameState) => {
  if (state.enemies.length > 0) {
    return
  }

  const room = state.rooms[state.roomIndex]
  if (!room || room.cleared) {
    return
  }

  room.cleared = true
  state.screenShake = Math.max(state.screenShake, 0.25)

  if (room.type === 'boss') {
    state.message = 'The Bone Warden is broken. Carry the gold back to the cathedral.'
    endRun(state, true)
    return
  }

  state.runStats.gold += room.type === 'elite' ? 75 : room.type === 'combat' ? 40 : 25

  if (room.type === 'elite') {
    state.runStats.rareBonus += 0.08
  }

  state.message = `${room.title} cleared. ${room.rewardLabel}`
}

const applyHealingRoom = (state: GameState) => {
  const room = state.rooms[state.roomIndex]
  if (!room || room.cleared || room.type !== 'treasure') {
    return
  }

  const blessings = getBlessings()
  const blessing = blessings[Math.floor(Math.random() * blessings.length)]
  const derived = getDerivedStats(state)
  const healScale = 0.34 + state.meta.upgrades.grace * 0.08
  state.player.hp = Math.min(derived.maxHealth, state.player.hp + derived.maxHealth * healScale)
  state.runStats.gold += 35
  state.runStats.blessing = blessing
  state.runStats.rareBonus += 0.04
  state.loot.push({
    id: id(),
    item: makeDropForRoom('ring', state.meta, state.roomIndex + 1),
    pos: vec(0, 0.2),
  })
  room.cleared = true
  state.effects.push({
    id: id(),
    type: 'heal',
    pos: vec(0, 0),
    radius: 1.6,
    ttl: 0.9,
    duration: 0.9,
  })
  state.message = `${room.rewardLabel} ${blessing}`
}

const endRun = (state: GameState, victory: boolean) => {
  const roomsCleared = state.rooms.filter((room) => room.cleared).length
  state.meta.goldBank += state.runStats.gold
  persistMeta(state.meta)
  state.phase = 'summary'
  state.summary = {
    victory,
    roomsCleared,
    goldEarned: state.runStats.gold,
    bossDefeated: victory,
    enemiesSlain: state.runStats.enemiesSlain,
  }
}

const consumeLoot = (state: GameState, dropId: string, equipNow: boolean) => {
  const dropIndex = state.loot.findIndex((drop) => drop.id === dropId)
  if (dropIndex === -1) {
    return
  }

  const [drop] = state.loot.splice(dropIndex, 1)
  if (equipNow) {
    state.backpack.push(state.equipment[drop.item.slot])
    state.equipment[drop.item.slot] = drop.item
    state.message = `${drop.item.name} equipped.`
  } else {
    state.backpack.unshift(drop.item)
    state.message = `${drop.item.name} taken into pack.`
  }
}

const getNearbyLoot = (state: GameState): NearbyLootInfo | null => {
  let nearest: NearbyLootInfo | null = null
  for (const drop of state.loot) {
    const currentDistance = distance(state.player.pos, drop.pos)
    if (currentDistance > PICKUP_RANGE) {
      continue
    }

    if (!nearest || currentDistance < nearest.distance) {
      nearest = { drop, distance: currentDistance }
    }
  }

  return nearest
}

const updateTimers = (state: GameState, dt: number) => {
  state.player.attackCooldown = Math.max(0, state.player.attackCooldown - dt)
  state.player.slamCooldown = Math.max(0, state.player.slamCooldown - dt)
  state.player.dashCooldown = Math.max(0, state.player.dashCooldown - dt)
  state.player.dashTimer = Math.max(0, state.player.dashTimer - dt)
  state.player.invuln = Math.max(0, state.player.invuln - dt)
  state.player.flash = Math.max(0, state.player.flash - dt)
  state.screenShake = Math.max(0, state.screenShake - dt * 1.4)
}

const performBasicAttack = (state: GameState, input: GameInput) => {
  const stats = getDerivedStats(state)
  if (!input.attackHeld || state.player.attackCooldown > 0) {
    return
  }

  state.player.attackCooldown = Math.max(0.16, 0.7 / Math.max(0.8, stats.attackSpeed))
  state.effects.push({
    id: id(),
    type: 'slash',
    pos: add(state.player.pos, scale(fromAngle(state.player.facing), 1.1)),
    radius: 1.35,
    ttl: 0.22,
    duration: 0.22,
  })

  for (const enemy of state.enemies) {
    const toEnemy = subtract(enemy.pos, state.player.pos)
    if (length(toEnemy) > 1.9 + enemy.radius) {
      continue
    }

    const facingDot = dot(normalize(toEnemy), normalize(subtract(input.aim, state.player.pos)))
    if (facingDot < MELEE_ARC) {
      continue
    }

    const crit = Math.random() < stats.critChance
    const amount = stats.damage * (crit ? 1.8 : 1)
    applyDamageToEnemy(state, enemy, amount, crit)
    const heal = amount * stats.lifeSteal
    state.player.hp = Math.min(stats.maxHealth, state.player.hp + heal)
  }

  state.screenShake = Math.max(state.screenShake, 0.12)
}

const performGroundSlam = (state: GameState) => {
  const stats = getDerivedStats(state)
  if (state.player.slamCooldown > 0) {
    return
  }

  state.player.slamCooldown = 4.4
  state.effects.push({
    id: id(),
    type: 'slam',
    pos: state.player.pos,
    radius: 3.1,
    ttl: 0.55,
    duration: 0.55,
  })
  for (const enemy of state.enemies) {
    if (distance(enemy.pos, state.player.pos) > 2.8 + enemy.radius) {
      continue
    }

    const crit = Math.random() < stats.critChance + 0.12
    applyDamageToEnemy(state, enemy, stats.damage * 2.1 * (crit ? 1.6 : 1), crit)
  }
  state.screenShake = Math.max(state.screenShake, 0.35)
  state.message = 'Ground Slam cracks the crypt floor.'
}

const performDash = (state: GameState, input: GameInput) => {
  if (state.player.dashCooldown > 0) {
    return
  }

  const direction = normalize(subtract(input.aim, state.player.pos))
  if (length(direction) < 0.1) {
    return
  }

  state.player.pos = clampVec(add(state.player.pos, scale(direction, 2.8)), ROOM_BOUNDARY)
  state.player.dashCooldown = 5.2
  state.player.dashTimer = 0.18
  state.player.invuln = 0.18
  state.effects.push({
    id: id(),
    type: 'slash',
    pos: state.player.pos,
    radius: 1.2,
    ttl: 0.2,
    duration: 0.2,
  })
  state.message = 'Dash executed.'
}

const updatePlayer = (state: GameState, dt: number, input: GameInput) => {
  const stats = getDerivedStats(state)
  const movement = normalize(input.move)
  if (length(movement) > 0) {
    const bonus = state.player.dashTimer > 0 ? 2.2 : 1
    state.player.pos = clampVec(
      add(state.player.pos, scale(movement, stats.moveSpeed * bonus * dt)),
      ROOM_BOUNDARY,
    )
  }

  if (distance(input.aim, state.player.pos) > 0.1) {
    state.player.facing = angleFrom(state.player.pos, input.aim)
  }

  if (input.wantsDash) {
    performDash(state, input)
  }

  if (input.wantsSlam) {
    performGroundSlam(state)
  }

  performBasicAttack(state, input)

  const maxHealth = stats.maxHealth
  state.player.hp = clamp(state.player.hp, 0, maxHealth)
}

const spawnBossAdds = (state: GameState) => {
  const newAdds = [createEnemy('skeleton-soldier', Math.random() > 0.5 ? 1 : 2), createEnemy('exploding-skull', 4)]
  for (const addEnemy of newAdds) {
    addEnemy.pos = add(vec(0, 0), vec(Math.random() * 5 - 2.5, Math.random() * 2))
    state.enemies.push(addEnemy)
  }
  state.message = 'The Bone Warden calls the dead back to service.'
}

const updateEnemies = (state: GameState, dt: number) => {
  const meleeHits: Array<{ amount: number; pos: Vec2 }> = []

  for (const enemy of state.enemies) {
    enemy.attackCooldown = Math.max(0, enemy.attackCooldown - dt)
    enemy.flash = Math.max(0, enemy.flash - dt)
    enemy.windup = Math.max(0, enemy.windup - dt)

    const toPlayer = subtract(state.player.pos, enemy.pos)
    const direction = normalize(toPlayer)
    const currentDistance = length(toPlayer)

    if (enemy.type === 'skeleton-archer') {
      if (currentDistance < 3.5) {
        enemy.pos = clampVec(add(enemy.pos, scale(direction, -enemy.speed * dt)), ROOM_BOUNDARY)
      } else if (currentDistance > 5.3) {
        enemy.pos = clampVec(add(enemy.pos, scale(direction, enemy.speed * dt)), ROOM_BOUNDARY)
      }

      if (enemy.attackCooldown <= 0 && currentDistance < 7) {
        enemy.attackCooldown = 1.9
        const velocity = scale(direction, 6.8)
        state.projectiles.push({
          id: id(),
          type: 'arrow',
          owner: 'enemy',
          pos: enemy.pos,
          velocity,
          radius: 0.16,
          damage: enemy.damage,
          ttl: 2.2,
        })
      }
      continue
    }

    if (enemy.type === 'exploding-skull') {
      enemy.pos = clampVec(add(enemy.pos, scale(direction, enemy.speed * dt)), ROOM_BOUNDARY)
      if (currentDistance < 0.95) {
        meleeHits.push({ amount: enemy.damage, pos: enemy.pos })
        enemy.hp = 0
      }
      continue
    }

    if (enemy.type === 'bone-warden') {
      if (currentDistance > 2.8) {
        enemy.pos = clampVec(add(enemy.pos, scale(direction, enemy.speed * dt)), ROOM_BOUNDARY)
      }

      if (enemy.attackCooldown <= 0) {
        enemy.attackCooldown = 3.4
        if (enemy.patternIndex % 2 === 0) {
          state.telegraphs.push({
            id: id(),
            pos: { ...state.player.pos },
            radius: 2.35,
            ttl: 1.05,
            duration: 1.05,
            damage: 24,
            label: 'Bone shockwave',
          })
          state.message = 'Shockwave incoming. Move out of the telegraph.'
        } else {
          spawnBossAdds(state)
        }
        enemy.patternIndex += 1
      }

      if (currentDistance < 1.9 && enemy.windup <= 0) {
        enemy.windup = 0.95
      }

      if (enemy.windup > 0 && enemy.windup <= 0.12) {
        meleeHits.push({ amount: enemy.damage, pos: enemy.pos })
        enemy.windup = 0
      }
      continue
    }

    enemy.pos = clampVec(add(enemy.pos, scale(direction, enemy.speed * dt)), ROOM_BOUNDARY)
    const reach = enemy.type === 'crypt-brute' ? 1.55 : 1.02
    if (currentDistance < reach && enemy.attackCooldown <= 0) {
      meleeHits.push({ amount: enemy.damage, pos: enemy.pos })
      enemy.attackCooldown = enemy.type === 'crypt-brute' ? 1.8 : 1.1
    }
  }

  state.enemies = state.enemies.filter((enemy) => enemy.hp > 0)

  for (const hit of meleeHits) {
    applyDamageToPlayer(state, hit.amount, hit.pos)
  }
}

const updateProjectiles = (state: GameState, dt: number) => {
  const nextProjectiles: Projectile[] = []
  for (const projectile of state.projectiles) {
    projectile.ttl -= dt
    projectile.pos = add(projectile.pos, scale(projectile.velocity, dt))
    if (projectile.ttl <= 0 || Math.abs(projectile.pos.x) > ROOM_BOUNDARY + 1 || Math.abs(projectile.pos.y) > ROOM_BOUNDARY + 1) {
      continue
    }

    if (distance(projectile.pos, state.player.pos) <= projectile.radius + PLAYER_RADIUS) {
      applyDamageToPlayer(state, projectile.damage, projectile.pos)
      continue
    }

    nextProjectiles.push(projectile)
  }

  state.projectiles = nextProjectiles
}

const updateTelegraphs = (state: GameState, dt: number) => {
  const remaining: Telegraph[] = []
  for (const telegraph of state.telegraphs) {
    telegraph.ttl -= dt
    if (telegraph.ttl <= 0) {
      if (distance(telegraph.pos, state.player.pos) <= telegraph.radius + PLAYER_RADIUS) {
        applyDamageToPlayer(state, telegraph.damage, telegraph.pos, telegraph.label)
      }
      state.effects.push({
        id: id(),
        type: 'slam',
        pos: telegraph.pos,
        radius: telegraph.radius + 0.25,
        ttl: 0.22,
        duration: 0.22,
      })
      state.screenShake = Math.max(state.screenShake, 0.18)
      continue
    }

    remaining.push(telegraph)
  }

  state.telegraphs = remaining
}

const updateEffects = (state: GameState, dt: number) => {
  state.effects = state.effects
    .map((effect) => ({ ...effect, ttl: effect.ttl - dt }))
    .filter((effect) => effect.ttl > 0)
  state.damageTexts = state.damageTexts
    .map((entry) => ({ ...entry, ttl: entry.ttl - dt, pos: add(entry.pos, vec(0, dt * 0.9)) }))
    .filter((entry) => entry.ttl > 0)
}

const createInitialState = (): Omit<
  GameState,
  'startRun' | 'returnToHub' | 'buyUpgrade' | 'tick' | 'advanceRoom' | 'interact' | 'equipItem' | 'toggleInventory'
> => {
  const meta = loadMeta()
  const player = createPlayer()
  const equipment = getStarterEquipment()
  const base = addStats(getBaseStats(), {
    maxHealth: meta.upgrades.vitality * 8,
    damage: meta.upgrades.edge * 1.2,
  })

  player.hp = base.maxHealth + equipment.armor.stats.maxHealth! + 0

  return {
    phase: 'hub',
    meta,
    rooms: createRooms(),
    roomIndex: 0,
    player,
    equipment,
    backpack: [],
    enemies: [],
    projectiles: [],
    telegraphs: [],
    loot: [],
    effects: [],
    damageTexts: [],
    runStats: defaultRunStats(),
    message: 'The cathedral waits. Spend gold, then descend.',
    summary: null,
    screenShake: 0,
    inventoryOpen: true,
  }
}

export const useGameStore = create<GameState>((set) => ({
  ...createInitialState(),
  startRun: () => {
    set((state) => {
      const rooms = createRooms()
      const nextState = createInitialState()
      const derived = addStats(getBaseStats(), {
        maxHealth: state.meta.upgrades.vitality * 8,
        damage: state.meta.upgrades.edge * 1.2,
      })

      nextState.phase = 'run'
      nextState.meta = state.meta
      nextState.rooms = rooms
      nextState.roomIndex = 0
      nextState.player = createPlayer()
      nextState.equipment = getStarterEquipment()
      nextState.player.hp = derived.maxHealth + (nextState.equipment.armor.stats.maxHealth ?? 0)
      nextState.message = 'The stair yawns open. Clear rooms, gather loot, survive the boss.'
      return nextState
    })
  },
  returnToHub: () => {
    set((state) => {
      const reset = createInitialState()
      reset.meta = state.meta
      persistMeta(reset.meta)
      reset.message = 'Back at the cathedral. Invest gold and descend again.'
      return reset
    })
  },
  buyUpgrade: (key) => {
    set((state) => {
      if (state.phase !== 'hub') {
        return state
      }

      const cost = getUpgradeCost(key, state.meta.upgrades[key])
      if (state.meta.goldBank < cost) {
        return { ...state, message: 'Not enough gold banked for that rite.' }
      }

      const nextMeta: MetaState = {
        goldBank: state.meta.goldBank - cost,
        upgrades: {
          ...state.meta.upgrades,
          [key]: state.meta.upgrades[key] + 1,
        },
      }
      persistMeta(nextMeta)

      return {
        ...state,
        meta: nextMeta,
        message: `${key[0].toUpperCase()}${key.slice(1)} strengthened.`,
      }
    })
  },
  tick: (dt, input) => {
    set((state) => {
      if (state.phase !== 'run') {
        return state
      }

      if (state.rooms[state.roomIndex]?.type === 'treasure' && state.enemies.length === 0) {
        applyHealingRoom(state)
      }

      updateTimers(state, dt)
      updatePlayer(state, dt, input)
      updateEnemies(state, dt)
      updateProjectiles(state, dt)
      updateTelegraphs(state, dt)
      updateEffects(state, dt)
      finalizeRoomIfClear(state)

      if (input.wantsInteract) {
        const nearby = getNearbyLoot(state)
        if (nearby) {
          consumeLoot(state, nearby.drop.id, false)
        } else {
          const room = state.rooms[state.roomIndex]
          if (room?.cleared && state.roomIndex < state.rooms.length - 1) {
            const nextIndex = state.roomIndex + 1
            const nextRoom = state.rooms[nextIndex]
            const nextEnemies = spawnRoomEnemies(nextRoom)

            state.roomIndex = nextIndex
            state.player = {
              ...state.player,
              pos: vec(0, -2.8),
              attackCooldown: 0,
              dashTimer: 0,
            }
            state.enemies = nextEnemies
            state.projectiles = []
            state.telegraphs = []
            state.effects = []
            state.loot = []
            state.damageTexts = []
            state.message = `${nextRoom.title}. ${nextRoom.subtitle}`
          }
        }
      }

      return { ...state }
    })
  },
  advanceRoom: () => {
    set((state) => {
      if (state.phase !== 'run') {
        return state
      }

      const currentRoom = state.rooms[state.roomIndex]
      if (!currentRoom?.cleared || state.roomIndex >= state.rooms.length - 1) {
        return state
      }

      const nextIndex = state.roomIndex + 1
      const nextRoom = state.rooms[nextIndex]
      const nextEnemies = spawnRoomEnemies(nextRoom)

      return {
        ...state,
        roomIndex: nextIndex,
        player: {
          ...state.player,
          pos: vec(0, -2.8),
          attackCooldown: 0,
          dashTimer: 0,
        },
        enemies: nextEnemies,
        projectiles: [],
        telegraphs: [],
        effects: [],
        loot: [],
        damageTexts: [],
        message: `${nextRoom.title}. ${nextRoom.subtitle}`,
      }
    })
  },
  interact: () => {
    set((state) => {
      if (state.phase !== 'run') {
        return state
      }

      const nearby = getNearbyLoot(state)
      if (!nearby) {
        return state
      }

      consumeLoot(state, nearby.drop.id, false)
      return { ...state }
    })
  },
  equipItem: (itemId) => {
    set((state) => {
      const lootDrop = state.loot.find((drop) => drop.id === itemId)
      if (lootDrop) {
        consumeLoot(state, itemId, true)
        return { ...state }
      }

      const backpackIndex = state.backpack.findIndex((item) => item.id === itemId)
      if (backpackIndex === -1) {
        return state
      }

      const item = state.backpack[backpackIndex]
      state.backpack.splice(backpackIndex, 1)
      state.backpack.unshift(state.equipment[item.slot])
      state.equipment[item.slot] = item
      state.message = `${item.name} equipped from pack.`
      return { ...state }
    })
  },
  toggleInventory: () => {
    set((state) => ({ inventoryOpen: !state.inventoryOpen }))
  },
}))

export const useDerivedStats = (): StatBlock => getDerivedStats(useGameStore.getState())

export const selectNearbyLoot = (state: GameState): NearbyLootInfo | null => getNearbyLoot(state)

export const getRoomBoundary = () => ROOM_BOUNDARY

export const getPlayerHealthPercent = (state: GameState): number => {
  const derived = getDerivedStats(state)
  return clamp(state.player.hp / derived.maxHealth, 0, 1)
}

export const getItemDelta = (state: GameState, item: Item) => {
  const equipped = state.equipment[item.slot]
  return item.score - equipped.score
}

export const getItemColor = (item: Item) => rarityColors[item.rarity]
