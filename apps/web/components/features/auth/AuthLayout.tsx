import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface AuthLayoutProps {
    children: React.ReactNode;
    title: string;
    subtitle: string;
    footerText: string;
    footerLinkText: string;
    footerLinkHref: string;
}

export default function AuthLayout({ children, title, subtitle, footerText, footerLinkText, footerLinkHref }: AuthLayoutProps) {
    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background relative">
            <Link
                href="/"
                className="absolute top-8 left-8 p-3 rounded-xl bg-secondary/10 hover:bg-secondary/20 transition-all text-muted-foreground hover:text-foreground flex items-center gap-2"
            >
                <ArrowLeft className="h-5 w-5" />
                <span className="font-medium text-sm hidden sm:inline">Back to Home</span>
            </Link>

            {/* Decorative background elements could go here (blobs etc) if global not sufficient */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[100px] -z-10 animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-[100px] -z-10 animate-pulse delay-700"></div>
            </div>

            <div className="max-w-md w-full glass-card p-8 border border-border shadow-2xl relative overflow-hidden backdrop-blur-xl animate-in fade-in zoom-in-95 duration-300">
                <div className="text-center mb-8 relative z-10">
                    <Link href="/" className="inline-block text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent mb-3 tracking-tight hover:opacity-80 transition-opacity">
                        NearNow
                    </Link>
                    <h1 className="text-2xl font-bold text-foreground">{title}</h1>
                    <p className="text-sm text-muted-foreground mt-2">
                        {subtitle}
                    </p>
                </div>

                <div className="relative z-10">
                    {children}
                </div>

                <div className="mt-8 text-center text-sm relative z-10">
                    <span className="text-muted-foreground">{footerText} </span>
                    <Link href={footerLinkHref} className="font-semibold text-primary hover:text-primary/80 transition-colors hover:underline">
                        {footerLinkText}
                    </Link>
                </div>
            </div>
        </div>
    );
}
