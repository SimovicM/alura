import { useNavigate } from 'react-router-dom';
import { ArrowDown } from 'lucide-react';

export default function Hero() {
    const navigate = useNavigate();

    const scrollToAbout = () => {
        document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <section id="hero" className="min-h-screen flex flex-col items-center justify-center relative px-6 pt-20">
            <div className="relative z-10 text-center max-w-4xl">
                {/* Headline */}
                <h1 className="text-6xl md:text-8xl font-modak text-white mb-6 tracking-tight">
                    100% Custom<br />Athletic Tapes
                </h1>

                {/* Subtitle */}
                <p className="text-xl md:text-2xl text-gray-400 mb-12 font-light max-w-2xl mx-auto">
                    Upload your design. We print it. You perform.
                </p>

                {/* CTA Button */}
                <button
                    onClick={() => navigate('/customize')}
                    className="bg-primary hover:bg-primary/90 text-white px-12 py-4 rounded-full text-base font-bold tracking-wide transition-all uppercase"
                >
                    Design Your Tape
                </button>
            </div>

            {/* Scroll indicator */}
            <button
                onClick={scrollToAbout}
                className="absolute bottom-8 left-1/2 -translate-x-1/2 text-gray-600 hover:text-gray-400 transition-colors"
            >
                <ArrowDown className="w-6 h-6" />
            </button>
        </section>
    );
}
