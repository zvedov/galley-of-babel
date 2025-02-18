"use client";

import { useEffect, useRef, useState } from "react";
import { Monitor, Gauge } from "lucide-react";
import { Slider } from "@/components/ui/slider";

// Utility functions for color classification
const isPrime = (num: number): boolean => {
    if (num < 2) return false;
    for (let i = 2; i <= Math.sqrt(num); i++) {
        if (num % i === 0) return false;
    }
    return true;
};

const isOdd = (num: number): boolean => num % 2 === 1;
const isEven = (num: number): boolean => num % 2 === 0;
const isPowerOfThree = (num: number): boolean => {
    while (num > 1 && num % 3 === 0) {
        num /= 3;
    }
    return num === 1;
};

// Generate random RGB color
const getRandomRGBColor = () => ({
    r: Math.floor(Math.random() * 256),
    g: Math.floor(Math.random() * 256),
    b: Math.floor(Math.random() * 256),
});

type PixelGroup = {
    type: 'odd' | 'even' | 'prime';
    colors: { r: number, g: number, b: number }[];
    size: number;
    locked: boolean;
};

export default function Home() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isAnimating, setIsAnimating] = useState(true);
    const [speed, setSpeed] = useState([30]); // Default 30 FPS
    const lastFrameTime = useRef(0);
    const pixelGroups = useRef<Map<string, PixelGroup>>(new Map());

    const findConnectedGroups = (
        pixels: Uint8ClampedArray,
        width: number,
        height: number
    ) => {
        const visited = new Set<number>();
        const groups = new Map<string, PixelGroup>();

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4;
                if (visited.has(idx)) continue;

                const color = { r: pixels[idx], g: pixels[idx + 1], b: pixels[idx + 2] };
                let type: 'odd' | 'even' | 'prime' = 'odd';

                if (isPrime(color.r)) type = 'prime';
                else if (isEven(color.r)) type = 'even';

                const group: PixelGroup = { type, colors: [color], size: 1, locked: false };
                const stack = [[x, y]];
                visited.add(idx);

                while (stack.length > 0) {
                    const [cx, cy] = stack.pop()!;
                    const neighbors = [
                        [cx - 1, cy],
                        [cx + 1, cy],
                        [cx, cy - 1],
                        [cx, cy + 1],
                    ];

                    for (const [nx, ny] of neighbors) {
                        if (
                            nx >= 0 && nx < width &&
                            ny >= 0 && ny < height
                        ) {
                            const nIdx = (ny * width + nx) * 4;
                            if (visited.has(nIdx)) continue;

                            const nColor = { r: pixels[nIdx], g: pixels[nIdx + 1], b: pixels[nIdx + 2] };
                            const canMerge = (
                                (type === 'odd' && isOdd(nColor.r)) ||
                                (type === 'even' && isEven(nColor.r)) ||
                                (type === 'prime' && isPrime(nColor.r))
                            );

                            if (canMerge) {
                                stack.push([nx, ny]);
                                visited.add(nIdx);
                                group.colors.push(nColor);
                                group.size++;
                            }
                        }
                    }
                }

                // Lock color if it's a duple
                if (group.size === 2) {
                    group.locked = true;
                } else if (group.size > 2) {
                    group.locked = false;
                }

                const groupId = `${x}-${y}`;
                groups.set(groupId, group);
            }
        }

        return groups;
    };

    const generateRandomPixels = (ctx: CanvasRenderingContext2D) => {
        const imageData = ctx.createImageData(240, 240);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
            const powerOfThreeIndex = Math.floor(i / 4) + 1;
            let color = getRandomRGBColor();

            if (isPowerOfThree(powerOfThreeIndex)) {
                // Apply triple color blending
                color = getRandomRGBColor();
            }

            data[i] = color.r;
            data[i + 1] = color.g;
            data[i + 2] = color.b;
            data[i + 3] = 255; // Alpha
        }

        // Find and process connected groups
        const groups = findConnectedGroups(data, 240, 240);
        pixelGroups.current = groups;

        groups.forEach((group, groupId) => {
            if (group.locked) {
                const [x, y] = groupId.split('-').map(Number);
                const startIdx = (y * 240 + x) * 4;
                for (let i = 0; i < group.size; i++) {
                    const idx = startIdx + i * 4;
                    data[idx] = group.colors[i]?.r ?? 0;
                    data[idx + 1] = group.colors[i]?.g ?? 0;
                    data[idx + 2] = group.colors[i]?.b ?? 0;
                }
            }
        });

        ctx.putImageData(imageData, 0, 0);
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let animationFrameId: number;

        const animate = (currentTime: number) => {
            if (!isAnimating) return;

            animationFrameId = requestAnimationFrame(animate);

            const deltaTime = currentTime - lastFrameTime.current;
            const frameInterval = 1000 / speed[0];

            if (deltaTime >= frameInterval) {
                generateRandomPixels(ctx);
                lastFrameTime.current = currentTime - (deltaTime % frameInterval);
            }
        };

        animationFrameId = requestAnimationFrame(animate);

        return () => {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
        };
    }, [isAnimating, speed]);

    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
            <div className="bg-zinc-900 p-8 rounded-lg shadow-2xl max-w-fit">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Monitor className="w-5 h-5 text-zinc-400" />
                        <h1 className="text-zinc-400 font-mono text-sm">Pixel Display</h1>
                    </div>
                    <button
                        onClick={() => setIsAnimating(prev => !prev)}
                        className="px-3 py-1 text-xs font-mono bg-zinc-800 text-zinc-400 rounded hover:bg-zinc-700 transition-colors"
                    >
                        {isAnimating ? "PAUSE" : "PLAY"}
                    </button>
                </div>
                <canvas ref={canvasRef} width={240} height={240} className="border border-zinc-800 rounded"
                    style={{ imageRendering: "pixelated", width: "480px", height: "480px" }} />
            </div>
        </div>
    );
}
