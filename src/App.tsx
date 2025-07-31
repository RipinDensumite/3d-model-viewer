import { useState, useRef } from 'react'
import ModelViewer from './components/ModelViewer'
import { Vector3 } from 'three'

// Define predefined camera positions and part descriptions
const PREDEFINED_VIEWS = {
  overview: {
    position: new Vector3(5, 5, 5),
    target: new Vector3(0, 0, 0),
    name: 'Overview'
  },
  frontView: {
    position: new Vector3(0 ,0, 8),
    target: new Vector3(0, 0, 0),
    name: 'Front View'
  },
  topView: {
    position: new Vector3(0, 8, 0),
    target: new Vector3(0, 0, 0),
    name: 'Top View'
  },
  sideView: {
    position: new Vector3(8, 0, 0),
    target: new Vector3(0, 0, 0),
    name: 'Side View'
  }
}

// Define part descriptions
const PART_DESCRIPTIONS: Record<string, string> = {
  'Object_52': 'The main propulsion system of the vehicle, responsible for generating power.',
  'Wheel': 'Circular component that enables vehicle movement and steering control.',
  'Door': 'Access panel that allows entry and exit from the vehicle interior.',
  'Window': 'Transparent panel providing visibility and natural light.',
  'Hood': 'Protective cover for the engine compartment.',
  'Trunk': 'Storage compartment located at the rear of the vehicle.',
  // Add more part descriptions as needed
}

function App() {
  const [selectedPart, setSelectedPart] = useState<string | null>(null)
  const [focusPosition, setFocusPosition] = useState<Vector3 | null>(null)
  const [currentView, setCurrentView] = useState<string>('overview')
  const [activeTab, setActiveTab] = useState<'views' | 'objects'>('views')
  const [availableObjects, setAvailableObjects] = useState<string[]>([])
  const [modelUrl, setModelUrl] = useState('/model.glb')
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Check if file is a supported 3D model format
      const supportedFormats = ['.glb', '.gltf', '.fbx', '.obj']
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
      
      if (supportedFormats.includes(fileExtension)) {
        // Create object URL for the selected file
        const objectUrl = URL.createObjectURL(file)
        setModelUrl(objectUrl)
        setSelectedFileName(file.name)
        
        // Reset states when new model is loaded
        setSelectedPart(null)
        setAvailableObjects([])
        setCurrentView('overview')
        setActiveTab('views')
        
        // Clean up previous object URL if it exists
        if (modelUrl.startsWith('blob:')) {
          URL.revokeObjectURL(modelUrl)
        }
      } else {
        alert('Please select a supported 3D model file (.glb, .gltf, .fbx, .obj)')
      }
    }
  }

  const handleSelectPart = (name: string, position: Vector3) => {
    setSelectedPart(name)
    setFocusPosition(position)
    setCurrentView('custom')
  }

  const handlePredefinedView = (viewKey: keyof typeof PREDEFINED_VIEWS) => {
    const view = PREDEFINED_VIEWS[viewKey]
    setFocusPosition(view.target)
    setCurrentView(viewKey)
    setSelectedPart(null) // Clear selected part when switching to predefined view
  }

  const handleObjectSelect = (objectName: string) => {
    setSelectedPart(objectName)
    // Note: We don't have the position here, so we'll just select it without focusing
    // The actual focusing will happen when the user clicks on the object in the 3D view
  }

  const handleModelLoaded = (objects: string[]) => {
    setAvailableObjects(objects)
  }

  return (
    <>
    <div className='bg-green-50 text-black flex items-center gap-2 p-2'>
      <button 
        onClick={handleFileSelect}
        className='bg-amber-200 px-5 py-1 rounded hover:bg-amber-300 transition-colors cursor-pointer border-none'
      >
        File
      </button>
      {selectedFileName && (
        <span className='text-sm text-gray-600'>
          Current: {selectedFileName} | {modelUrl}
        </span>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept=".glb,.gltf,.fbx,.obj"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
    </div>
    <main className='background-red-400 h-[calc(100dvh-3em)] relative'>
      <ModelViewer 
        modelUrl={modelUrl}
        onSelectPart={handleSelectPart}
        focusPosition={focusPosition}
        predefinedView={currentView !== 'custom' ? PREDEFINED_VIEWS[currentView as keyof typeof PREDEFINED_VIEWS] : null}
        onModelLoaded={handleModelLoaded}
      />

      {/* Camera View Controls and Object List */}
      <div className="absolute top-5 left-5 bg-black/70 text-white rounded-lg min-w-[250px] max-h-[70vh] overflow-hidden flex flex-col">
        {/* Tab Headers */}
        <div className="flex border-b border-gray-600">
          <button
            onClick={() => setActiveTab('views')}
            className={`flex-1 px-4 py-3 text-sm font-medium border-none cursor-pointer ${
              activeTab === 'views' 
                ? 'bg-blue-600 text-white' 
                : 'bg-transparent text-gray-300 hover:bg-gray-700'
            }`}
          >
            Camera Views
          </button>
          <button
            onClick={() => setActiveTab('objects')}
            className={`flex-1 px-4 py-3 text-sm font-medium border-none cursor-pointer ${
              activeTab === 'objects' 
                ? 'bg-blue-600 text-white' 
                : 'bg-transparent text-gray-300 hover:bg-gray-700'
            }`}
          >
            Objects ({availableObjects.length})
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-4 overflow-y-auto flex-1">
          {activeTab === 'views' && (
            <>
              <h3 className="m-0 mb-4">Camera Views</h3>
              {Object.entries(PREDEFINED_VIEWS).map(([key, view]) => (
                <button
                  key={key}
                  onClick={() => handlePredefinedView(key as keyof typeof PREDEFINED_VIEWS)}
                  className={`block w-full my-2 px-3 py-2 text-white border-none rounded cursor-pointer transition-colors ${
                    currentView === key ? 'bg-blue-600' : 'bg-gray-800 hover:bg-gray-700'
                  }`}
                >
                  {view.name}
                </button>
              ))}
            </>
          )}

          {activeTab === 'objects' && (
            <>
              <h3 className="m-0 mb-4">Available Objects</h3>
              {availableObjects.length === 0 ? (
                <p className="text-gray-400 italic text-sm">Loading objects...</p>
              ) : (
                <div className="space-y-1">
                  {availableObjects.map((objectName) => (
                    <button
                      key={objectName}
                      onClick={() => handleObjectSelect(objectName)}
                      className={`block w-full text-left px-3 py-2 text-sm border-none rounded cursor-pointer transition-colors ${
                        selectedPart === objectName 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-800 hover:bg-gray-700 text-gray-200'
                      }`}
                      title={objectName}
                    >
                      <div className="truncate">{objectName}</div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Selected Part Info */}
      <div className="absolute top-5 right-5 bg-black/70 text-white p-4 rounded-lg max-w-[300px]">
        <h3 className="m-0 mb-4">Part Information</h3>
        {selectedPart ? (
          <>
            <h4 className="m-0 mb-2 text-sky-300">{selectedPart}</h4>
            <p className="m-0 leading-relaxed">
              {PART_DESCRIPTIONS[selectedPart] || 'No description available for this part.'}
            </p>
          </>
        ) : (
          <p className="m-0 italic">
            Click on a part of the model to view its information.
          </p>
        )}
      </div>
    </main>
    </>
  )
}

export default App