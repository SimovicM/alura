import { useNavigate } from 'react-router-dom';
import { ArrowDown } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Hero() {
    const navigate = useNavigate();

    const scrollToAbout = () => {
        document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <section id="hero" className="min-h-screen flex flex-col items-center justify-center relative px-6 pt-20">
            <div className="relative z-10 text-center max-w-4xl">
                {/* Headline */}
                <motion.h1
                    className="text-6xl md:text-8xl font-modak text-white mb-6 tracking-tight"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                >
                    100% Custom<br />Athletic Tapes
                </motion.h1>

                {/* Subtitle */}
                <motion.p
                    className="text-xl md:text-2xl text-gray-400 mb-12 font-light max-w-2xl mx-auto"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                >
                    Upload your design. We print it. You perform.
                </motion.p>

                {/* CTA Button */}
                <motion.button
                    onClick={() => navigate('/customize')}
                    className="bg-primary hover:bg-primary/90 text-white px-12 py-4 rounded-full text-base font-bold tracking-wide transition-all uppercase"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    Design Your Tape
                </motion.button>
            </div>

            {/* Scroll indicator */}
            <motion.button
                onClick={scrollToAbout}
                className="absolute bottom-8 left-1/2 -translate-x-1/2 text-gray-600 hover:text-gray-400 transition-colors"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, y: [0, 10, 0] }}
                transition={{
                    opacity: { delay: 1, duration: 0.5 },
                    y: { delay: 1.5, duration: 1.5, repeat: Infinity, ease: "easeInOut" }
                }}
            >
                <ArrowDown className="w-6 h-6" />
            </motion.button>
        </section>
    );
}
