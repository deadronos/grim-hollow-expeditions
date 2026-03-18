export type Vec2 = {
  x: number
  y: number
}

export type Phase = 'hub' | 'run' | 'summary'
export type RoomType = 'start' | 'combat' | 'treasure' | 'healing' | 'elite' | 'boss'
export type EnemyType =
  | 'skeleton-soldier'
  | 'skeleton-archer'
  | 'exploding-skull'
  | 'crypt-brute'
  | 'bone-warden'
export type ItemSlot = 'weapon' | 'armor' | 'ring'
export type ItemRarity = 'common' | 'magic' | 'rare'
export type UpgradeKey = 'vitality' | 'edge' | 'fortune' | 'grace'
export type EffectType = 'slash' | 'slam' | 'burst' | 'heal'
export type ProjectileType = 'arrow' | 'bone'

export type StatBlock = {
  maxHealth: number
  damage: number
  attackSpeed: number
  critChance: number
  armor: number
  moveSpeed: number
  lifeSteal: number
}

export type PartialStats = Partial<StatBlock>

export type Item = {
  id: string
  name: string
  slot: ItemSlot
  rarity: ItemRarity
  score: number
  stats: PartialStats
}

export type Equipment = Record<ItemSlot, Item>

export type PlayerState = {
  pos: Vec2
  facing: number
  hp: number
  attackCooldown: number
  slamCooldown: number
  dashCooldown: number
  dashTimer: number
  invuln: number
  flash: number
}

export type EnemyState = {
  id: string
  type: EnemyType
  name: string
  pos: Vec2
  hp: number
  maxHp: number
  speed: number
  radius: number
  damage: number
  attackCooldown: number
  flash: number
  elite: boolean
  windup: number
  patternIndex: number
}

export type Projectile = {
  id: string
  type: ProjectileType
  owner: 'enemy'
  pos: Vec2
  velocity: Vec2
  radius: number
  damage: number
  ttl: number
}

export type Telegraph = {
  id: string
  pos: Vec2
  radius: number
  ttl: number
  duration: number
  damage: number
  label: string
}

export type LootDrop = {
  id: string
  item: Item
  pos: Vec2
}

export type DamageText = {
  id: string
  pos: Vec2
  value: string
  ttl: number
  color: string
}

export type Effect = {
  id: string
  type: EffectType
  pos: Vec2
  radius: number
  ttl: number
  duration: number
}

export type SpawnRequest = {
  type: EnemyType
  count: number
}

export type RoomState = {
  id: string
  title: string
  subtitle: string
  type: RoomType
  cleared: boolean
  rewardLabel: string
  spawns: SpawnRequest[]
}

export type SummaryState = {
  victory: boolean
  roomsCleared: number
  goldEarned: number
  bossDefeated: boolean
  enemiesSlain: number
}

export type MetaState = {
  goldBank: number
  upgrades: Record<UpgradeKey, number>
}

export type RunStats = {
  gold: number
  blessing: string
  rareBonus: number
  enemiesSlain: number
}

export type GameInput = {
  move: Vec2
  aim: Vec2
  attackHeld: boolean
  wantsSlam: boolean
  wantsDash: boolean
  wantsInteract: boolean
}

export type NearbyLootInfo = {
  drop: LootDrop
  distance: number
}
