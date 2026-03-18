import { useEffect, useRef } from 'react'
import type { GameInput, Vec2 } from '../game/types'

type ControlRef = {
  attackHeld: boolean
  wantsSlam: boolean
  wantsDash: boolean
  wantsInteract: boolean
  move: Vec2
  aim: Vec2
}

const initialState = (): ControlRef => ({
  attackHeld: false,
  wantsSlam: false,
  wantsDash: false,
  wantsInteract: false,
  move: { x: 0, y: 0 },
  aim: { x: 0, y: 0 },
})

export const useGameControls = () => {
  const stateRef = useRef<ControlRef>(initialState())
  const keyStateRef = useRef<Record<string, boolean>>({})

  useEffect(() => {
    const recomputeMove = () => {
      stateRef.current.move = {
        x:
          (keyStateRef.current.KeyD ? 1 : 0) -
          (keyStateRef.current.KeyA ? 1 : 0),
        y:
          (keyStateRef.current.KeyW ? 1 : 0) -
          (keyStateRef.current.KeyS ? 1 : 0),
      }
    }

    const onKeyDown = (event: KeyboardEvent) => {
      keyStateRef.current[event.code] = true
      if (event.code === 'Digit1' || event.code === 'KeyQ') {
        stateRef.current.wantsSlam = true
      }
      if (event.code === 'Digit2' || event.code === 'Space') {
        stateRef.current.wantsDash = true
      }
      if (event.code === 'KeyE' || event.code === 'KeyF') {
        stateRef.current.wantsInteract = true
      }
      recomputeMove()
    }

    const onKeyUp = (event: KeyboardEvent) => {
      keyStateRef.current[event.code] = false
      recomputeMove()
    }

    const onMouseDown = (event: MouseEvent) => {
      if (event.button === 0) {
        stateRef.current.attackHeld = true
      }
    }

    const onMouseUp = (event: MouseEvent) => {
      if (event.button === 0) {
        stateRef.current.attackHeld = false
      }
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mouseup', onMouseUp)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [])

  const setAim = (aim: Vec2) => {
    stateRef.current.aim = aim
  }

  const consume = (): GameInput => {
    const snapshot: GameInput = {
      move: stateRef.current.move,
      aim: stateRef.current.aim,
      attackHeld: stateRef.current.attackHeld,
      wantsSlam: stateRef.current.wantsSlam,
      wantsDash: stateRef.current.wantsDash,
      wantsInteract: stateRef.current.wantsInteract,
    }

    stateRef.current.wantsSlam = false
    stateRef.current.wantsDash = false
    stateRef.current.wantsInteract = false
    return snapshot
  }

  return {
    consume,
    setAim,
  }
}

export type GameControlsHandle = {
  consume: () => GameInput
  setAim: (aim: Vec2) => void
}
