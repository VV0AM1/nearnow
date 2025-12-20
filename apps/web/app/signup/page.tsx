"use client";

import SignupForm from "../../components/features/auth/SignupForm";
import AuthLayout from "../../components/features/auth/AuthLayout";

export default function SignupPage() {
    return (
        <AuthLayout
            title="Create an account"
            subtitle="Join your local community today"
            footerText="Already have an account?"
            footerLinkText="Log in"
            footerLinkHref="/login"
        >
            <SignupForm />
        </AuthLayout>
    );
}
