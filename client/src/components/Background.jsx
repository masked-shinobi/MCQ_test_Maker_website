import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

const Background = () => {
    // Generate static metadata for particles to avoid hydration mismatches
    const particles = useMemo(() => {
        return [...Array(25)].map((_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: Math.random() * 3 + 1,
            duration: Math.random() * 20 + 20,
            delay: Math.random() * -20
        }));
    }, []);

    // Floating tech elements (circles, squares, lines)
    const floaters = useMemo(() => {
        return [...Array(8)].map((_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: Math.random() * 100 + 50,
            duration: Math.random() * 15 + 15,
            rotation: Math.random() * 360,
            type: i % 3 // 0: circle, 1: square, 2: hex-outline
        }));
    }, []);

    return (
        <div className="bg-mesh overflow-hidden pointer-events-none">
            {/* Ambient Background Particles */}
            {particles.map((p) => (
                <motion.div
                    key={`p-${p.id}`}
                    className="absolute bg-white rounded-full opacity-20"
                    style={{
                        left: `${p.x}%`,
                        top: `${p.y}%`,
                        width: `${p.size}px`,
                        height: `${p.size}px`,
                    }}
                    animate={{
                        y: ['0%', '-100%', '0%'],
                        x: ['0%', '20%', '0%'],
                        opacity: [0.1, 0.3, 0.1]
                    }}
                    transition={{
                        duration: p.duration,
                        repeat: Infinity,
                        delay: p.delay,
                        ease: "linear"
                    }}
                />
            ))}

            {/* Large Floating Tech Elements */}
            {floaters.map((f) => (
                <motion.div
                    key={`f-${f.id}`}
                    className="absolute border border-white/5 bg-white/[0.01] backdrop-blur-[2px]"
                    style={{
                        left: `${f.x}%`,
                        top: `${f.y}%`,
                        width: `${f.size}px`,
                        height: `${f.size}px`,
                        borderRadius: f.type === 0 ? '50%' : '1rem',
                        transform: `rotate(${f.rotation}deg)`
                    }}
                    animate={{
                        y: [0, -40, 0],
                        x: [0, 30, 0],
                        rotate: [f.rotation, f.rotation + 45, f.rotation],
                        opacity: [0.02, 0.05, 0.02],
                        scale: [1, 1.1, 1]
                    }}
                    transition={{
                        duration: f.duration,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                >
                    {/* Inner detail for the floater */}
                    <div className="absolute inset-2 border border-white/10 rounded-[inherit] opacity-20" />
                    {f.type === 2 && (
                        <div className="absolute top-1/2 left-0 w-full h-[1px] bg-white/10 rotate-45" />
                    )}
                </motion.div>
            ))}

            {/* Main Animated Glow Spheres */}
            <motion.div
                className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[120px]"
                animate={{
                    x: [0, 100, 0],
                    y: [0, 50, 0],
                    scale: [1, 1.2, 1]
                }}
                transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
                className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-secondary/15 rounded-full blur-[120px]"
                animate={{
                    x: [0, -100, 0],
                    y: [0, -50, 0],
                    scale: [1, 1.3, 1]
                }}
                transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Subtle Grid Overlay */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none" />
        </div>
    );
};

export default Background;
