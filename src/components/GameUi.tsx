import {
  getItemDelta,
  getPlayerHealthPercent,
  selectNearbyLoot,
  useGameStore,
} from '../game/store'
import {
  getUpgradeCost,
  getUpgradeDescription,
  rarityLabel,
  statLabels,
} from '../game/content'
import type { Item, UpgradeKey } from '../game/types'

const formatStatValue = (key: string, value: number): string => {
  if (key === 'critChance' || key === 'lifeSteal') {
    return `${Math.round(value * 100)}%`
  }
  if (key === 'attackSpeed' || key === 'moveSpeed') {
    return value.toFixed(2)
  }
  return `${Math.round(value)}`
}

const ItemStats = ({ item }: { item: Item }) => (
  <div>
    {Object.entries(item.stats).map(([key, value]) => (
      <div key={`${item.id}-${key}`} className="item-line">
        {statLabels[key as keyof typeof statLabels]} +{formatStatValue(key, value)}
      </div>
    ))}
  </div>
)

const HubPanel = () => {
  const startRun = useGameStore((state) => state.startRun)
  const meta = useGameStore((state) => state.meta)
  const buyUpgrade = useGameStore((state) => state.buyUpgrade)
  const upgrades = Object.keys(meta.upgrades) as UpgradeKey[]

  return (
    <section className="panel hero-panel">
      <p className="loot-rarity rare">Grim Hollow Expeditions</p>
      <h1 className="hero-title">Descend, loot, return stronger.</h1>
      <p className="hero-copy">
        A dark fantasy browser crawler tuned for short runs: clear sealed rooms, equip quick upgrades, defeat the Bone Warden, bank gold, and repeat.
      </p>
      <div className="stats-grid">
        <article className="stat-card">
          <strong>Banked Gold</strong>
          <div className="stat-value">{meta.goldBank}</div>
          <div className="muted">Persistent across expeditions</div>
        </article>
        <article className="stat-card">
          <strong>Run Length</strong>
          <div className="stat-value">6 rooms</div>
          <div className="muted">2 combat, 1 treasure, 1 elite, 1 boss</div>
        </article>
      </div>
      <h2 className="section-title" style={{ marginTop: 20 }}>
        Cathedral Rites
      </h2>
      <div className="upgrade-grid" style={{ marginTop: 12 }}>
        {upgrades.map((upgrade) => {
          const level = meta.upgrades[upgrade]
          const cost = getUpgradeCost(upgrade, level)
          return (
            <article key={upgrade} className="upgrade-card">
              <strong>{upgrade[0].toUpperCase() + upgrade.slice(1)}</strong>
              <div className="muted">Level {level}</div>
              <div className="item-subtle">{getUpgradeDescription(upgrade)}</div>
              <div className="button-row">
                <span className="upgrade-cost">Cost: {cost} gold</span>
                <button className="pill-button" onClick={() => buyUpgrade(upgrade)} disabled={meta.goldBank < cost}>
                  Buy Rite
                </button>
              </div>
            </article>
          )
        })}
      </div>
      <div className="hero-actions" style={{ marginTop: 18 }}>
        <button className="primary-button" onClick={() => startRun()}>
          Start Expedition
        </button>
      </div>
    </section>
  )
}

const HudPanel = () => {
  const room = useGameStore((state) => state.rooms[state.roomIndex])
  const runStats = useGameStore((state) => state.runStats)
  const player = useGameStore((state) => state.player)
  const phase = useGameStore((state) => state.phase)
  const inventoryOpen = useGameStore((state) => state.inventoryOpen)
  const toggleInventory = useGameStore((state) => state.toggleInventory)
  const healthPercent = useGameStore((state) => getPlayerHealthPercent(state))
  const maxHp = useGameStore((state) => {
    const derived = state.equipment
    const armorBonus = Object.values(derived).reduce((sum, item) => sum + (item.stats.maxHealth ?? 0), 0)
    return 100 + state.meta.upgrades.vitality * 8 + armorBonus
  })

  return (
    <section className="panel hud-panel">
      <p className="loot-rarity magic">Warrior of the Hollow</p>
      <h2 className="section-title">{phase === 'hub' ? 'Cathedral Hub' : room?.title ?? 'Expedition'}</h2>
      <div className="muted">{room?.subtitle ?? 'Spend gold on permanent rites, then descend.'}</div>
      <div className="life-bar-shell">
        <div className="life-bar-fill" style={{ width: `${healthPercent * 100}%` }} />
      </div>
      <div className="button-row">
        <span>
          {Math.round(player.hp)} / {Math.round(maxHp)} HP
        </span>
        <span>Gold: {runStats.gold}</span>
      </div>
      <div className="skill-row">
        {[
          ['Basic Attack', 'LMB', 'Fast cleave in a frontal arc.', 1],
          ['Ground Slam', 'Q', 'Big area burst, strong crit chance.', player.slamCooldown],
          ['Dash', 'E', 'Quick escape and short invulnerability.', player.dashCooldown],
        ].map(([title, keybind, description, cooldown]) => {
          const cooldownValue = Number(cooldown)
          const maxValue = title === 'Ground Slam' ? 4.4 : title === 'Dash' ? 5.2 : 1
          const progress = title === 'Basic Attack' ? 1 : 1 - Math.min(1, cooldownValue / maxValue)
          return (
            <article key={title} className="skill-card">
              <strong>{title}</strong>
              <div className="skill-meta">{keybind}</div>
              <div className="item-subtle">{description}</div>
              <div className="cooldown-shell">
                <div className="cooldown-fill" style={{ width: `${progress * 100}%` }} />
              </div>
            </article>
          )
        })}
      </div>
      <div style={{ marginTop: 18 }} className="legend">
        `WASD` move, `F` interact, mouse aim, left click attack.
      </div>
      <div style={{ marginTop: 12 }} className="button-row">
        <button className="secondary-button" onClick={() => toggleInventory()}>
          {inventoryOpen ? 'Hide Inventory' : 'Show Inventory'}
        </button>
      </div>
    </section>
  )
}

const InventoryPanel = () => {
  const equipment = useGameStore((state) => state.equipment)
  const backpack = useGameStore((state) => state.backpack)
  const equipItem = useGameStore((state) => state.equipItem)
  const inventoryOpen = useGameStore((state) => state.inventoryOpen)

  if (!inventoryOpen) {
    return null
  }

  return (
    <section className="panel inventory-panel">
      <h2 className="section-title">Inventory</h2>
      <p className="muted">Quick comparison and one-click equips keep the run moving.</p>
      <h3 className="section-title" style={{ marginTop: 16, fontSize: '0.86rem' }}>
        Equipped
      </h3>
      <div className="equipment-grid" style={{ marginTop: 10 }}>
        {Object.values(equipment).map((item) => (
          <article key={item.id} className="equip-card">
            <strong>{item.slot.toUpperCase()}</strong>
            <div className={`loot-rarity ${item.rarity}`}>{rarityLabel(item.rarity)}</div>
            <div>{item.name}</div>
            <ItemStats item={item} />
          </article>
        ))}
      </div>
      <h3 className="section-title" style={{ marginTop: 18, fontSize: '0.86rem' }}>
        Pack
      </h3>
      <div className="backpack-grid" style={{ marginTop: 10 }}>
        {backpack.length === 0 && <div className="muted">No spare loot yet.</div>}
        {backpack.map((item) => (
          <article key={item.id} className="item-card">
            <strong>{item.name}</strong>
            <div className={`loot-rarity ${item.rarity}`}>{rarityLabel(item.rarity)}</div>
            <ItemStats item={item} />
            <button className="pill-button" onClick={() => equipItem(item.id)}>
              Equip
            </button>
          </article>
        ))}
      </div>
    </section>
  )
}

const NearbyLootCard = () => {
  const nearby = useGameStore((state) => selectNearbyLoot(state))
  const equipItem = useGameStore((state) => state.equipItem)
  const interact = useGameStore((state) => state.interact)
  const delta = useGameStore((state) => (nearby ? getItemDelta(state, nearby.drop.item) : 0))

  if (!nearby) {
    return null
  }

  return (
    <article className="compare-card">
      <div className={`loot-rarity ${nearby.drop.item.rarity}`}>{rarityLabel(nearby.drop.item.rarity)} nearby</div>
      <strong>{nearby.drop.item.name}</strong>
      <div className="item-subtle">{nearby.drop.item.slot.toUpperCase()} drop</div>
      <ItemStats item={nearby.drop.item} />
      <div className="compare-statline">
        <span className="item-subtle">Versus equipped</span>
        <span className={delta >= 0 ? 'positive' : 'negative'}>
          {delta >= 0 ? '+' : ''}
          {Math.round(delta)}
        </span>
      </div>
      <div className="compare-actions">
        <button className="pill-button" onClick={() => equipItem(nearby.drop.id)}>
          Equip Now
        </button>
        <button className="pill-button" onClick={() => interact()}>
          Take to Pack
        </button>
      </div>
      <div className="legend">Walk close and press `F` for the same pickup.</div>
    </article>
  )
}

const RunBanner = () => {
  const room = useGameStore((state) => state.rooms[state.roomIndex])
  const message = useGameStore((state) => state.message)
  const phase = useGameStore((state) => state.phase)
  const runStats = useGameStore((state) => state.runStats)
  const advanceRoom = useGameStore((state) => state.advanceRoom)
  const rooms = useGameStore((state) => state.rooms)
  const roomIndex = useGameStore((state) => state.roomIndex)

  if (phase === 'hub') {
    return null
  }

  return (
    <>
      <div className="top-strip">
        <section className="banner">
          <h2 className="room-title">{room?.title}</h2>
          <p>{message}</p>
          <div className="room-strip">
            {rooms.map((entry, index) => (
              <div
                key={entry.id}
                className={`room-node${index === roomIndex ? ' active' : ''}${entry.cleared ? ' cleared' : ''}`}
              >
                {entry.type}
              </div>
            ))}
          </div>
        </section>
      </div>
      <div className="bottom-strip">
        <section className="banner">
          <div className="button-row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="legend">Blessing: {runStats.blessing}</span>
            {room?.cleared && room.type !== 'boss' && (
              <button className="primary-button" onClick={() => advanceRoom()}>
                Advance to Next Room
              </button>
            )}
          </div>
          <div className="legend" style={{ marginTop: 10 }}>
            Press `F` to collect nearby loot or descend once the room is clear.
          </div>
        </section>
      </div>
    </>
  )
}

const SummaryOverlay = () => {
  const summary = useGameStore((state) => state.summary)
  const returnToHub = useGameStore((state) => state.returnToHub)
  const meta = useGameStore((state) => state.meta)

  if (!summary) {
    return null
  }

  return (
    <section className="summary-wrap">
      <article className="summary-card">
        <div className={`loot-rarity ${summary.victory ? 'rare' : 'magic'}`}>
          {summary.victory ? 'Expedition Cleared' : 'Expedition Lost'}
        </div>
        <h2>{summary.victory ? 'The Bone Warden falls.' : 'The crypt claims another run.'}</h2>
        <ul className="list-reset" style={{ marginTop: 16 }}>
          <li>Rooms cleared: {summary.roomsCleared}</li>
          <li>Gold banked: {summary.goldEarned}</li>
          <li>Enemies slain: {summary.enemiesSlain}</li>
          <li>Boss defeated: {summary.bossDefeated ? 'Yes' : 'No'}</li>
          <li>Total permanent gold: {meta.goldBank}</li>
        </ul>
        <div className="summary-actions" style={{ marginTop: 18 }}>
          <button className="primary-button" onClick={() => returnToHub()}>
            Return to Hub
          </button>
        </div>
      </article>
    </section>
  )
}

export const GameUi = () => {
  const phase = useGameStore((state) => state.phase)

  return (
    <div className="ui-layer">
      <HudPanel />
      <InventoryPanel />
      <RunBanner />
      {phase === 'hub' && <HubPanel />}
      {phase === 'run' && <NearbyLootCard />}
      <SummaryOverlay />
    </div>
  )
}
