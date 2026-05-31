"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";

interface Shape {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  color: string;
}

export default function ShapeGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    // Mouse coordinates tracking
    const mouse = { x: -1000, y: -1000, active: false };
    const trails = new Map<string, number>(); // Key: "col,row", Value: opacity (0 to 1)
    const gridSize = 50;

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;

      // Calculate grid indices
      const col = Math.floor(e.clientX / gridSize);
      const row = Math.floor(e.clientY / gridSize);
      const key = `${col},${row}`;
      
      // Set trail opacity to 1.0
      trails.set(key, 1.0);
    };

    const handleMouseLeave = () => {
      mouse.active = false;
    };

    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);

    // Create 3 large ambient floating shapes for mood background
    const shapes: Shape[] = [
      {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: 250 + Math.random() * 150,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        color: "rgba(99, 102, 241, 0.08)", // Indigo
      },
      {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: 300 + Math.random() * 150,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        color: "rgba(139, 92, 246, 0.08)", // Violet
      },
      {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: 220 + Math.random() * 120,
        vx: (Math.random() - 0.5) * 0.45,
        vy: (Math.random() - 0.5) * 0.45,
        color: "rgba(236, 72, 153, 0.06)", // Pink
      },
    ];

    let animationFrameId: number;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const isDark = resolvedTheme === "dark";

      // 1. Draw large ambient moving blobs
      shapes.forEach((shape) => {
        shape.x += shape.vx;
        shape.y += shape.vy;

        // Bounce boundaries
        if (shape.x - shape.r < 0 || shape.x + shape.r > canvas.width) {
          shape.vx = -shape.vx;
        }
        if (shape.y - shape.r < 0 || shape.y + shape.r > canvas.height) {
          shape.vy = -shape.vy;
        }

        const gradient = ctx.createRadialGradient(
          shape.x,
          shape.y,
          0,
          shape.x,
          shape.y,
          shape.r
        );

        const baseColor = isDark
          ? shape.color
          : shape.color.replace("0.08", "0.04").replace("0.06", "0.03");

        gradient.addColorStop(0, baseColor);
        gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(shape.x, shape.y, shape.r, 0, Math.PI * 2);
        ctx.fill();
      });

      // 2. Update and draw hover trails
      trails.forEach((opacity, key) => {
        const [colStr, rowStr] = key.split(",");
        const col = parseInt(colStr, 10);
        const row = parseInt(rowStr, 10);
        const x = col * gridSize;
        const y = row * gridSize;

        // Draw hover square
        ctx.fillStyle = isDark
          ? `rgba(99, 102, 241, ${opacity * 0.045})`
          : `rgba(99, 102, 241, ${opacity * 0.025})`;
        ctx.fillRect(x + 1, y + 1, gridSize - 2, gridSize - 2);

        // Draw soft hover square borders
        ctx.strokeStyle = isDark
          ? `rgba(99, 102, 241, ${opacity * 0.08})`
          : `rgba(99, 102, 241, ${opacity * 0.05})`;
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, y + 0.5, gridSize - 1, gridSize - 1);

        // Decay opacity
        const nextOpacity = opacity * 0.94 - 0.005;
        if (nextOpacity <= 0) {
          trails.delete(key);
        } else {
          trails.set(key, nextOpacity);
        }
      });

      // 3. Draw grid lines with cursor spotlight highlight
      const colsCount = Math.ceil(canvas.width / gridSize);
      const rowsCount = Math.ceil(canvas.height / gridSize);

      // Create spotlight gradient if mouse is active and on screen
      let lineStyle: string | CanvasGradient = isDark ? "rgba(255, 255, 255, 0.025)" : "rgba(0, 0, 0, 0.015)";

      if (mouse.active) {
        const spotlight = ctx.createRadialGradient(
          mouse.x,
          mouse.y,
          0,
          mouse.x,
          mouse.y,
          180
        );
        
        if (isDark) {
          spotlight.addColorStop(0, "rgba(99, 102, 241, 0.18)");
          spotlight.addColorStop(0.5, "rgba(139, 92, 246, 0.06)");
          spotlight.addColorStop(1, "rgba(255, 255, 255, 0.025)");
        } else {
          spotlight.addColorStop(0, "rgba(99, 102, 241, 0.12)");
          spotlight.addColorStop(0.5, "rgba(139, 92, 246, 0.04)");
          spotlight.addColorStop(1, "rgba(0, 0, 0, 0.015)");
        }
        lineStyle = spotlight;
      }

      ctx.strokeStyle = lineStyle;
      ctx.lineWidth = 1;

      // Draw vertical lines
      for (let i = 0; i <= colsCount; i++) {
        ctx.beginPath();
        ctx.moveTo(i * gridSize, 0);
        ctx.lineTo(i * gridSize, canvas.height);
        ctx.stroke();
      }

      // Draw horizontal lines
      for (let j = 0; j <= rowsCount; j++) {
        ctx.beginPath();
        ctx.moveTo(0, j * gridSize);
        ctx.lineTo(canvas.width, j * gridSize);
        ctx.stroke();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, [resolvedTheme]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[-1] transition-colors duration-500"
    />
  );
}
