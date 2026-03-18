import type { Vec2 } from './types'

export const vec = (x = 0, y = 0): Vec2 => ({ x, y })

export const add = (a: Vec2, b: Vec2): Vec2 => ({
  x: a.x + b.x,
  y: a.y + b.y,
})

export const subtract = (a: Vec2, b: Vec2): Vec2 => ({
  x: a.x - b.x,
  y: a.y - b.y,
})

export const scale = (value: Vec2, scalar: number): Vec2 => ({
  x: value.x * scalar,
  y: value.y * scalar,
})

export const length = (value: Vec2): number => Math.hypot(value.x, value.y)

export const normalize = (value: Vec2): Vec2 => {
  const size = length(value)
  if (size <= 0.0001) {
    return vec(0, 0)
  }

  return scale(value, 1 / size)
}

export const distance = (a: Vec2, b: Vec2): number => length(subtract(a, b))

export const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value))

export const clampVec = (value: Vec2, boundary: number): Vec2 => ({
  x: clamp(value.x, -boundary, boundary),
  y: clamp(value.y, -boundary, boundary),
})

export const lerp = (from: number, to: number, amount: number): number =>
  from + (to - from) * amount

export const angleFrom = (from: Vec2, to: Vec2): number => {
  const dir = subtract(to, from)
  return Math.atan2(dir.y, dir.x)
}

export const dot = (a: Vec2, b: Vec2): number => a.x * b.x + a.y * b.y

export const fromAngle = (angle: number): Vec2 => ({
  x: Math.cos(angle),
  y: Math.sin(angle),
})
