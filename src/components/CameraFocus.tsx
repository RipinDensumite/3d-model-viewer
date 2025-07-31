import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import { Vector3 } from 'three'

type PredefinedView = {
  position: Vector3
  target: Vector3
  name: string
}

type CameraFocusProps = {
  target: Vector3 | null
  predefinedView?: PredefinedView | null
}

interface OrbitControlsType {
  target: Vector3
  update: () => void
}

const CameraFocus = ({ target, predefinedView }: CameraFocusProps) => {
  const { camera, controls } = useThree()

  useEffect(() => {
    if (predefinedView) {
      // Use predefined camera position and target
      camera.position.copy(predefinedView.position)
      if (controls && 'target' in controls && 'update' in controls) {
        (controls as OrbitControlsType).target.copy(predefinedView.target)
        ;(controls as OrbitControlsType).update()
      }
    } else if (target) {
      // Focus on a specific target (when clicking on a part)
      const offset = new Vector3(2, 2, 2)
      camera.position.copy(target.clone().add(offset))
      if (controls && 'target' in controls && 'update' in controls) {
        (controls as OrbitControlsType).target.copy(target)
        ;(controls as OrbitControlsType).update()
      }
    }
  }, [target, predefinedView, camera, controls])

  return null
}

export default CameraFocus
