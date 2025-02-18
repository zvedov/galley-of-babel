"use client";

import { useEffect, useRef, useState } from "react";
import { Monitor, Gauge } from "lucide-react";
import { Slider } from "@/components/ui/slider";

// Utility Functions
const isPrime = (num: number): boolean => {
    if (num < 2) return false;
    for (let i = 2; i <= Math.sqrt(num); i++) {
        if (num % i === 0) return false;
    }
    return true;
};

// Get Random RGB Color
const getRandomRGBColor = () => ({
    r: Math.floor(Math.random() * 256),
    g: Math.floor(Math.random() * 256),
    b: Math.floor(Math.random() * 256),
});

// === RULE SET DEFINITIONS ===
const categories = [
    {
        title: "🎨 Color Dynamics",
        rules: [
            "Rainbow Drift",
            "Heatmap Mode",
            "Greyscale Mode",
            "Negative World",
            "Pulse Glow",
            "Color Echo",
            "Spectrum Waves",
            "Inverted Spectrum",
            "Contrast Boost",
            "Random Neon Blips"
        ]
    },
    {
        title: "🧮 Mathematical Patterns",
        rules: [
            "Fibonacci Spiral",
            "Prime Number Clusters",
            "Multiplication Table Grid",
            "Even/Odd Checker",
            "Power of Two Highlights"
        ]
    },
    {
        title: "⚛️ Physics Principles",
        rules: [
            "Gravity Pull",
            "Pixel Mass",
            "Magnetic Attraction",
            "Brownian Motion",
            "Thermal Diffusion"
        ]
    }
];

export default function Home() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isAnimating, setIsAnimating] = useState(true);
    const [speed, setSpeed] = useState([30]);
    const lastFrameTime = useRef(0);
    const [activeRules, setActiveRules] = useState<{ [key: string]: boolean }>({});

    // Toggle Rules
    const toggleRule = (rule: string) => {
        setActiveRules((prev) => ({
            ...prev,
            [rule]: !prev[rule]
        }));
    };

    // === RULE LOGIC HANDLER ===
    const applyRules = (color: { r: number; g: number; b: number }, index: number) => {
        // 🎨 Color Dynamics Rules
        if (activeRules["Rainbow Drift"]) {
            color.r = (color.r + 10) % 256;
            color.g = (color.g + 7) % 256;
            color.b = (color.b + 13) % 256;
        }
        if (activeRules["Greyscale Mode"]) {
            const avg = Math.floor((color.r + color.g + color.b) / 3);
            color.r = avg;
            color.g = avg;
            color.b = avg;
        }
        if (activeRules["Negative World"] && index % 5 === 0) {
            color.r = 255 - color.r;
            color.g = 255 - color.g;
            color.b = 255 - color.b;
        }
        if (activeRules["Random Neon Blips"] && Math.random() < 0.02) {
            return getRandomRGBColor();
        }

        // 🧮 Mathematical Patterns Rules
        if (activeRules["Prime Number Clusters"] && isPrime(index)) {
            color.r = 255;
            color.g = 255;
            color.b = 0;
        }
        if (activeRules["Even/Odd Checker"] && index % 2 === 0) {
            color.r = Math.max(color.r - 20, 0);
        }

        // ⚛️ Physics Principles Rules
        if (activeRules["Gravity Pull"]) {
            color.b = Math.max(color.b - 10, 0);
        }
        if (activeRules["Pixel Mass"]) {
            const mass = Math.floor((color.r + color.g + color.b) / 3);
            color.r = mass;
            color.g = mass;
            color.b = Math.min(mass + 20, 255);
        }

        return color;
    };

    const generateRandomPixels = (ctx: CanvasRenderingContext2D) => {
        const imageData = ctx.createImageData(240, 240);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
            let color = getRandomRGBColor();
            color = applyRules(color, i / 4);
            data[i] = color.r;
            data[i + 1] = color.g;
            data[i + 2] = color.b;
            data[i + 3] = 255; // Alpha
        }

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

        return () => cancelAnimationFrame(animationFrameId);
    }, [isAnimating, speed, activeRules]);

    // === LAYOUT ===
    return (
        <div className="min-h-screen flex flex-row items-start p-4 space-x-4 bg-black text-white">
            {/* Left - Canvas */}
            <div className="flex flex-col space-y-4">
                <div className="bg-zinc-900 p-4 rounded-lg shadow-xl">
                    <h1 className="text-center font-mono text-sm mb-2">
                        <Monitor className="inline-block w-4 h-4 mr-2" />
                        Pixel Display
                    </h1>
                    <canvas
                        ref={canvasRef}
                        width={240}
                        height={240}
                        className="border border-zinc-800 rounded"
                        style={{
                            imageRendering: "pixelated",
                            width: "480px",
                            height: "480px",
                        }}
                    />
                </div>
                {/* Speed Control */}
                <div className="flex items-center space-x-2">
                    <Gauge className="w-4 h-4 text-zinc-400" />
                    <span className="text-xs font-mono">Speed Control ({speed[0]} FPS)</span>
                    <Slider
                        value={speed}
                        onValueChange={setSpeed}
                        min={1}
                        max={60}
                        step={1}
                        className="w-[200px]"
                    />
                </div>
                {/* Play/Pause Button */}
                <button
                    onClick={() => setIsAnimating((prev) => !prev)}
                    className={`px-4 py-2 rounded text-xs font-mono transition-all ${
                        isAnimating
                            ? "bg-red-600 hover:bg-red-500"
                            : "bg-green-600 hover:bg-green-500"
                    }`}
                >
                    {isAnimating ? "PAUSE" : "PLAY"}
                </button>
            </div>

            {/* Right - Rule Selection */}
            <div className="w-72 bg-zinc-800 p-4 rounded-lg shadow-xl">
                <h2 className="text-center text-lg font-mono mb-4">🎛️ Rules Panel</h2>
                {categories.map((category, catIndex) => (
                    <div key={catIndex} className="mb-4">
                        <h3 className="text-sm font-bold text-zinc-300 mb-2">
                            {category.title}
                        </h3>
                        <div className="grid grid-cols-2 gap-2">
                            {category.rules.map((rule, index) => (
                                <button
                                    key={index}
                                    onClick={() => toggleRule(rule)}
                                    className={`px-2 py-1 text-xs font-mono rounded transition-all ${
                                        activeRules[rule]
                                            ? "bg-green-500 text-white"
                                            : "bg-zinc-700 text-zinc-300 hover:bg-zinc-600"
                                    }`}
                                >
                                    {activeRules[rule] ? "✅" : "⛔"} {rule}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
