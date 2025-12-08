import { Palette, Award, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';

const features = [
    {
        icon: Palette,
        title: '100% Custom',
        description: 'Upload any design you want'
    },
    {
        icon: Award,
        title: 'Premium Quality',
        description: 'Professional-grade athletic tape'
    },
    {
        icon: Star,
        title: 'Only One On The Market',
        description: 'We are the only company offering fully custom printed athletic tapes'
    }
];

function AnimatedSection({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 50 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
            transition={{ duration: 0.6, delay, ease: "easeOut" }}
        >
            {children}
        </motion.div>
    );
}

export default function About() {
    const featuresRef = useRef(null);
    const featuresInView = useInView(featuresRef, { once: true, margin: "-100px" });

    return (
        <section id="about" className="py-32 px-6 bg-surface">
            <div className="max-w-6xl mx-auto">
                {/* About Alura Section */}
                <AnimatedSection>
                    <div className="text-center mb-24">
                        <h2 className="text-5xl md:text-7xl font-modak text-white mb-8">
                            About Alura
                        </h2>
                        <p className="text-lg md:text-xl text-gray-400 max-w-4xl mx-auto leading-relaxed">
                            Alura is a Czech brand redefining how athletes express themselves on the pitch.
                            Specializing in fully custom, high-quality sports tapes, Alura gives every player
                            the freedom to showcase their identity, style, and confidence in every match.
                            Trusted and verified by multiple athletes, our tapes combine performance-ready
                            durability with limitless personalization. With Alura, your game isn't just played
                            — it's uniquely yours.
                        </p>
                    </div>
                </AnimatedSection>

                {/* Features Header */}
                <AnimatedSection delay={0.2}>
                    <div className="text-center mb-16">
                        <h3 className="text-4xl md:text-5xl font-modak text-white mb-6">
                            Your Design.<br />Your Performance.
                        </h3>
                    </div>
                </AnimatedSection>

                {/* Features Grid */}
                <div ref={featuresRef} className="grid md:grid-cols-3 gap-12">
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            className="text-center"
                            initial={{ opacity: 0, y: 40 }}
                            animate={featuresInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
                            transition={{ duration: 0.6, delay: 0.3 + index * 0.15, ease: "easeOut" }}
                        >
                            <motion.div
                                whileHover={{ scale: 1.1, rotate: 5 }}
                                transition={{ type: "spring", stiffness: 300 }}
                            >
                                <feature.icon className="w-12 h-12 mx-auto mb-4 text-primary" strokeWidth={1.5} />
                            </motion.div>
                            <h3 className="text-xl font-semibold mb-2 font-inter">{feature.title}</h3>
                            <p className="text-gray-500">{feature.description}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
