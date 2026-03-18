import type {
  EnemyType,
  Equipment,
  Item,
  ItemRarity,
  ItemSlot,
  MetaState,
  PartialStats,
  RoomState,
  SpawnRequest,
  StatBlock,
  UpgradeKey,
} from './types'

const id = () => crypto.randomUUID()

type SlotTemplate = {
  prefix: string[]
  base: string[]
  weights: PartialStats[]
}

const baseStats: StatBlock = {
  maxHealth: 100,
  damage: 14,
  attackSpeed: 1.2,
  critChance: 0.08,
  armor: 6,
  moveSpeed: 5.4,
  lifeSteal: 0.02,
}

const rarityOrder: ItemRarity[] = ['common', 'magic', 'rare']

const slotTemplates: Record<ItemSlot, SlotTemplate> = {
  weapon: {
    prefix: ['Rustbitten', 'Ashen', 'Warden', 'Cathedral', 'Grim'],
    base: ['Greatsword', 'War Axe', 'Longblade', 'Crypt Cleaver', 'Iron Maul'],
    weights: [
      { damage: 2.5 },
      { damage: 2, attackSpeed: 0.08 },
      { damage: 1.5, critChance: 0.04 },
      { damage: 1.2, lifeSteal: 0.02 },
    ],
  },
  armor: {
    prefix: ['Tarnished', 'Dread', 'Chapel', 'Rookguard', 'Gloam'],
    base: ['Cuirass', 'Mail', 'Breastplate', 'Hauberk', 'Vestments'],
    weights: [
      { maxHealth: 12 },
      { armor: 2.4, maxHealth: 8 },
      { armor: 3.2 },
      { maxHealth: 8, moveSpeed: 0.18 },
    ],
  },
  ring: {
    prefix: ['Bone', 'Mourning', 'Saintless', 'Hexed', 'Duskwind'],
    base: ['Band', 'Seal', 'Loop', 'Signet', 'Circle'],
    weights: [
      { critChance: 0.04 },
      { moveSpeed: 0.24 },
      { lifeSteal: 0.03 },
      { damage: 1.4, critChance: 0.02 },
    ],
  },
}

const starterItems: Equipment = {
  weapon: {
    id: id(),
    name: 'Warrior Training Blade',
    slot: 'weapon',
    rarity: 'common',
    score: 8,
    stats: { damage: 2, attackSpeed: 0.06 },
  },
  armor: {
    id: id(),
    name: 'Worn Chapel Mail',
    slot: 'armor',
    rarity: 'common',
    score: 8,
    stats: { maxHealth: 12, armor: 1.5 },
  },
  ring: {
    id: id(),
    name: 'Pilgrim Ring',
    slot: 'ring',
    rarity: 'common',
    score: 7,
    stats: { critChance: 0.02, moveSpeed: 0.14 },
  },
}

const roomSequence: Omit<RoomState, 'id'>[] = [
  {
    title: 'Ruined Narthex',
    subtitle: 'A cold threshold before the descent.',
    type: 'start',
    cleared: true,
    rewardLabel: 'Breach the sealed stair',
    spawns: [],
  },
  {
    title: 'Ashen Nave',
    subtitle: 'Skeletons stir beneath soot-black pews.',
    type: 'combat',
    cleared: false,
    rewardLabel: 'Gold cache and weapon drop',
    spawns: [
      { type: 'skeleton-soldier', count: 3 },
      { type: 'skeleton-archer', count: 1 },
    ],
  },
  {
    title: 'Cinder Reliquary',
    subtitle: 'Exploding skulls force constant footwork.',
    type: 'combat',
    cleared: false,
    rewardLabel: 'Ring drop and shrine gold',
    spawns: [
      { type: 'skeleton-soldier', count: 2 },
      { type: 'exploding-skull', count: 3 },
      { type: 'skeleton-archer', count: 1 },
    ],
  },
  {
    title: 'Penitent Treasury',
    subtitle: 'A quiet chamber offers breath before the elite.',
    type: 'treasure',
    cleared: false,
    rewardLabel: 'Healing draught and blessing',
    spawns: [],
  },
  {
    title: 'Gravebound Bastion',
    subtitle: 'A brute commands the dead from the center.',
    type: 'elite',
    cleared: false,
    rewardLabel: 'Rare chance spike and armor drop',
    spawns: [
      { type: 'crypt-brute', count: 1 },
      { type: 'skeleton-soldier', count: 2 },
      { type: 'skeleton-archer', count: 2 },
    ],
  },
  {
    title: 'Warden Vault',
    subtitle: 'The Bone Warden rises from the cathedral crypt.',
    type: 'boss',
    cleared: false,
    rewardLabel: 'Boss cache and expedition completion',
    spawns: [{ type: 'bone-warden', count: 1 }],
  },
]

const upgradeCosts: Record<UpgradeKey, number> = {
  vitality: 50,
  edge: 50,
  fortune: 60,
  grace: 45,
}

const upgradeDescriptions: Record<UpgradeKey, string> = {
  vitality: '+8 max health each expedition',
  edge: '+1.2 starting damage',
  fortune: '+4% rare drop chance',
  grace: '+8% healing efficiency',
}

const enemyNames: Record<EnemyType, string> = {
  'skeleton-soldier': 'Skeleton Soldier',
  'skeleton-archer': 'Skeleton Archer',
  'exploding-skull': 'Exploding Skull',
  'crypt-brute': 'Crypt Brute',
  'bone-warden': 'The Bone Warden',
}

export const rarityColors: Record<ItemRarity, string> = {
  common: '#c9bda6',
  magic: '#66a7ff',
  rare: '#e4b258',
}

export const statLabels: Record<keyof StatBlock, string> = {
  maxHealth: 'Max Health',
  damage: 'Damage',
  attackSpeed: 'Attack Speed',
  critChance: 'Crit Chance',
  armor: 'Armor',
  moveSpeed: 'Move Speed',
  lifeSteal: 'Life Steal',
}

export const getBaseStats = (): StatBlock => ({ ...baseStats })

export const getStarterEquipment = (): Equipment => ({
  weapon: { ...starterItems.weapon, id: id() },
  armor: { ...starterItems.armor, id: id() },
  ring: { ...starterItems.ring, id: id() },
})

export const createRooms = (): RoomState[] =>
  roomSequence.map((room) => ({
    ...room,
    id: id(),
    spawns: room.spawns.map((spawn: SpawnRequest) => ({ ...spawn })),
  }))

export const getUpgradeCost = (key: UpgradeKey, level: number): number =>
  Math.round(upgradeCosts[key] * (1 + level * 0.55))

export const getUpgradeDescription = (key: UpgradeKey): string =>
  upgradeDescriptions[key]

export const getEnemyName = (type: EnemyType): string => enemyNames[type]

export const rarityLabel = (rarity: ItemRarity): string => {
  const text = rarityOrder[rarityOrder.indexOf(rarity)]
  return text[0].toUpperCase() + text.slice(1)
}

const rarityValue: Record<ItemRarity, number> = {
  common: 1,
  magic: 1.35,
  rare: 1.8,
}

const clampChance = (value: number) => Math.min(0.85, Math.max(0, value))

export const createItem = (
  slot: ItemSlot,
  rarity: ItemRarity,
  extraQuality: number,
): Item => {
  const template = slotTemplates[slot]
  const parts = template.weights.slice(0, rarity === 'common' ? 1 : rarity === 'magic' ? 2 : 3)
  const statCount = rarity === 'common' ? 1 : rarity === 'magic' ? 2 : 3
  const stats: PartialStats = {}

  for (let index = 0; index < statCount; index += 1) {
    const choice = parts[Math.floor(Math.random() * parts.length)]
    for (const [key, value] of Object.entries(choice) as [keyof StatBlock, number][]) {
      const bonus = value * rarityValue[rarity] * (1 + extraQuality * 0.18)
      stats[key] = Number(((stats[key] ?? 0) + bonus).toFixed(2))
    }
  }

  const score = Object.values(stats).reduce((sum, value) => sum + value * 10, 0)

  return {
    id: id(),
    name: `${template.prefix[Math.floor(Math.random() * template.prefix.length)]} ${
      template.base[Math.floor(Math.random() * template.base.length)]
    }`,
    slot,
    rarity,
    score,
    stats,
  }
}

export const rollRarity = (meta: MetaState, roomTier: number): ItemRarity => {
  const rareChance = clampChance(0.08 + roomTier * 0.06 + meta.upgrades.fortune * 0.04)
  const magicChance = clampChance(0.34 + roomTier * 0.08)
  const roll = Math.random()

  if (roll < rareChance) {
    return 'rare'
  }

  if (roll < magicChance + rareChance) {
    return 'magic'
  }

  return 'common'
}

export const makeDropForRoom = (
  slot: ItemSlot,
  meta: MetaState,
  roomTier: number,
): Item => createItem(slot, rollRarity(meta, roomTier), roomTier)

export const getBlessings = (): string[] => [
  'Sanctified edge: +3 damage this run.',
  'Fleet oath: +0.75 move speed this run.',
  'Ravenous sigil: +4% life steal this run.',
]
