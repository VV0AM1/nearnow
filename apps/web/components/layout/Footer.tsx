import Link from "next/link";
import { MapPin, Shield } from "lucide-react";

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
                            Useful local updates and community help, right around you.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="font-bold text-white mb-6">Platform</h4>
                        <ul className="space-y-4">
                            {[
                                { label: 'Live Map', href: '/signup' },
                                { label: 'Area overview', href: '/safety' },
                                { label: 'Community Feed', href: '/signup' },
                                { label: 'Download App', href: '/download' },
                                { label: 'Urgent help (not an emergency service)', href: '/safety' }
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
                        <h4 className="font-bold text-white mb-6">Pilot area</h4>
                        <ul className="space-y-4">
                            {['Barcelona', "L'Hospitalet de Llobregat", 'Badalona'].map((city) => (
                                <li key={city}>
                                    <Link href="/signup" className="text-zinc-400 hover:text-white transition-colors flex items-center gap-2">
                                        <MapPin className="h-3 w-3" />
                                        {city}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact: no newsletter backend or phone line exists yet, so none is shown. */}
                    <div>
                        <h4 className="font-bold text-white mb-6">Help</h4>
                        <p className="text-zinc-400 text-sm">NearNow is not an emergency service. In an emergency call 112.</p>
                    </div>
                </div>

                <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-zinc-500">
                    <p>&copy; {new Date().getFullYear()} NearNow Inc. All rights reserved.</p>
                    <div className="flex items-center gap-8">
                        <Link href="/legal" className="hover:text-white transition-colors">Privacy Policy</Link>
                        <Link href="/legal" className="hover:text-white transition-colors">Terms of Service</Link>
                        
                    </div>
                </div>
            </div>
        </footer>
    );
}
