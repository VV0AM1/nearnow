"use client";

import MarketingShell from "@/components/marketing/MarketingShell";
import { Card } from "@/components/nn";

export default function LegalPage() {
    return (
        <MarketingShell>
            <main className="mx-auto max-w-3xl space-y-6 px-4 py-14 sm:px-6">
                <h1 className="text-[32px] font-bold tracking-tight">Legal information</h1>

                <Card as="section" className="space-y-3 p-6 sm:p-8">
                    <h2 className="text-[22px] font-bold">Privacy policy</h2>
                    <p className="text-[13px] text-muted-foreground">Last updated: December 2025</p>
                    <p className="text-[15px] leading-relaxed">
                        At NearNow, we take your privacy seriously. This generic policy outlines that we collect minimal location data solely for providing safety alerts. We do not sell your data to third parties.
                    </p>
                </Card>

                <Card as="section" className="space-y-3 p-6 sm:p-8">
                    <h2 className="text-[22px] font-bold">Terms of service</h2>
                    <p className="text-[15px] leading-relaxed">
                        By using NearNow, you agree to treat your neighbors with respect using our platform. False reporting, harassment, and abuse of the SOS feature will result in an immediate permanent ban.
                    </p>
                </Card>
            </main>
        </MarketingShell>
    );
}
