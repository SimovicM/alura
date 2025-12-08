import { Palette, Award, Star } from 'lucide-react';

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

export default function About() {
    return (
        <section id="about" className="py-32 px-6 bg-surface">
            <div className="max-w-6xl mx-auto">
                {/* About Alura Section */}
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

                {/* Features */}
                <div className="text-center mb-16">
                    <h3 className="text-4xl md:text-5xl font-modak text-white mb-6">
                        Your Design.<br />Your Performance.
                    </h3>
                </div>

                <div className="grid md:grid-cols-3 gap-12">
                    {features.map((feature, index) => (
                        <div
                            key={index}
                            className="text-center"
                        >
                            <feature.icon className="w-12 h-12 mx-auto mb-4 text-primary" strokeWidth={1.5} />
                            <h3 className="text-xl font-semibold mb-2 font-inter">{feature.title}</h3>
                            <p className="text-gray-500">{feature.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
