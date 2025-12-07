interface TapeMockupProps {
    customDesign?: string;
}

export default function TapeMockup({ customDesign }: TapeMockupProps) {
    return (
        <div className="bg-surface rounded-lg p-8">
            <h3 className="text-lg font-bold mb-6 text-center tracking-wide">LIVE PREVIEW</h3>
            <div className="relative bg-gradient-to-br from-gray-900 to-black rounded-lg p-12">
                {/* Tape visualization */}
                <div className="relative w-full aspect-square max-w-md mx-auto">
                    {/* Tape background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg transform rotate-3 opacity-90" />

                    {/* Custom design overlay */}
                    <div className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-lg">
                        {customDesign ? (
                            <img
                                src={customDesign}
                                alt="Custom design"
                                className="w-3/4 h-3/4 object-cover rounded shadow-2xl"
                            />
                        ) : (
                            <div className="text-gray-700 text-center px-4">
                                <p className="text-sm opacity-50">Your design will appear here</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
