import { useGLTF, OrbitControls, Sky, Environment } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Vector3, Box3, Mesh, Material, MeshStandardMaterial } from 'three'
import { Suspense, useEffect, useRef } from 'react'
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
  selectedPart?: string | null
}

type Props = {
  onSelectPart: (name: string, position: Vector3) => void
  focusPosition?: Vector3 | null
  predefinedView?: PredefinedView | null
  onModelLoaded?: (objects: string[], bounds: Box3) => void
  modelUrl?: string
  modelBounds?: Box3 | null
  autoFitOnLoad?: boolean
  selectedPart?: string | null
}

const Model = ({ 
  onSelectPart, 
  onModelLoaded,
  modelUrl = '/model.glb',
  selectedPart
}: ModelInterface) => {  
  const gltf = useGLTF(modelUrl)
  const originalMaterials = useRef<Map<Mesh, Material | Material[]>>(new Map())
  const highlightMaterial = useRef<MeshStandardMaterial>(new MeshStandardMaterial({
    color: '#ffff00',
    emissive: '#ffaa00',
    emissiveIntensity: 0.3,
    transparent: true,
    opacity: 0.8
  }))
  
  useEffect(() => {
    if (gltf.scene && onModelLoaded) {
      // Extract all object names from the scene and store original materials
      const objectNames: string[] = []
      
      gltf.scene.traverse((child) => {
        if (child.name && child.name !== '' && child.type === 'Mesh') {
          objectNames.push(child.name)
          // Store original material
          const mesh = child as Mesh
          if (!originalMaterials.current.has(mesh)) {
            originalMaterials.current.set(mesh, mesh.material)
          }
        }
      })
      
      // Calculate bounding box
      const bounds = new Box3().setFromObject(gltf.scene)
      
      // Remove duplicates and sort alphabetically
      const uniqueObjectNames = [...new Set(objectNames)].sort()
      onModelLoaded(uniqueObjectNames, bounds)
    }
  }, [gltf.scene, onModelLoaded, modelUrl])

  // Handle highlighting
  useEffect(() => {
    if (gltf.scene) {
      gltf.scene.traverse((child) => {
        if (child.type === 'Mesh') {
          const mesh = child as Mesh
          const originalMaterial = originalMaterials.current.get(mesh)
          
          if (selectedPart && child.name === selectedPart) {
            // Highlight selected part
            mesh.material = highlightMaterial.current
          } else if (originalMaterial) {
            // Restore original material
            mesh.material = originalMaterial
          }
        }
      })
    }
  }, [gltf.scene, selectedPart])
  
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
  autoFitOnLoad = false,
  selectedPart
}: Props) => {
  return (
    <Canvas 
      camera={{ position: [5, 5, 5], fov: 50 }}
      gl={{ antialias: true, alpha: false }}
    >
      {/* ...existing code... */}
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
      
      <Environment preset="city" />
      
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
      
      <hemisphereLight 
        groundColor="#F5DEB3" 
        intensity={0.4} 
      />
      
      <directionalLight 
        position={[-50, 10, -50]} 
        intensity={0.5}
        color="#ADD8E6"
      />
      
      <Suspense fallback={null}>
        <Model 
          onSelectPart={onSelectPart} 
          onModelLoaded={onModelLoaded} 
          modelUrl={modelUrl}
          selectedPart={selectedPart}
        />
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