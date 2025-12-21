import { Link } from 'react-router-dom';

export default function OldCustomizerPage() {
    return (
        <div className="min-h-screen pt-28 pb-16 px-6">
            <div className="max-w-3xl mx-auto text-center space-y-6">
                <h1 className="text-4xl font-modak">Old Customizer (Deprecated)</h1>
                <p className="text-gray-400">
                    This page contains the legacy/customizer UI. We moved to a new, faster
                    and more capable designer at <strong>design.aluratape.cz</strong>.
                </p>

                <div className="flex gap-3 justify-center">
                    <a
                        href="https://design.aluratape.cz"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-lg font-bold"
                    >
                        Open New Designer
                    </a>

                    <Link to="/" className="px-6 py-3 border border-white/10 rounded-lg hover:bg-white/3">
                        Back to Home
                    </Link>
                </div>

                <p className="text-sm text-gray-500">
                    If you still want to use the old customizer, you can access it through the
                    developer tools or contact us. Prefer the new app for a better experience.
                </p>
            </div>
        </div>
    );
}
