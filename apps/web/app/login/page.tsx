"use client";

import LoginForm from "../../components/features/auth/LoginForm";
import AuthLayout from "../../components/features/auth/AuthLayout";

export default function LoginPage() {
    return (
        <AuthLayout
            title="Welcome back"
            subtitle="Sign in to see what is happening around you."
            footerText="New to NearNow?"
            footerLinkText="Create an account"
            footerLinkHref="/signup"
        >
            <LoginForm />
        </AuthLayout>
    );
}
