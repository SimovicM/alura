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
        title: 'Only On The Market',
        description: 'We are the only company offering fully custom printed athletic tapes'
    }
];

export default function About() {
    return (
        <section id="about" className="py-32 px-6 bg-surface">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-20">
                    <h2 className="text-5xl md:text-7xl font-modak text-white mb-6">
                        Your Design.<br />Your Performance.
                    </h2>
                    <p className="text-xl text-gray-400 max-w-3xl mx-auto font-light leading-relaxed">
                        At Alura, we believe your athletic tape should be as unique as your game.
                        Upload any image, logo, or design and we'll print it on premium kinesiology tape.
                    </p>
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
