"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Footer from "../../components/layout/Footer";

export default function LegalPage() {
    return (
        <div className="min-h-screen bg-black text-white flex flex-col">
            <nav className="p-6 max-w-4xl mx-auto w-full">
                <Link href="/" className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
                    <ArrowLeft className="h-5 w-5" />
                    Back to Home
                </Link>
            </nav>

            <main className="flex-1 max-w-4xl mx-auto px-6 py-12 prose prose-invert">
                <h1>Legal Information</h1>

                <section className="mb-12">
                    <h2>Privacy Policy</h2>
                    <p>Last updated: December 2025</p>
                    <p>At NearNow, we take your privacy seriously. This generic policy outlines that we collect minimal location data solely for providing safety alerts. We do not sell your data to third parties.</p>
                </section>

                <section>
                    <h2>Terms of Service</h2>
                    <p>By using NearNow, you agree to treat your neighbors with respect using our platform. False reporting, harassment, and abuse of the SOS feature will result in an immediate permanent ban.</p>
                </section>
            </main>

            <Footer />
        </div>
    );
}
