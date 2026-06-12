import type { Metadata } from "next";
import AuthPage from "@/components/auth/AuthPage";

export const metadata: Metadata = {
  title: "Sonara — Créer un compte",
  description:
    "Créez votre compte Sonara et lancez votre première campagne d'enquête vocale IA en moins de 10 minutes.",
};

export default function SignupPage() {
  return <AuthPage initialMode="signup" />;
}
