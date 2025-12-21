import { motion } from 'framer-motion';

export default function Footer() {
    return (
        <motion.footer
            className="py-12 px-6 border-t border-white/5"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
        >
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <motion.img
                        src="/alura-logo.png"
                        alt="Alura"
                        className="h-8"
                        whileHover={{ scale: 1.05 }}
                    />

                    <div className="flex gap-8 text-sm text-gray-500">
                        <motion.a
                            href="mailto:simovic.martin@icloud.com"
                            className="hover:text-primary transition-colors"
                            whileHover={{ y: -2 }}
                        >
                            Contact
                        </motion.a>
                        <motion.a
                            href="https://www.instagram.com/aluratape/#"
                            className="hover:text-primary transition-colors"
                            whileHover={{ y: -2 }}
                        >
                            Instagram
                        </motion.a>
                    </div>

                    <p className="text-sm text-gray-600">© 2025 Alura. All rights reserved.</p>
                </div>
            </div>


        </motion.footer>
    );
}



