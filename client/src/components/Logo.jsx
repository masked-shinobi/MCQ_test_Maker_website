import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const Logo = () => {
    const navigate = useNavigate();

    return (
        <motion.div
            className="fixed top-4 left-4 md:top-6 md:left-8 z-[100] cursor-pointer scale-75 md:scale-100 origin-top-left"
            onClick={() => navigate('/')}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.5 }}
        >
            <div className="relative group">
                {/* Glow Effect */}
                <motion.div
                    className="absolute inset-0 bg-primary/40 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.2, 0.4, 0.2]
                    }}
                    transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />

                {/* SVG Logo */}
                <svg
                    width="48"
                    height="48"
                    viewBox="0 0 100 100"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="relative z-10"
                >
                    <defs>
                        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#8B5CF6" /> {/* Primary Purple */}
                            <stop offset="100%" stopColor="#3B82F6" /> {/* Blue */}
                        </linearGradient>
                        <filter id="neonGlow">
                            <feGaussianBlur stdDeviation="2.5" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                    </defs>

                    {/* Architectural "S" Shape */}
                    <motion.path
                        d="M30 25 C30 25 70 15 75 35 C80 55 20 45 25 65 C30 85 75 75 75 75"
                        stroke="url(#logoGradient)"
                        strokeWidth="12"
                        strokeLinecap="round"
                        fill="none"
                        filter="url(#neonGlow)"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1.5, ease: "easeInOut" }}
                    />

                    {/* Inner Sharp Accents */}
                    <motion.path
                        d="M40 35 L60 30"
                        stroke="white"
                        strokeWidth="2"
                        strokeOpacity="0.3"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 0.3, 0] }}
                        transition={{ duration: 3, repeat: Infinity }}
                    />
                    <motion.path
                        d="M40 70 L60 65"
                        stroke="white"
                        strokeWidth="2"
                        strokeOpacity="0.3"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 0.3, 0] }}
                        transition={{ duration: 3, repeat: Infinity, delay: 1.5 }}
                    />
                </svg>

                {/* Text Label (Hidden by default, shown on hover) */}
                <motion.div
                    className="absolute left-14 top-1/2 -translate-y-1/2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    initial={{ x: -10 }}
                    whileHover={{ x: 0 }}
                >
                    <span className="text-[10px] font-black uppercase tracking-[0.5em] text-white/40">
                        Core_Engine
                    </span>
                </motion.div>
            </div>
        </motion.div>
    );
};

export default Logo;
