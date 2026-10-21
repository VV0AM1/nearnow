import Link from "next/link";
import { CheckCheck, Clock, MapPin, ShieldCheck } from "lucide-react";

interface AuthLayoutProps {
    children: React.ReactNode;
    title: string;
    subtitle: string;
    footerText: string;
    footerLinkText: string;
    footerLinkHref: string;
}

const POINTS = [
    { icon: MapPin, text: "Updates from neighbours around the area you choose — closures, events, lost & found." },
    { icon: Clock, text: "Every post shows when it was posted and whether others confirmed it." },
    { icon: ShieldCheck, text: "Your exact location is never shown unless you choose to share it." },
];

/** Sign-in frame: brand panel on wide screens, a single card on phones. */
export default function AuthLayout({ children, title, subtitle, footerText, footerLinkText, footerLinkHref }: AuthLayoutProps) {
    return (
        <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
            <aside className="relative hidden overflow-hidden bg-[#2459e0] p-12 text-white lg:flex lg:flex-col lg:justify-between">
                <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 size-[420px] rounded-full bg-white/10" />
                <div aria-hidden className="pointer-events-none absolute -bottom-32 -left-20 size-[360px] rounded-full bg-white/[0.07]" />
                <Link href="/" className="relative flex items-center gap-2.5 text-xl font-bold">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-white text-[#2459e0]">
                        <MapPin className="size-5" aria-hidden />
                    </span>
                    NearNow
                </Link>
                <div className="relative max-w-md space-y-8">
                    <h2 className="text-[40px] font-bold leading-[1.1] tracking-tight">Local updates and community help, right around you.</h2>
                    <ul className="space-y-5">
                        {POINTS.map(({ icon: IconC, text }) => (
                            <li key={text} className="flex gap-3.5 text-[17px] leading-snug text-white/90">
                                <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-white/15">
                                    <IconC className="size-5" aria-hidden />
                                </span>
                                {text}
                            </li>
                        ))}
                    </ul>
                </div>
                <p className="relative flex items-center gap-2 text-sm text-white/75">
                    <CheckCheck className="size-4" aria-hidden /> Not an emergency service — in danger, call 112.
                </p>
            </aside>

            <main className="flex items-center justify-center px-4 py-10 sm:px-8">
                <div className="w-full max-w-[400px]">
                    <Link href="/" className="mb-10 flex items-center gap-2.5 text-xl font-bold lg:hidden">
                        <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                            <MapPin className="size-5" aria-hidden />
                        </span>
                        NearNow
                    </Link>
                    <h1 className="text-[30px] font-bold tracking-tight">{title}</h1>
                    <p className="mb-8 mt-1.5 text-[15px] text-muted-foreground">{subtitle}</p>
                    {children}
                    <p className="mt-8 text-center text-[15px]">
                        <span className="text-muted-foreground">{footerText} </span>
                        <Link href={footerLinkHref} className="font-semibold text-primary hover:underline">
                            {footerLinkText}
                        </Link>
                    </p>
                </div>
            </main>
        </div>
    );
}
