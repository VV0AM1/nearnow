"use client";

import SignupForm from "../../components/features/auth/SignupForm";
import AuthLayout from "../../components/features/auth/AuthLayout";

export default function SignupPage() {
    return (
        <AuthLayout
            title="Join NearNow"
            subtitle="Free. Follow your area and help your neighbours."
            footerText="Already have an account?"
            footerLinkText="Sign in"
            footerLinkHref="/login"
        >
            <SignupForm />
        </AuthLayout>
    );
}
