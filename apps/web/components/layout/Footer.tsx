import Link from "next/link";
import { Facebook, Twitter, Instagram, Github, MapPin, Mail, Phone, Shield } from "lucide-react";

export default function Footer() {
    return (
        <footer className="w-full bg-[#050505] border-t border-white/5 relative overflow-hidden z-10 mt-auto">
            {/* Background Glow */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

            <div className="max-w-7xl mx-auto px-6 py-12 md:py-20 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
                    {/* Brand Section */}
                    <div className="space-y-6">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center">
                                <Shield className="h-5 w-5 text-white" />
                            </div>
                            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">
                                NearNow
                            </span>
                        </Link>
                        <p className="text-zinc-400 leading-relaxed">
                            Building safer, more connected neighborhoods through real-time community alerts and AI-powered safety insights.
                        </p>
                        <div className="flex items-center gap-4">
                            {[
                                { icon: Twitter, href: "#" },
                                { icon: Facebook, href: "#" },
                                { icon: Instagram, href: "#" },
                                { icon: Github, href: "#" }
                            ].map((social, i) => (
                                <Link
                                    key={i}
                                    href={social.href}
                                    className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center text-zinc-400 hover:bg-primary/20 hover:text-primary transition-all hover:-translate-y-1"
                                >
                                    <social.icon className="h-5 w-5" />
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="font-bold text-white mb-6">Platform</h4>
                        <ul className="space-y-4">
                            {[
                                { label: 'Live Map', href: '/signup' },
                                { label: 'Safety Score', href: '/safety' },
                                { label: 'Community Feed', href: '/signup' },
                                { label: 'Download App', href: '/download' },
                                { label: 'SOS Feature', href: '/safety' }
                            ].map((item) => (
                                <li key={item.label}>
                                    <Link href={item.href} className="text-zinc-400 hover:text-primary transition-colors flex items-center gap-2 group">
                                        <span className="w-1.5 h-1.5 rounded-full bg-primary/0 group-hover:bg-primary transition-colors" />
                                        {item.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Neighborhoods */}
                    <div>
                        <h4 className="font-bold text-white mb-6">Popular Areas</h4>
                        <ul className="space-y-4">
                            {['San Francisco', 'New York', 'Los Angeles', 'Chicago', 'Miami'].map((city) => (
                                <li key={city}>
                                    <Link href="/signup" className="text-zinc-400 hover:text-white transition-colors flex items-center gap-2">
                                        <MapPin className="h-3 w-3" />
                                        {city}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact / Newsletter */}
                    <div>
                        <h4 className="font-bold text-white mb-6">Stay Updated</h4>
                        <p className="text-zinc-400 mb-4 text-sm">
                            Subscribe to our newsletter for the latest safety updates and features.
                        </p>
                        <div className="flex gap-2">
                            <input
                                type="email"
                                placeholder="Enter your email"
                                className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-primary/50 w-full"
                            />
                            <button className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors">
                                Join
                            </button>
                        </div>
                        <div className="mt-8 space-y-2 text-sm text-zinc-500">
                            <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4" />
                                <span>support@nearnow.app</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4" />
                                <span>+1 (800) 123-4567</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-zinc-500">
                    <p>&copy; {new Date().getFullYear()} NearNow Inc. All rights reserved.</p>
                    <div className="flex items-center gap-8">
                        <Link href="/legal" className="hover:text-white transition-colors">Privacy Policy</Link>
                        <Link href="/legal" className="hover:text-white transition-colors">Terms of Service</Link>
                        <Link href="/legal" className="hover:text-white transition-colors">Cookie Settings</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
