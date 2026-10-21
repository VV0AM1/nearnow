"use client";

import { Check, Smartphone } from "lucide-react";
import MarketingShell from "@/components/marketing/MarketingShell";
import { Banner, Button, Card } from "@/components/nn";

const FEATURES = ["Opt-in alerts for the area you choose", "Lost & found with private contact requests", "Native maps, dark mode and large-text support", "Urgent help request (not an emergency service — call 112)", "English, Español, Català"];

export default function DownloadPage() {
    return (
        <MarketingShell>
            <main className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 md:grid-cols-2 md:py-24">
                <div className="space-y-7">
                    <h1 className="text-[clamp(2.2rem,5vw,3.25rem)] font-bold leading-[1.08] tracking-tight">
                        NearNow for <span className="text-primary">iPhone and Android</span>
                    </h1>
                    <p className="max-w-lg text-lg text-muted-foreground">See and share useful local updates, find lost items, and confirm or resolve reports from your phone.</p>
                    <ul className="space-y-3">
                        {FEATURES.map((f) => (
                            <li key={f} className="flex items-center gap-3 text-[15px] font-medium">
                                <span className="flex size-6 items-center justify-center rounded-full bg-success-soft text-success">
                                    <Check className="size-4" aria-hidden />
                                </span>
                                {f}
                            </li>
                        ))}
                    </ul>
                    <Banner tone="accent" icon={Smartphone} message="The mobile apps are in testing and not in the app stores yet. Until then, use NearNow here on the web — it works on phones too." />
                    <Button href="/signup" size="lg">
                        Use NearNow on the web
                    </Button>
                </div>
                <div className="mx-auto w-full max-w-[300px]">
                    <div className="rounded-[46px] border-[10px] border-foreground/90 bg-background p-3 shadow-[var(--shadow-float)]">
                        <div className="space-y-3 rounded-[32px] bg-background p-3 pt-6">
                            <p className="px-1 text-[26px] font-bold tracking-tight">Barcelona</p>
                            {["Market on the square, Saturday", "Found: keys with a red tag", "Street closed until 18:00"].map((t) => (
                                <Card key={t} className="space-y-2 p-3.5">
                                    <span className="text-[11px] font-semibold uppercase tracking-wide text-subtle">Example</span>
                                    <p className="text-sm font-semibold">{t}</p>
                                    <div className="h-2 w-2/3 rounded-full bg-surface-2" />
                                </Card>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        </MarketingShell>
    );
}
