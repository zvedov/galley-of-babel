"use client";

import { useEffect, useRef, useState } from "react";

// === Utility Functions ===
const isPrime = (num: number): boolean => {
    if (num < 2) return false;
    for (let i = 2; i <= Math.sqrt(num); i++) {
        if (num % i === 0) return false;
    }
    return true;
};

const isEven = (num: number): boolean => num % 2 === 0;
const isOdd = (num: number): boolean => num % 2 === 1;

// === Color Rules ===
// - Even: Shades of Blue
// - Odd: Shades of Green
// - Prime: Shades of Red
// - Even meets Odd: Purple
// - Prime meets Even/Odd: Bright Yellow
const getColorFromValue = (value: number, neighbors: number[]): { r: number; g: number; b: number } => {
    const isValuePrime = isPrime(value);
    const isValueEven = isEven(value);
    const isValueOdd = isOdd(value);

    const neighborPrimes = neighbors.filter(isPrime).length;
    const neighborEvens = neighbors.filter(isEven).length;
    const neighborOdds = neighbors.filter(isOdd).length;

    // Bright Yellow when prime meets even/odd
    if (isValuePrime && (neighborEvens > 0 || neighborOdds > 0)) {
        return { r: 255, g: 255, b: 0 };
    }

    // Purple when even meets odd
    if (isValueEven && neighborOdds > 0) {
        return { r: 128, g: 0, b: 128 }; // Purple
    }

    // Shifting hues for prime clusters
    if (isValuePrime && neighborPrimes > 1) {
        return {
            r: (value * 3) % 255,
            g: (value * 5) % 255,
            b: (value * 7) % 255,
        };
    }

    // Primary Colors Based on Type
    if (isValuePrime) return { r: 255, g: 0, b: 0 }; // Red (Prime)
    if (isValueEven) return { r: 0, g: 0, b: (value * 5) % 255 }; // Blue (Even)
    if (isValueOdd) return { r: 0, g: (value * 7) % 255, b: 0 }; // Green (Odd)

    return { r: 0, g: 0, b: 0 }; // Default Black
};

// === Component ===
export default function NewPage() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const frameCounter = useRef(0);
    const [isAnimating, setIsAnimating] = useState(true);
    const [speed, setSpeed] = useState(20);
    const lastFrameTime = useRef(0);

    // 2D Array to Store Pixels
    const pixelGrid = useRef<number[][]>(
        Array.from({ length: 256 }, () =>
            Array(256).fill(0)
        )
    );

    // Generate Next Column Based on Rules
    const generateNextColumn = () => {
        const newColumn = Array(256).fill(0);
        const columnIndex = frameCounter.current;

        for (let y = 0; y < 256; y++) {
            const value = columnIndex * 256 + y;

            const neighbors = [];
            if (columnIndex > 0) {
                neighbors.push(pixelGrid.current[y][255]);
                if (y > 0) neighbors.push(pixelGrid.current[y - 1][255]);
                if (y < 255) neighbors.push(pixelGrid.current[y + 1][255]);
            }

            // Assign value for color generation
            newColumn[y] = value;
        }

        return newColumn;
    };

    // Update Grid by Scrolling Left and Adding New Column
    const updateGrid = () => {
        // Shift grid to the left by removing the first column
        for (let y = 0; y < 256; y++) {
            pixelGrid.current[y].shift();
        }

        // Add a new column to the right
        const newColumn = generateNextColumn();
        for (let y = 0; y < 256; y++) {
            pixelGrid.current[y].push(newColumn[y]);
        }

        frameCounter.current += 1;
    };

    // Draw the Grid on Canvas
    const drawGrid = (ctx: CanvasRenderingContext2D) => {
        const imageData = ctx.createImageData(256, 256);
        const data = imageData.data;

        for (let y = 0; y < 256; y++) {
            for (let x = 0; x < 256; x++) {
                const value = pixelGrid.current[y][x];

                // Get neighbors for interaction effects
                const neighbors = [];
                if (x > 0) neighbors.push(pixelGrid.current[y][x - 1]);
                if (x < 255) neighbors.push(pixelGrid.current[y][x + 1]);
                if (y > 0) neighbors.push(pixelGrid.current[y - 1][x]);
                if (y < 255) neighbors.push(pixelGrid.current[y + 1][x]);

                const { r, g, b } = getColorFromValue(value, neighbors);
                const index = (y * 256 + x) * 4;

                data[index] = r;     // R
                data[index + 1] = g; // G
                data[index + 2] = b; // B
                data[index + 3] = 255; // A
            }
        }

        ctx.putImageData(imageData, 0, 0);
    };

    // Animation Loop
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const animate = (currentTime: number) => {
            if (!isAnimating) return;

            if (currentTime - lastFrameTime.current > 1000 / speed) {
                updateGrid();
                drawGrid(ctx);
                lastFrameTime.current = currentTime;
            }

            requestAnimationFrame(animate);
        };

        requestAnimationFrame(animate);
    }, [isAnimating, speed]);

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center p-4">
            <h1 className="text-lg font-mono mb-4">📊 Colorful Number Pattern Stream</h1>
            <canvas
                ref={canvasRef}
                width={256}
                height={256}
                className="border border-gray-700"
                style={{
                    imageRendering: "pixelated",
                    width: "512px",
                    height: "512px",
                }}
            />
            <div className="mt-4 flex space-x-4">
                <button
                    onClick={() => setIsAnimating((prev) => !prev)}
                    className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500"
                >
                    {isAnimating ? "Pause" : "Play"}
                </button>
                <label className="flex items-center space-x-2">
                    <span className="text-xs">Speed:</span>
                    <input
                        type="range"
                        min="1"
                        max="60"
                        value={speed}
                        onChange={(e) => setSpeed(Number(e.target.value))}
                        className="w-32"
                    />
                </label>
            </div>
        </div>
    );
}
