import { useEffect, useRef, useState } from "react";
import "./App.css";

function App() {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const [tool, setTool] = useState("");
  const [lineWidth, setLineWidth] = useState(2);
  const [paths, setPaths] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);

  // Initialize the canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctxRef.current = ctx;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  // Draw all paths on the canvas
  const redrawCanvas = (currentPaths = paths) => {
    const ctx = ctxRef.current;
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    currentPaths.forEach((path) => {
      ctx.beginPath();
      ctx.lineWidth = path.lineWidth;
      ctx.strokeStyle = path.color;
      path.points.forEach(([x, y], index) => {
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();
    });
  };

  // Start drawing a new path
  const startDrawing = (e) => {
    if (tool !== "pen") return;

    const { offsetX, offsetY } = e.nativeEvent;
    setIsDrawing(true);

    const ctx = ctxRef.current;
    ctx.beginPath();
    ctx.moveTo(offsetX, offsetY);

    const newPath = {
      points: [[offsetX, offsetY]],
      color: "black",
      lineWidth: lineWidth,
    };
    setPaths((prevPaths) => [...prevPaths, newPath]);
  };

  // Continue drawing the current path
  const draw = (e) => {
    if (!isDrawing || tool !== "pen") return;

    const { offsetX, offsetY } = e.nativeEvent;
    const ctx = ctxRef.current;

    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = "black";
    ctx.lineTo(offsetX, offsetY);
    ctx.stroke();

    setPaths((prevPaths) => {
      const updatedPaths = [...prevPaths];
      const currentPath = updatedPaths[updatedPaths.length - 1];
      currentPath.points.push([offsetX, offsetY]);
      return updatedPaths;
    });
  };

  // Finish the current path
  const finishDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    redrawCanvas(); // Ensure the final path is stored
  };

  // Helper to detect eraser intersection with a line segment
  const isCircleIntersectingLine = (cx, cy, radius, x1, y1, x2, y2) => {
    const ac = { x: cx - x1, y: cy - y1 };
    const ab = { x: x2 - x1, y: y2 - y1 };
    const abLengthSquared = ab.x ** 2 + ab.y ** 2;

    const dotProduct = ac.x * ab.x + ac.y * ab.y;
    const t = Math.max(0, Math.min(1, dotProduct / abLengthSquared));

    const closestPoint = { x: x1 + t * ab.x, y: y1 + t * ab.y };
    const distanceSquared = (closestPoint.x - cx) ** 2 + (closestPoint.y - cy) ** 2;

    return distanceSquared <= radius ** 2;
  };

  // Erase paths that intersect with the eraser
  const erasePath = (x, y) => {
    const eraserRadius = lineWidth * 2;

    setPaths((prevPaths) => {
      const updatedPaths = prevPaths.filter((path) => {
        for (let i = 0; i < path.points.length - 1; i++) {
          const [x1, y1] = path.points[i];
          const [x2, y2] = path.points[i + 1];
          if (isCircleIntersectingLine(x, y, eraserRadius, x1, y1, x2, y2)) {
            return false; // Remove this path if touched by the eraser
          }
        }
        return true; // Keep the path if no segments are touched
      });

      redrawCanvas(updatedPaths); // Redraw canvas with updated paths
      return updatedPaths;
    });
  };

  // Handle erasing while moving
  const handleErasing = (e) => {
    if (tool === "eraser" && e.buttons === 1) { // Check if left mouse button is held
      const { offsetX, offsetY } = e.nativeEvent;
      erasePath(offsetX, offsetY);
    }
  };

  const startErasing = (e) => {
    if (tool !== "eraser" || e.button !== 0) return;

    const { offsetX, offsetY } = e.nativeEvent;
    erasePath(offsetX, offsetY);
  };

  return (
    <div className="App">
      <div className="toolbar">
        <button
          onClick={() => setTool("pen")}
          style={{
            backgroundColor: tool === "pen" ? "black" : "white",
            color: tool === "pen" ? "white" : "black",
            marginRight: "10px",
          }}
        >
          Pen
        </button>
        <button
          onClick={() => setTool("eraser")}
          style={{
            backgroundColor: tool === "eraser" ? "black" : "white",
            color: tool === "eraser" ? "white" : "black",
          }}
        >
          Erase
        </button>
      </div>
      <canvas
        ref={canvasRef}
        style={{
          backgroundColor: "white",
        }}
        onMouseDown={tool === "pen" ? startDrawing : startErasing}
        onMouseMove={tool === "pen" ? draw : handleErasing}
        onMouseUp={finishDrawing}
      />
    </div>
  );
}

export default App;
