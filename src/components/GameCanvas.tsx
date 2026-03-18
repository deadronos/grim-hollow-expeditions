import { Billboard, PerspectiveCamera, Text } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import { useMemo } from 'react'
import { rarityColors } from '../game/content'
import { add, fromAngle } from '../game/math'
import { getRoomBoundary, useGameStore } from '../game/store'
import type { GameControlsHandle } from '../hooks/useGameControls'
import { useGameControls } from '../hooks/useGameControls'

const RoomShell = () => {
  const room = useGameStore((state) => state.rooms[state.roomIndex])
  const phase = useGameStore((state) => state.phase)
  const boundary = getRoomBoundary()

  return (
    <group>
      <fog attach="fog" args={['#09090d', 10, 28]} />
      <ambientLight intensity={0.55} color="#dbc1a0" />
      <directionalLight position={[5, 9, 4]} intensity={1.1} color="#f4dfbf" castShadow />
      <pointLight position={[-5.2, 1.8, 4.8]} intensity={28} color="#ff7c46" distance={9} />
      <pointLight position={[5.2, 1.8, 4.8]} intensity={28} color="#ff7c46" distance={9} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[18, 18]} />
        <meshStandardMaterial color={phase === 'hub' ? '#1a1717' : '#181214'} roughness={0.95} />
      </mesh>
      <mesh position={[0, -0.15, 0]} receiveShadow>
        <boxGeometry args={[16.8, 0.3, 16.8]} />
        <meshStandardMaterial color="#1a1112" roughness={1} />
      </mesh>
      {[
        [-boundary, 0.9, 0],
        [boundary, 0.9, 0],
        [0, 0.9, boundary],
        [0, 0.9, -boundary],
      ].map((wall, index) => (
        <mesh
          key={`${wall[0]}-${index}`}
          position={wall as [number, number, number]}
          rotation={index < 2 ? [0, Math.PI / 2, 0] : [0, 0, 0]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={index < 2 ? [0.5, 1.8, 16] : [16, 1.8, 0.5]} />
          <meshStandardMaterial color="#221a1b" roughness={0.94} />
        </mesh>
      ))}
      {[
        [-5.2, 0.7, 4.8],
        [5.2, 0.7, 4.8],
      ].map((torch, index) => (
        <group key={`${torch[0]}-${index}`} position={torch as [number, number, number]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.12, 0.16, 1.4, 8]} />
            <meshStandardMaterial color="#47342a" />
          </mesh>
          <mesh position={[0, 0.82, 0]}>
            <sphereGeometry args={[0.18, 10, 10]} />
            <meshBasicMaterial color="#ff7a46" />
          </mesh>
        </group>
      ))}
      {phase === 'run' && room?.cleared && (
        <group position={[0, 0.2, 6.5]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.75, 1.15, 32]} />
            <meshBasicMaterial color="#e9bf78" transparent opacity={0.65} />
          </mesh>
          <Text position={[0, 0.25, 0]} fontSize={0.28} color="#ffe4b7">
            Exit Open
          </Text>
        </group>
      )}
    </group>
  )
}

const HealthBar = ({ hp, maxHp, color }: { hp: number; maxHp: number; color: string }) => {
  const width = Math.max(0, hp / maxHp)
  return (
    <group position={[0, 1.34, 0]}>
      <mesh position={[0, 0, -0.01]}>
        <planeGeometry args={[1.3, 0.12]} />
        <meshBasicMaterial color="#1d1014" transparent opacity={0.75} />
      </mesh>
      <mesh position={[-0.65 + width * 0.65, 0, 0]}>
        <planeGeometry args={[1.3 * width, 0.08]} />
        <meshBasicMaterial color={color} />
      </mesh>
    </group>
  )
}

const PlayerAvatar = () => {
  const player = useGameStore((state) => state.player)
  const maxHealth = useGameStore((state) =>
    100 +
    state.meta.upgrades.vitality * 8 +
    Object.values(state.equipment).reduce((sum, item) => sum + (item.stats.maxHealth ?? 0), 0),
  )
  const swordPos = useMemo(() => {
    const facing = fromAngle(player.facing)
    return add({ x: 0, y: 0 }, { x: facing.x * 0.52, y: facing.y * 0.52 })
  }, [player.facing])

  return (
    <group position={[player.pos.x, 0.58, player.pos.y]}>
      <mesh castShadow>
        <capsuleGeometry args={[0.32, 0.85, 6, 12]} />
        <meshStandardMaterial color={player.flash > 0 ? '#ffd7ce' : '#c9c2b2'} roughness={0.45} />
      </mesh>
      <mesh position={[swordPos.x, 0.12, swordPos.y]} rotation={[0.4, -player.facing, 0]}>
        <boxGeometry args={[0.1, 0.7, 0.15]} />
        <meshStandardMaterial color="#d4a964" metalness={0.2} roughness={0.35} />
      </mesh>
      <HealthBar hp={player.hp} maxHp={maxHealth} color="#d76c55" />
    </group>
  )
}

const EnemyAvatar = () => {
  const enemies = useGameStore((state) => state.enemies)

  return (
    <>
      {enemies.map((enemy) => {
        const color =
          enemy.type === 'bone-warden'
            ? '#d1b782'
            : enemy.type === 'crypt-brute'
              ? '#8f7a73'
              : enemy.type === 'exploding-skull'
                ? '#d95f4b'
                : enemy.type === 'skeleton-archer'
                  ? '#8ea3b4'
                  : '#c0b7aa'

        const geometry =
          enemy.type === 'bone-warden'
            ? [1.1, 1.35, 8]
            : enemy.type === 'crypt-brute'
              ? [0.7, 1, 6]
              : enemy.type === 'exploding-skull'
                ? [0.3, 10, 10]
                : [0.42, 0.84, 6]

        return (
          <group
            key={enemy.id}
            position={[enemy.pos.x, enemy.type === 'exploding-skull' ? 0.42 : 0.58, enemy.pos.y]}
          >
            {enemy.type === 'exploding-skull' ? (
              <mesh castShadow>
                <sphereGeometry args={geometry as [number, number, number]} />
                <meshStandardMaterial
                  color={enemy.flash > 0 ? '#fff3d0' : color}
                  emissive="#922618"
                  emissiveIntensity={0.45}
                />
              </mesh>
            ) : (
              <mesh castShadow>
                <capsuleGeometry args={geometry as [number, number, number]} />
                <meshStandardMaterial color={enemy.flash > 0 ? '#fff7e1' : color} />
              </mesh>
            )}
            <HealthBar
              hp={enemy.hp}
              maxHp={enemy.maxHp}
              color={enemy.type === 'bone-warden' ? '#f0c36d' : '#ca5b4c'}
            />
            {enemy.type === 'bone-warden' && (
              <Text position={[0, 1.9, 0]} fontSize={0.23} color="#f2dcaa">
                Bone Warden
              </Text>
            )}
          </group>
        )
      })}
    </>
  )
}

const ProjectileLayer = () => {
  const projectiles = useGameStore((state) => state.projectiles)

  return (
    <>
      {projectiles.map((projectile) => (
        <mesh key={projectile.id} position={[projectile.pos.x, 0.4, projectile.pos.y]} castShadow>
          <sphereGeometry args={[projectile.radius, 8, 8]} />
          <meshBasicMaterial color={projectile.type === 'arrow' ? '#d4b89b' : '#f0deba'} />
        </mesh>
      ))}
    </>
  )
}

const TelegraphLayer = () => {
  const telegraphs = useGameStore((state) => state.telegraphs)
  const effects = useGameStore((state) => state.effects)

  return (
    <>
      {telegraphs.map((telegraph) => {
        const progress = telegraph.ttl / telegraph.duration
        return (
          <mesh key={telegraph.id} position={[telegraph.pos.x, 0.03, telegraph.pos.y]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[Math.max(0.15, telegraph.radius * 0.7), telegraph.radius, 48]} />
            <meshBasicMaterial color="#bf4338" transparent opacity={0.25 + (1 - progress) * 0.5} />
          </mesh>
        )
      })}
      {effects.map((effect) => {
        const progress = effect.ttl / effect.duration
        const radius = effect.radius * (1 + (1 - progress) * 0.35)
        const color =
          effect.type === 'burst'
            ? '#f29b7a'
            : effect.type === 'heal'
              ? '#9dd490'
              : effect.type === 'slam'
                ? '#f2d29f'
                : '#f6e6bf'
        return (
          <mesh key={effect.id} position={[effect.pos.x, 0.04, effect.pos.y]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[Math.max(0.08, radius * 0.55), radius, 36]} />
            <meshBasicMaterial color={color} transparent opacity={progress * 0.75} />
          </mesh>
        )
      })}
    </>
  )
}

const LootLayer = () => {
  const loot = useGameStore((state) => state.loot)

  return (
    <>
      {loot.map((drop) => (
        <group key={drop.id} position={[drop.pos.x, 0.3, drop.pos.y]}>
          <mesh position={[0, 0.32, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 0.7, 8]} />
            <meshBasicMaterial color={rarityColors[drop.item.rarity]} transparent opacity={0.8} />
          </mesh>
          <mesh>
            <octahedronGeometry args={[0.18, 0]} />
            <meshStandardMaterial
              color={rarityColors[drop.item.rarity]}
              emissive={rarityColors[drop.item.rarity]}
              emissiveIntensity={0.5}
            />
          </mesh>
        </group>
      ))}
    </>
  )
}

const DamageTextLayer = () => {
  const damageTexts = useGameStore((state) => state.damageTexts)

  return (
    <>
      {damageTexts.map((entry) => (
        <Billboard key={entry.id} position={[entry.pos.x, 1.55, entry.pos.y]}>
          <Text fontSize={0.26} color={entry.color}>
            {entry.value}
          </Text>
        </Billboard>
      ))}
    </>
  )
}

const SimulationBridge = ({ controls }: { controls: GameControlsHandle }) => {
  const tick = useGameStore((state) => state.tick)
  const screenShake = useGameStore((state) => state.screenShake)

  useFrame((frameState, delta) => {
    const snapshot = controls.consume()
    tick(Math.min(delta, 0.033), snapshot)
    const wobble = screenShake > 0 ? screenShake * 0.15 : 0
    frameState.camera.position.x = wobble ? Math.sin(frameState.clock.elapsedTime * 38) * wobble : 0
    frameState.camera.position.y = 13.8 + (wobble ? Math.cos(frameState.clock.elapsedTime * 44) * wobble : 0)
    frameState.camera.position.z = 11.2
    frameState.camera.lookAt(0, 0, 0)
  })

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0.01, 0]}
      onPointerMove={(event) => controls.setAim({ x: event.point.x, y: event.point.z })}
    >
      <planeGeometry args={[18, 18]} />
      <meshBasicMaterial transparent opacity={0} />
    </mesh>
  )
}

export const GameCanvas = () => {
  const controls = useGameControls()

  return (
    <Canvas className="scene-canvas" shadows gl={{ antialias: true }}>
      <color attach="background" args={['#07070b']} />
      <PerspectiveCamera makeDefault position={[0, 13.8, 11.2]} fov={42} />
      <RoomShell />
      <PlayerAvatar />
      <EnemyAvatar />
      <ProjectileLayer />
      <TelegraphLayer />
      <LootLayer />
      <DamageTextLayer />
      <SimulationBridge controls={controls} />
    </Canvas>
  )
}
