import { useGLTF, OrbitControls, Sky, Environment } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Vector3, Box3 } from 'three'
import { Suspense, useEffect } from 'react'
import CameraFocus from './CameraFocus'

type PredefinedView = {
  position: Vector3
  target: Vector3
  name: string
}

interface ModelInterface {
  onSelectPart: (name: string, position: Vector3) => void
  onModelLoaded?: (objects: string[], bounds: Box3) => void
  modelUrl?: string
}

type Props = {
  onSelectPart: (name: string, position: Vector3) => void
  focusPosition?: Vector3 | null
  predefinedView?: PredefinedView | null
  onModelLoaded?: (objects: string[], bounds: Box3) => void
  modelUrl?: string
  modelBounds?: Box3 | null
  autoFitOnLoad?: boolean
}

const Model = ({ 
  onSelectPart, 
  onModelLoaded,
  modelUrl = '/model.glb'
}: ModelInterface) => {  
  const gltf = useGLTF(modelUrl)
  
  useEffect(() => {
    if (gltf.scene && onModelLoaded) {
      // Extract all object names from the scene
      const objectNames: string[] = []
      
      gltf.scene.traverse((child) => {
        if (child.name && child.name !== '' && child.type === 'Mesh') {
          objectNames.push(child.name)
        }
      })
      
      // Calculate bounding box
      const bounds = new Box3().setFromObject(gltf.scene)
      
      // Remove duplicates and sort alphabetically
      const uniqueObjectNames = [...new Set(objectNames)].sort()
      onModelLoaded(uniqueObjectNames, bounds)
    }
  }, [gltf.scene, onModelLoaded, modelUrl])
  
  return (
    <primitive
      object={gltf.scene}
      onClick={(e: { stopPropagation: () => void; object: { name: string; getWorldPosition: (v: Vector3) => Vector3 } }) => {
        e.stopPropagation()
        const name = e.object.name
        const position = e.object.getWorldPosition(new Vector3())
        onSelectPart(name, position)
      }}
    />
  )
}

const ModelViewer = ({ 
  onSelectPart, 
  focusPosition, 
  predefinedView, 
  onModelLoaded, 
  modelUrl, 
  modelBounds, 
  autoFitOnLoad = false 
}: Props) => {
  return (
    <Canvas 
      camera={{ position: [5, 5, 5], fov: 50 }}
      gl={{ antialias: true, alpha: false }}
    >
      {/* Earth-like Sky */}
      <Sky
        distance={450000}
        sunPosition={[100, 20, 100]}
        inclination={0}
        azimuth={0.25}
        mieCoefficient={0.005}
        mieDirectionalG={0.8}
        rayleigh={0.5}
        turbidity={2}
      />
      
      {/* Environment for realistic reflections */}
      <Environment preset="city" />
      
      {/* Earth-like lighting */}
      <ambientLight intensity={0.3} color="#87CEEB" />
      <directionalLight 
        position={[100, 20, 100]} 
        intensity={1.2}
        color="#FFF8DC"
        castShadow
        shadow-mapSize={2048}
        shadow-camera-far={200}
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-top={50}
        shadow-camera-bottom={-50}
      />
      
      {/* Additional fill light to simulate atmospheric scattering */}
      <hemisphereLight 
        groundColor="#F5DEB3" 
        intensity={0.4} 
      />
      
      {/* Rim light for atmospheric effect */}
      <directionalLight 
        position={[-50, 10, -50]} 
        intensity={0.5}
        color="#ADD8E6"
      />
      
      <Suspense fallback={null}>
        <Model onSelectPart={onSelectPart} onModelLoaded={onModelLoaded} modelUrl={modelUrl}/>
      </Suspense>
      
      <OrbitControls 
        makeDefault 
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        dampingFactor={0.05}
        enableDamping={true}
      />
      
      <CameraFocus 
        target={focusPosition || null} 
        predefinedView={predefinedView}
        modelBounds={modelBounds}
        autoFitOnLoad={autoFitOnLoad}
      />
    </Canvas>
  )
}

export default ModelViewer