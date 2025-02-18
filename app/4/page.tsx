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

// Simple Perlin-like Noise Function for Random Bias
const noise = (x: number, y: number, seed: number) => {
    return Math.sin((x + seed) * 0.05) * Math.cos((y + seed) * 0.05) * 100;
};

// Randomness Bias Generator
const randomBias = () => Math.random() * 0.4 - 0.2; // Random number between -0.2 and 0.2

// === Color Rules with Randomness Bias ===
// Colors shift based on number properties, noise, and randomness
const getColorFromValue = (
    value: number, 
    x: number, 
    y: number, 
    neighbors: number[], 
    seed: number
): { r: number; g: number; b: number } => {
    const isValuePrime = isPrime(value);
    const isValueEven = isEven(value);
    const isValueOdd = isOdd(value);

    const neighborPrimes = neighbors.filter(isPrime).length;
    const neighborEvens = neighbors.filter(isEven).length;
    const neighborOdds = neighbors.filter(isOdd).length;

    const noiseFactor = (Math.sin((x + seed) * 0.01 + (y + seed) * 0.01) + 1) * 0.5;
    const randomness = randomBias();

    // 🌈 Prime Clusters: Pulsing Rainbow with Random Drift
    if (isValuePrime && neighborPrimes > 1) {
        return {
            r: ((value * 3 + Math.floor(noiseFactor * 255)) + randomness * 100) % 255,
            g: ((value * 5 + Math.floor(noiseFactor * 180)) + randomness * 150) % 255,
            b: ((value * 7 + Math.floor(noiseFactor * 200)) + randomness * 200) % 255,
        };
    }

    // 💜 Even meets Odd: Blended Purple with Noise
    if (isValueEven && neighborOdds > 0) {
        return { 
            r: 128 + randomness * 50, 
            g: 0, 
            b: 128 + randomness * 50 
        };
    }

    // 💛 Prime meets Even/Odd: Bright Yellow with Drift
    if (isValuePrime && (neighborEvens > 0 || neighborOdds > 0)) {
        return { 
            r: 255, 
            g: 255, 
            b: Math.floor(noiseFactor * 100 + randomness * 100) 
        };
    }

    // 🌊 Even: Blue Shades with Random Bias
    if (isValueEven) {
        return {
            r: 0,
            g: 0,
            b: ((value * 5 + Math.floor(noiseFactor * 100)) + randomness * 100) % 255,
        };
    }

    // 🌿 Odd: Organic Green Tones with Random Variation
    if (isValueOdd) {
        return {
            r: 0,
            g: ((value * 7 + Math.floor(noiseFactor * 150)) + randomness * 150) % 255,
            b: 0,
        };
    }

    // Default Background (Occasional White Noise Pixel for Distortion)
    if (Math.random() < 0.001) {
        return { r: 255, g: 255, b: 255 }; // Occasional flash of white
    }

    return { r: 0, g: 0, b: 0 };
};

// === Component ===
export default function NewPage() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const frameCounter = useRef(0);
    const [isAnimating, setIsAnimating] = useState(true);
    const [speed, setSpeed] = useState(20);
    const lastFrameTime = useRef(0);
    const [seed, setSeed] = useState(Math.random() * 1000); // Random seed for noise

    // 2D Array to Store Pixels
    const pixelGrid = useRef<number[][]>(
        Array.from({ length: 256 }, () =>
            Array(256).fill(0)
        )
    );

    // === Generate Next Column Based on New Artistic Rules ===
    const generateNextColumn = () => {
        const newColumn = Array(256).fill(0);
        const columnIndex = frameCounter.current;

        for (let y = 0; y < 256; y++) {
            const value = columnIndex * 256 + y + Math.floor(noise(columnIndex, y, seed));

            const neighbors = [];
            if (columnIndex > 0) {
                neighbors.push(pixelGrid.current[y][255]);
                if (y > 0) neighbors.push(pixelGrid.current[y - 1][255]);
                if (y < 255) neighbors.push(pixelGrid.current[y + 1][255]);
            }

            // Randomness bias added to the number to break patterns
            newColumn[y] = value + Math.floor(randomBias() * 100);
        }

        return newColumn;
    };

    // === Update Grid by Scrolling and Adding Columns ===
    const updateGrid = () => {
        // Shift grid to the left
        for (let y = 0; y < 256; y++) {
            pixelGrid.current[y].shift();
        }

        // Add a new column on the right
        const newColumn = generateNextColumn();
        for (let y = 0; y < 256; y++) {
            pixelGrid.current[y].push(newColumn[y]);
        }

        frameCounter.current += 1;

        // Occasionally randomize the seed for additional pattern shifts
        if (frameCounter.current % 100 === 0) {
            setSeed(Math.random() * 1000);
        }
    };

    // === Draw the Updated Grid on Canvas ===
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

                const { r, g, b } = getColorFromValue(value, x, y, neighbors, seed);
                const index = (y * 256 + x) * 4;

                data[index] = r;     // R
                data[index + 1] = g; // G
                data[index + 2] = b; // B
                data[index + 3] = 255; // A
            }
        }

        ctx.putImageData(imageData, 0, 0);
    };

    // === Animation Loop ===
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
    }, [isAnimating, speed, seed]);

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center p-4">
            <h1 className="text-lg font-mono mb-4">🎨 Randomized Artistic Number Stream</h1>
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
