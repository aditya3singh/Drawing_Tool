"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { HexColorPicker } from "react-colorful"
import {
  Download,
  Layers,
  Settings,
  Trash2,
  Undo,
  Redo,
  Circle,
  Square,
  Minus,
  X,
  Pen,
  Type,
  ImageIcon,
  Home,
  AlertCircle,
  Eye,
  EyeOff,
  Plus,
} from "lucide-react"

// Types
type ToolType = "pen" | "eraser" | "rectangle" | "circle" | "text" | "image"
type DrawingMode = "draw" | "shape" | "text" | "select" | "image"
type LayerType = "line" | "rectangle" | "circle" | "text" | "image"

interface Layer {
  id: string
  type: LayerType
  visible: boolean
  name: string
  zIndex: number
  data?: any
}

interface Point {
  x: number
  y: number
}

interface Line {
  points: Point[]
  color: string
  lineWidth: number
  tool: ToolType
}

interface ToolItem {
  name: string
  icon: React.ReactNode
  drawingMode: DrawingMode
}

interface ShapeProps {
  startX: number
  startY: number
  width: number
  height: number
  color: string
  lineWidth: number
}

interface TextItem {
  id: string
  text: string
  x: number
  y: number
  color: string
}

const MainDrawingApp = () => {
  const [showWelcome, setShowWelcome] = useState(true)
  const [currentColor, setCurrentColor] = useState("#000000")
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [lineWidth, setLineWidth] = useState(3)
  const [currentTool, setCurrentTool] = useState<ToolType>("pen")
  const [lines, setLines] = useState<Line[]>([])
  const [currentLine, setCurrentLine] = useState<Line | null>(null)
  const [drawingMode, setDrawingMode] = useState<DrawingMode>("draw")
  const [isDrawing, setIsDrawing] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showLayersPanel, setShowLayersPanel] = useState(false)
  const [layers, setLayers] = useState<Layer[]>([
    { id: "layer-1", type: "line", visible: true, name: "Layer 1", zIndex: 1 },
  ])
  const [activeLayer, setActiveLayer] = useState("layer-1")
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 })
  const [shapes, setShapes] = useState<ShapeProps[]>([])
  const [currentShape, setCurrentShape] = useState<ShapeProps | null>(null)
  const [history, setHistory] = useState<any[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [showTutorial, setShowTutorial] = useState(false)
  const [textInput, setTextInput] = useState("")
  const [textPosition, setTextPosition] = useState({ x: 0, y: 0 })
  const [texts, setTexts] = useState<TextItem[]>([])
  const [isPlacingText, setIsPlacingText] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const settingsRef = useRef<HTMLDivElement>(null)
  const colorPickerRef = useRef<HTMLDivElement>(null)
  const layersPanelRef = useRef<HTMLDivElement>(null)

  // Tools configuration
  const tools: ToolItem[] = [
    { name: "Pen", icon: <Pen size={18} />, drawingMode: "draw" },
    { name: "Eraser", icon: <Minus size={18} />, drawingMode: "draw" },
    { name: "Rectangle", icon: <Square size={18} />, drawingMode: "shape" },
    { name: "Circle", icon: <Circle size={18} />, drawingMode: "shape" },
    { name: "Text", icon: <Type size={18} />, drawingMode: "text" },
    { name: "Image", icon: <ImageIcon size={18} />, drawingMode: "image" },
  ]

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw lines
    lines.forEach((line) => {
      if (line.points.length < 2) return

      ctx.beginPath()
      ctx.moveTo(line.points[0].x, line.points[0].y)

      for (let i = 1; i < line.points.length; i++) {
        ctx.lineTo(line.points[i].x, line.points[i].y)
      }

      ctx.strokeStyle = line.tool === "eraser" ? "#ffffff" : line.color
      ctx.lineWidth = line.lineWidth
      ctx.lineCap = "round"
      ctx.lineJoin = "round"
      ctx.stroke()
    })

    // Draw shapes
    shapes.forEach((shape) => {
      ctx.strokeStyle = shape.color
      ctx.lineWidth = shape.lineWidth

      if (shape.width && shape.height) {
        if (currentTool === "rectangle") {
          ctx.strokeRect(shape.startX, shape.startY, shape.width, shape.height)
        } else if (currentTool === "circle") {
          ctx.beginPath()
          const centerX = shape.startX + shape.width / 2
          const centerY = shape.startY + shape.height / 2
          const radiusX = Math.abs(shape.width / 2)
          const radiusY = Math.abs(shape.height / 2)

          ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI)
          ctx.stroke()
        }
      }
    })

    // Draw current shape if any
    if (currentShape && currentShape.width && currentShape.height) {
      ctx.strokeStyle = currentShape.color
      ctx.lineWidth = currentShape.lineWidth

      if (currentTool === "rectangle") {
        ctx.strokeRect(currentShape.startX, currentShape.startY, currentShape.width, currentShape.height)
      } else if (currentTool === "circle") {
        ctx.beginPath()
        const centerX = currentShape.startX + currentShape.width / 2
        const centerY = currentShape.startY + currentShape.height / 2
        const radiusX = Math.abs(currentShape.width / 2)
        const radiusY = Math.abs(currentShape.height / 2)

        ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI)
        ctx.stroke()
      }
    }

    // Draw texts
    texts.forEach((text) => {
      ctx.fillStyle = text.color
      ctx.font = "16px Arial"
      ctx.fillText(text.text, text.x, text.y)
    })
  }, [lines, shapes, currentShape, texts, canvasSize, currentTool])

  // Click outside handlers
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Handle settings panel
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node) && showSettings) {
        setShowSettings(false)
      }

      // Handle color picker
      if (colorPickerRef.current && !colorPickerRef.current.contains(event.target as Node) && showColorPicker) {
        setShowColorPicker(false)
      }

      // Handle layers panel
      if (layersPanelRef.current && !layersPanelRef.current.contains(event.target as Node) && showLayersPanel) {
        setShowLayersPanel(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showSettings, showColorPicker, showLayersPanel])

  // Drawing event handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (showWelcome) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    if (drawingMode === "draw") {
      setIsDrawing(true)
      setCurrentLine({
        points: [{ x, y }],
        color: currentTool === "eraser" ? "#ffffff" : currentColor,
        lineWidth: lineWidth,
        tool: currentTool,
      })
    } else if (drawingMode === "shape") {
      setIsDrawing(true)
      setCurrentShape({
        startX: x,
        startY: y,
        width: 0,
        height: 0,
        color: currentColor,
        lineWidth: lineWidth,
      })
    } else if (drawingMode === "text") {
      setTextPosition({ x, y })
      setIsPlacingText(true)
    }
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || showWelcome) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    if (drawingMode === "draw" && currentLine) {
      // Calculate distance between points to ensure smooth lines
      const lastPoint = currentLine.points[currentLine.points.length - 1]
      const distance = Math.sqrt(Math.pow(x - lastPoint.x, 2) + Math.pow(y - lastPoint.y, 2))

      // If distance is too large, add intermediate points for smoother lines
      if (distance > 5) {
        const steps = Math.floor(distance / 2)
        const dx = (x - lastPoint.x) / steps
        const dy = (y - lastPoint.y) / steps

        const newPoints = [...currentLine.points]
        for (let i = 1; i <= steps; i++) {
          newPoints.push({
            x: lastPoint.x + dx * i,
            y: lastPoint.y + dy * i,
          })
        }

        setCurrentLine({
          ...currentLine,
          points: newPoints,
        })
      } else {
        setCurrentLine({
          ...currentLine,
          points: [...currentLine.points, { x, y }],
        })
      }
    } else if (drawingMode === "shape" && currentShape) {
      setCurrentShape({
        ...currentShape,
        width: x - currentShape.startX,
        height: y - currentShape.startY,
      })
    }
  }

  const stopDrawing = () => {
    if (!isDrawing || showWelcome) return

    setIsDrawing(false)

    if (drawingMode === "draw" && currentLine) {
      if (currentLine.points.length > 1) {
        const newLines = [...lines, currentLine]
        setLines(newLines)
        addToHistory({ type: "lines", data: newLines })
      }
      setCurrentLine(null)
    } else if (drawingMode === "shape" && currentShape) {
      if (currentShape.width !== 0 && currentShape.height !== 0) {
        const newShapes = [...shapes, currentShape]
        setShapes(newShapes)
        addToHistory({ type: "shapes", data: newShapes })
      }
      setCurrentShape(null)
    }
  }

  // Touch event handlers for mobile devices
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault() // Prevent scrolling while drawing
    if (showWelcome) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const touch = e.touches[0]
    const x = touch.clientX - rect.left
    const y = touch.clientY - rect.top

    if (drawingMode === "draw") {
      setIsDrawing(true)
      setCurrentLine({
        points: [{ x, y }],
        color: currentTool === "eraser" ? "#ffffff" : currentColor,
        lineWidth: lineWidth,
        tool: currentTool,
      })
    } else if (drawingMode === "shape") {
      setIsDrawing(true)
      setCurrentShape({
        startX: x,
        startY: y,
        width: 0,
        height: 0,
        color: currentColor,
        lineWidth: lineWidth,
      })
    } else if (drawingMode === "text") {
      setTextPosition({ x, y })
      setIsPlacingText(true)
    }
  }

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault() // Prevent scrolling while drawing
    if (!isDrawing || showWelcome) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const touch = e.touches[0]
    const x = touch.clientX - rect.left
    const y = touch.clientY - rect.top

    if (drawingMode === "draw" && currentLine) {
      // Calculate distance between points to ensure smooth lines
      const lastPoint = currentLine.points[currentLine.points.length - 1]
      const distance = Math.sqrt(Math.pow(x - lastPoint.x, 2) + Math.pow(y - lastPoint.y, 2))

      // If distance is too large, add intermediate points for smoother lines
      if (distance > 5) {
        const steps = Math.floor(distance / 2)
        const dx = (x - lastPoint.x) / steps
        const dy = (y - lastPoint.y) / steps

        const newPoints = [...currentLine.points]
        for (let i = 1; i <= steps; i++) {
          newPoints.push({
            x: lastPoint.x + dx * i,
            y: lastPoint.y + dy * i,
          })
        }

        setCurrentLine({
          ...currentLine,
          points: newPoints,
        })
      } else {
        setCurrentLine({
          ...currentLine,
          points: [...currentLine.points, { x, y }],
        })
      }
    } else if (drawingMode === "shape" && currentShape) {
      setCurrentShape({
        ...currentShape,
        width: x - currentShape.startX,
        height: y - currentShape.startY,
      })
    }
  }

  const handleTouchEnd = () => {
    if (!isDrawing || showWelcome) return
    stopDrawing()
  }

  // Handle text input
  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (textInput.trim() && isPlacingText) {
      const newText = {
        id: `text-${Date.now()}`,
        text: textInput,
        x: textPosition.x,
        y: textPosition.y,
        color: currentColor,
      }

      const newTexts = [...texts, newText]
      setTexts(newTexts)
      addToHistory({ type: "texts", data: newTexts })
      setTextInput("")
      setIsPlacingText(false)
    }
  }

  // Image upload handling
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext("2d")
        if (!ctx) return

        // Calculate dimensions to fit the image
        const maxWidth = canvas.width * 0.8
        const maxHeight = canvas.height * 0.8

        let width = img.width
        let height = img.height

        if (width > maxWidth) {
          height = (maxWidth / width) * height
          width = maxWidth
        }

        if (height > maxHeight) {
          width = (maxHeight / height) * width
          height = maxHeight
        }

        // Center the image
        const x = (canvas.width - width) / 2
        const y = (canvas.height - height) / 2

        ctx.drawImage(img, x, y, width, height)

        // Save the current state for undo/redo
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        addToHistory({ type: "imageData", data: imageData })
      }
      img.src = event.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  // History management
  const addToHistory = (state: any) => {
    // Trim the future history if we're not at the end
    const newHistory = history.slice(0, historyIndex + 1)
    setHistory([...newHistory, state])
    setHistoryIndex(newHistory.length)
  }

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1
      setHistoryIndex(newIndex)

      const prevState = history[newIndex]
      if (prevState.type === "lines") {
        setLines(prevState.data)
      } else if (prevState.type === "shapes") {
        setShapes(prevState.data)
      } else if (prevState.type === "texts") {
        setTexts(prevState.data)
      } else if (prevState.type === "imageData") {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext("2d")
        if (!ctx) return

        ctx.putImageData(prevState.data, 0, 0)
      }
    }
  }

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1
      setHistoryIndex(newIndex)

      const nextState = history[newIndex]
      if (nextState.type === "lines") {
        setLines(nextState.data)
      } else if (nextState.type === "shapes") {
        setShapes(nextState.data)
      } else if (nextState.type === "texts") {
        setTexts(nextState.data)
      } else if (nextState.type === "imageData") {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext("2d")
        if (!ctx) return

        ctx.putImageData(nextState.data, 0, 0)
      }
    }
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    setLines([])
    setShapes([])
    setTexts([])

    // Add to history
    addToHistory({ type: "lines", data: [] })
    addToHistory({ type: "shapes", data: [] })
    addToHistory({ type: "texts", data: [] })
  }

  // Layer management
  const addLayer = () => {
    const newLayerId = `layer-${layers.length + 1}`
    const newLayer = {
      id: newLayerId,
      type: "line" as LayerType,
      visible: true,
      name: `Layer ${layers.length + 1}`,
      zIndex: layers.length + 1,
    }

    setLayers([...layers, newLayer])
    setActiveLayer(newLayerId)
  }

  const toggleLayerVisibility = (id: string) => {
    setLayers(layers.map((layer) => (layer.id === id ? { ...layer, visible: !layer.visible } : layer)))
  }

  // Export canvas as image
  const exportImage = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const image = canvas.toDataURL("image/png")
    const link = document.createElement("a")
    link.href = image
    link.download = "drawing.png"
    link.click()
  }

  // Change canvas size
  const updateCanvasSize = (width: number, height: number) => {
    setCanvasSize({ width, height })
  }

  // Adjust canvas size based on screen size
  const adjustCanvasToScreenSize = () => {
    const isMobile = window.innerWidth < 768
    const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024

    if (isMobile) {
      setCanvasSize({
        width: Math.min(window.innerWidth - 40, 600),
        height: Math.min(window.innerHeight * 0.5, 500),
      })
    } else if (isTablet) {
      setCanvasSize({
        width: Math.min(window.innerWidth - 60, 800),
        height: Math.min(window.innerHeight * 0.6, 600),
      })
    } else {
      setCanvasSize({ width: 800, height: 600 })
    }
  }

  // WelcomeScreen component
  const WelcomeScreen = () => (
    <motion.div
      className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 z-30 flex flex-col items-center justify-center text-white p-6"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="max-w-2xl w-full bg-gradient-to-br from-white to-blue-50 rounded-2xl shadow-[0_20px_50px_rgba(8,_112,_184,_0.2)] text-gray-800 p-10 border border-blue-100"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.8 }}
        style={{
          backdropFilter: "blur(10px)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 40px 5px rgba(79, 70, 229, 0.15)",
        }}
      >
        <h1 className="text-4xl font-bold mb-6 text-center text-blue-600">Digital Canvas</h1>
        <p className="text-xl mb-8 text-center">Create beautiful digital artwork with our intuitive drawing tools</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            className="bg-blue-50 p-4 rounded-lg text-center"
            whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
          >
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
              <Pen size={24} className="text-blue-600" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Drawing Tools</h3>
            <p className="text-sm">Multiple brush sizes, shapes, and colors</p>
          </motion.div>

          <motion.div
            className="bg-blue-50 p-4 rounded-lg text-center"
            whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
          >
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
              <Layers size={24} className="text-blue-600" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Layer Management</h3>
            <p className="text-sm">Organize your artwork with multiple layers</p>
          </motion.div>

          <motion.div
            className="bg-blue-50 p-4 rounded-lg text-center"
            whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
          >
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
              <Download size={24} className="text-blue-600" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Export Options</h3>
            <p className="text-sm">Save your work as a PNG image</p>
          </motion.div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <motion.button
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowWelcome(false)}
          >
            Start Drawing
          </motion.button>
          <motion.button
            className="bg-transparent border border-blue-600 text-blue-600 px-8 py-3 rounded-lg font-medium hover:bg-blue-50 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setShowWelcome(false)
              setShowTutorial(true)
            }}
          >
            Show Tutorial
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )

  // Tutorial component
  const Tutorial = () => (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-60 z-40 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-white rounded-xl max-w-3xl w-full max-h-[80vh] overflow-y-auto p-6"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">How to Use Digital Canvas</h2>
          <button className="p-1 rounded-full hover:bg-gray-100" onClick={() => setShowTutorial(false)}>
            <X size={24} />
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-2 text-blue-600">Drawing Tools</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Pen:</strong> Free-hand drawing with your selected color
              </li>
              <li>
                <strong>Eraser:</strong> Remove parts of your drawing
              </li>
              <li>
                <strong>Rectangle:</strong> Draw rectangular shapes
              </li>
              <li>
                <strong>Circle:</strong> Draw circular shapes
              </li>
              <li>
                <strong>Text:</strong> Add text to your canvas
              </li>
              <li>
                <strong>Image:</strong> Upload images to your canvas
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2 text-blue-600">Color & Size Controls</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Click the color display to open the color picker</li>
              <li>Use the brush size slider to adjust line thickness</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2 text-blue-600">Layer Management</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Click the layers icon to open the layers panel</li>
              <li>Add new layers for organizing your artwork</li>
              <li>Toggle layer visibility with the eye icon</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2 text-blue-600">Actions</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Undo/Redo:</strong> Reverse or repeat your last actions
              </li>
              <li>
                <strong>Clear Canvas:</strong> Remove all content from the canvas
              </li>
              <li>
                <strong>Save Image:</strong> Download your artwork as a PNG file
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <motion.button
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowTutorial(false)}
          >
            Got it!
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )

  // Settings panel component
  const SettingsPanel = () => (
    <motion.div
      ref={settingsRef}
      className="absolute top-20 right-4 bg-white rounded-lg shadow-lg p-4 z-20 w-64"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <h3 className="text-lg font-semibold mb-4">Canvas Settings</h3>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Canvas Width</label>
        <div className="flex items-center">
          <input
            type="range"
            min="400"
            max="1200"
            step="50"
            value={canvasSize.width}
            onChange={(e) => updateCanvasSize(Number.parseInt(e.target.value), canvasSize.height)}
            className="w-full mr-2"
          />
          <span className="text-sm font-mono">{canvasSize.width}px</span>
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Canvas Height</label>
        <div className="flex items-center">
          <input
            type="range"
            min="300"
            max="900"
            step="50"
            value={canvasSize.height}
            onChange={(e) => updateCanvasSize(canvasSize.width, Number.parseInt(e.target.value))}
            className="w-full mr-2"
          />
          <span className="text-sm font-mono">{canvasSize.height}px</span>
        </div>
      </div>

      <motion.button
        className="bg-red-500 hover:bg-red-600 text-white w-full py-2 rounded-lg mt-2 font-medium flex items-center justify-center"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={clearCanvas}
      >
        <Trash2 size={16} className="mr-2" />
        Clear Canvas
      </motion.button>
    </motion.div>
  )

  // Layers panel component
  const LayersPanel = () => (
    <motion.div
      ref={layersPanelRef}
      className="absolute top-20 left-4 bg-white rounded-lg shadow-lg p-4 z-20 w-64"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Layers</h3>
        <motion.button
          className="bg-blue-500 hover:bg-blue-600 text-white p-1 rounded-md flex items-center"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={addLayer}
        >
          <Plus size={16} className="mr-1" />
          <span className="text-xs">New Layer</span>
        </motion.button>
      </div>

      <div className="space-y-2 max-h-60 overflow-y-auto">
        {layers.map((layer) => (
          <div
            key={layer.id}
            className={`flex items-center justify-between p-2 rounded-md ${
              activeLayer === layer.id ? "bg-blue-100" : "hover:bg-gray-100"
            }`}
            onClick={() => setActiveLayer(layer.id)}
          >
            <div className="flex items-center">
              <button
                className="mr-2"
                onClick={(e) => {
                  e.stopPropagation()
                  toggleLayerVisibility(layer.id)
                }}
                aria-label={layer.visible ? "Hide layer" : "Show layer"}
              >
                {layer.visible ? (
                  <Eye size={16} className="text-blue-600" />
                ) : (
                  <EyeOff size={16} className="text-gray-400" />
                )}
              </button>
              <span className="text-sm font-medium">{layer.name}</span>
            </div>
            <div className="text-xs text-gray-500">{layer.type}</div>
          </div>
        ))}
      </div>
    </motion.div>
  )

  // Navbar component
  const Navbar = () => (
    <div className="bg-gray-800 text-white p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="mr-4 flex items-center"
            onClick={() => setShowWelcome(true)}
          >
            <Home size={20} />
            <span className="ml-2 hidden sm:inline">Home</span>
          </motion.button>
          <h1 className="text-xl font-bold">Digital Canvas</h1>
        </div>
        <div className="flex space-x-3">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 hover:bg-gray-700 rounded-md flex items-center"
            onClick={() => setShowLayersPanel(!showLayersPanel)}
          >
            <Layers size={20} />
            <span className="ml-1 hidden sm:inline">Layers</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 hover:bg-gray-700 rounded-md flex items-center"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings size={20} />
            <span className="ml-1 hidden sm:inline">Settings</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 hover:bg-gray-700 rounded-md flex items-center"
            onClick={() => setShowTutorial(true)}
          >
            <AlertCircle size={20} />
            <span className="ml-1 hidden sm:inline">Help</span>
          </motion.button>
        </div>
      </div>
    </div>
  )

  // Footer component
  const Footer = () => (
    <div className="bg-gray-800 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <div className="text-sm">© {new Date().getFullYear()} Digital Canvas | All rights reserved</div>
        <div className="text-sm flex space-x-4">
          <a href="#" className="hover:text-blue-300">
            Terms
          </a>
          <a href="#" className="hover:text-blue-300">
            Privacy
          </a>
          <a href="#" className="hover:text-blue-300">
            Help
          </a>
        </div>
      </div>
    </div>
  )

  // Handle window resize
  useEffect(() => {
    adjustCanvasToScreenSize()

    const handleResize = () => {
      adjustCanvasToScreenSize()
    }

    window.addEventListener("resize", handleResize)
    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  return (
    <div className="flex flex-col min-h-screen">
      <AnimatePresence>
        {showWelcome && <WelcomeScreen />}
        {showTutorial && <Tutorial />}
      </AnimatePresence>

      <Navbar />

      <div className="flex-grow bg-gray-100 p-4">
        <div className="container mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-4 mb-4">
            <div className="flex flex-wrap gap-2 mb-4 justify-center sm:justify-start">
              {tools.map((tool) => (
                <motion.button
                  key={tool.name}
                  className={`p-2 rounded-md ${
                    currentTool === tool.name.toLowerCase() ? "bg-blue-500 text-white" : "bg-gray-200 hover:bg-gray-300"
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setCurrentTool(tool.name.toLowerCase() as ToolType)
                    setDrawingMode(tool.drawingMode as DrawingMode)
                    setIsPlacingText(false)
                  }}
                >
                  <div className="flex items-center">
                    {tool.icon}
                    <span className="ml-1 text-sm hidden xs:inline">{tool.name}</span>
                  </div>
                </motion.button>
              ))}

              <div className="relative">
                <motion.button
                  className="p-2 rounded-md bg-gray-200 hover:bg-gray-300 flex items-center"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowColorPicker(!showColorPicker)}
                >
                  <div className="w-4 h-4 rounded-full mr-1" style={{ backgroundColor: currentColor }}></div>
                  <span className="text-sm">Color</span>
                </motion.button>

                <AnimatePresence>
                  {showColorPicker && (
                    <motion.div
                      ref={colorPickerRef}
                      className="absolute z-10 mt-2"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <HexColorPicker color={currentColor} onChange={setCurrentColor} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex items-center bg-gray-200 rounded-md p-2">
                <span className="text-sm mr-2">Size:</span>
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={lineWidth}
                  onChange={(e) => setLineWidth(Number.parseInt(e.target.value))}
                  className="w-24"
                />
                <span className="text-sm ml-1">{lineWidth}px</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-4 justify-center sm:justify-start">
              <motion.button
                className={`p-2 rounded-md bg-gray-200 hover:bg-gray-300 flex items-center ${historyIndex <= 0 ? "opacity-50 cursor-not-allowed" : ""}`}
                whileHover={historyIndex > 0 ? { scale: 1.05 } : {}}
                whileTap={historyIndex > 0 ? { scale: 0.95 } : {}}
                onClick={undo}
                disabled={historyIndex <= 0}
              >
                <Undo size={18} />
                <span className="ml-1 text-sm hidden xs:inline">Undo</span>
              </motion.button>

              <motion.button
                className={`p-2 rounded-md bg-gray-200 hover:bg-gray-300 flex items-center ${historyIndex >= history.length - 1 ? "opacity-50 cursor-not-allowed" : ""}`}
                whileHover={historyIndex < history.length - 1 ? { scale: 1.05 } : {}}
                whileTap={historyIndex < history.length - 1 ? { scale: 0.95 } : {}}
                onClick={redo}
                disabled={historyIndex >= history.length - 1}
              >
                <Redo size={18} />
                <span className="ml-1 text-sm hidden xs:inline">Redo</span>
              </motion.button>

              <motion.button
                className="p-2 rounded-md bg-gray-200 hover:bg-gray-300 flex items-center"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={clearCanvas}
              >
                <Trash2 size={18} />
                <span className="ml-1 text-sm hidden xs:inline">Clear</span>
              </motion.button>

              <motion.button
                className="p-2 rounded-md bg-blue-500 hover:bg-blue-600 text-white flex items-center"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={exportImage}
              >
                <Download size={18} />
                <span className="ml-1 text-sm hidden xs:inline">Save</span>
              </motion.button>

              {currentTool === "image" && (
                <div className="p-2 rounded-md bg-purple-500 hover:bg-purple-600 text-white">
                  <label htmlFor="image-upload" className="flex items-center cursor-pointer">
                    <ImageIcon size={18} />
                    <span className="ml-1 text-sm hidden xs:inline">Upload</span>
                  </label>
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </div>
              )}
            </div>

            <div className="relative">
              <canvas
                ref={canvasRef}
                width={canvasSize.width}
                height={canvasSize.height}
                className="border border-gray-300 rounded-lg mx-auto cursor-crosshair bg-white"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                style={{ touchAction: "none" }}
              />

              <AnimatePresence>
                {showSettings && <SettingsPanel />}
                {showLayersPanel && <LayersPanel />}
              </AnimatePresence>

              {isPlacingText && (
                <div
                  className="absolute bg-white border border-gray-300 rounded-md shadow-md p-2"
                  style={{
                    top: textPosition.y + 20,
                    left: textPosition.x,
                  }}
                >
                  <form onSubmit={handleTextSubmit} className="flex">
                    <input
                      type="text"
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      placeholder="Enter text"
                      className="border border-gray-300 rounded-l-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                    <button
                      type="submit"
                      className="bg-blue-500 hover:bg-blue-600 text-white rounded-r-md px-2 py-1 text-sm"
                    >
                      Add
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}

export default MainDrawingApp
