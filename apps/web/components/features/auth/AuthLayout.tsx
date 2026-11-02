import Link from "next/link";
import { Clock, MapPin, ShieldCheck } from "lucide-react";
import { IsoCity } from "@/components/scene/IsoCity";
import { Depth, PointerStage } from "@/components/motion";

interface AuthLayoutProps {
    children: React.ReactNode;
    title: string;
    subtitle: string;
    footerText: string;
    footerLinkText: string;
    footerLinkHref: string;
}

const POINTS = [
    { icon: MapPin, text: "Updates from neighbours around the area you choose." },
    { icon: Clock, text: "Every post shows when it was posted and whether others confirmed it." },
    { icon: ShieldCheck, text: "Your exact location is never shown unless you choose to share it." },
];

/** Sign-in frame: a dark "night map" panel on wide screens, a single column on phones. */
export default function AuthLayout({ children, title, subtitle, footerText, footerLinkText, footerLinkHref }: AuthLayoutProps) {
    return (
        <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
            <aside data-theme="dark" className="contours relative m-3 hidden overflow-hidden rounded-[32px] bg-background p-10 text-foreground shadow-[var(--shadow-deep)] lg:flex lg:flex-col lg:justify-between">
                <div aria-hidden className="pointer-events-none absolute -left-24 top-1/3 size-[420px] rounded-full bg-primary/20 blur-[100px]" />
                <Link href="/welcome" className="relative flex items-center gap-2.5">
                    <span className="relative flex size-9 items-center justify-center rounded-full bg-foreground text-background">
                        <MapPin className="size-[18px]" aria-hidden />
                        <span className="absolute -right-0.5 -top-0.5 size-3 rounded-full border-2 border-background bg-signal" />
                    </span>
                    <span className="display text-[21px]">NearNow</span>
                </Link>
                <PointerStage className="relative -my-6 h-[380px]">
                    <Depth depth={-16} className="absolute inset-0 flex items-center justify-center">
                        <IsoCity seed={17} tiles={8} pins={[]} className="scale-[0.78]" />
                    </Depth>
                </PointerStage>
                <div className="relative space-y-6">
                    <h2 className="display text-[44px] leading-[0.98]">
                        Your street,
                        <span className="ink-gradient block">right now.</span>
                    </h2>
                    <ul className="space-y-3">
                        {POINTS.map(({ icon: IconC, text }) => (
                            <li key={text} className="flex gap-3 text-[15px] leading-snug text-muted-foreground">
                                <IconC className="mt-0.5 size-[18px] shrink-0 text-primary" aria-hidden />
                                {text}
                            </li>
                        ))}
                    </ul>
                    <p className="font-mono text-[11px] uppercase tracking-wider text-subtle">Not an emergency service · in danger, call 112</p>
                </div>
            </aside>

            <main className="contours flex items-center justify-center px-4 py-10 sm:px-8">
                <div className="w-full max-w-[420px]">
                    <Link href="/welcome" className="mb-10 flex items-center gap-2.5 lg:hidden">
                        <span className="relative flex size-9 items-center justify-center rounded-full bg-ink text-paper">
                            <MapPin className="size-[18px]" aria-hidden />
                            <span className="absolute -right-0.5 -top-0.5 size-3 rounded-full border-2 border-background bg-signal" />
                        </span>
                        <span className="display text-[21px]">NearNow</span>
                    </Link>
                    <h1 className="display text-[42px] leading-none">{title}</h1>
                    <p className="mb-8 mt-3 text-[16px] text-muted-foreground">{subtitle}</p>
                    <div className="rounded-[28px] bg-surface p-6 shadow-[var(--shadow-deep)] ring-1 ring-border sm:p-7">{children}</div>
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
