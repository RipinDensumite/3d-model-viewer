import { useEffect, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import { Vector3, Box3,PerspectiveCamera } from 'three'

type PredefinedView = {
  position: Vector3
  target: Vector3
  name: string
}

type CameraFocusProps = {
  target: Vector3 | null
  predefinedView?: PredefinedView | null
  modelBounds?: Box3 | null
  autoFitOnLoad?: boolean
}

interface OrbitControlsType {
  target: Vector3
  update: () => void
}

const CameraFocus = ({ target, predefinedView, modelBounds, autoFitOnLoad = false }: CameraFocusProps) => {
  const { camera, controls } = useThree()
  const hasAutoFitted = useRef(false)
  const lastPredefinedView = useRef<string | null>(null)

  useEffect(() => {
    if (predefinedView && modelBounds) {
      // Only apply predefined view if it's different from the last one
      const currentViewName = predefinedView.name
      if (lastPredefinedView.current !== currentViewName) {
        // Calculate model center and size
        const center = new Vector3()
        modelBounds.getCenter(center)
        const size = modelBounds.getSize(new Vector3())
        const maxDim = Math.max(size.x, size.y, size.z)
        
        // Calculate distance needed to fit the model
        let distance: number
        if (camera instanceof PerspectiveCamera) {
          const fov = camera.fov * (Math.PI / 180) // Convert to radians
          distance = maxDim / (2 * Math.tan(fov / 2)) * 1.5 // 1.5 for padding
        } else {
          // For orthographic camera, use a simpler distance calculation
          distance = maxDim * 2
        }
        
        // Calculate camera position based on predefined view direction
        const direction = predefinedView.position.clone().normalize()
        const newPosition = center.clone().add(direction.multiplyScalar(distance))
        
        camera.position.copy(newPosition)
        if (controls && 'target' in controls && 'update' in controls) {
          (controls as OrbitControlsType).target.copy(center)
          ;(controls as OrbitControlsType).update()
        }
        
        lastPredefinedView.current = currentViewName
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
  }, [target, predefinedView, modelBounds, camera, controls])

  // Separate effect for auto-fit on load (only runs once)
  useEffect(() => {
    if (autoFitOnLoad && modelBounds && !hasAutoFitted.current) {
      // Auto-fit the model on first load
      const center = new Vector3()
      modelBounds.getCenter(center)
      const size = modelBounds.getSize(new Vector3())
      const maxDim = Math.max(size.x, size.y, size.z)
      
      let distance: number
      if (camera instanceof PerspectiveCamera) {
        const fov = camera.fov * (Math.PI / 180)
        distance = maxDim / (2 * Math.tan(fov / 2)) * 1.5
      } else {
        // For orthographic camera, use a simpler distance calculation
        distance = maxDim * 2
      }
      
      // Use overview direction
      const direction = new Vector3(1, 1, 1).normalize()
      const newPosition = center.clone().add(direction.multiplyScalar(distance))
      
      camera.position.copy(newPosition)
      if (controls && 'target' in controls && 'update' in controls) {
        (controls as OrbitControlsType).target.copy(center)
        ;(controls as OrbitControlsType).update()
      }
      
      hasAutoFitted.current = true
      lastPredefinedView.current = 'overview' // Set initial view
    }
  }, [autoFitOnLoad, modelBounds, camera, controls])

  // Reset the auto-fit flag when a new model is loaded
  useEffect(() => {
    if (autoFitOnLoad) {
      hasAutoFitted.current = false
      lastPredefinedView.current = null
    }
  }, [modelBounds, autoFitOnLoad])

  return null
}

export default CameraFocus