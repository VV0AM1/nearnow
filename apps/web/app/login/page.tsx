"use client";

import LoginForm from "../../components/features/auth/LoginForm";
import AuthLayout from "../../components/features/auth/AuthLayout";

export default function LoginPage() {
    return (
        <AuthLayout
            title="Welcome back"
            subtitle="Login to connect with your neighborhood"
            footerText="Don't have an account?"
            footerLinkText="Sign up"
            footerLinkHref="/signup"
        >
            <LoginForm />
        </AuthLayout>
    );
}
