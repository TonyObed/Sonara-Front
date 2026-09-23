"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api-client";
import styles from "./page.module.css";

type Invitation = {
  email: string;
  role: string;
  company: { name: string };
};

export default function AcceptInviteForm({ token }: { token: string }) {
  const router = useRouter();
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(Boolean(token));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(token ? "" : "Le lien d'invitation est incomplet.");

  useEffect(() => {
    if (!token) return;

    api.auth.validateInvite(token)
      .then(({ data }) => setInvitation(data))
      .catch((reason: unknown) => {
        setError(reason instanceof ApiError ? reason.message : "Invitation invalide ou expirée.");
      })
      .finally(() => setLoading(false));
  }, [token]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      setError("Renseignez votre prénom et votre nom.");
      return;
    }
    if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      setError("Le mot de passe doit contenir 8 caractères, une majuscule et un chiffre.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      await api.auth.acceptInvite({
        token,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        password,
      });
      router.replace("/dashboard");
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : "Impossible d'accepter l'invitation.");
      setSubmitting(false);
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <Link className={styles.brand} href="/">SONARA</Link>
        <p className={styles.eyebrow}>Invitation collaborateur</p>
        <h1>Rejoindre votre équipe</h1>

        {loading ? <p className={styles.muted}>Vérification de l&apos;invitation…</p> : null}
        {!loading && invitation ? (
          <>
            <p className={styles.muted}>
              Vous rejoignez <strong>{invitation.company.name}</strong> avec l&apos;adresse {invitation.email}.
            </p>
            <form onSubmit={submit}>
              <label>Prénom<input value={firstName} onChange={(event) => setFirstName(event.target.value)} autoComplete="given-name" /></label>
              <label>Nom<input value={lastName} onChange={(event) => setLastName(event.target.value)} autoComplete="family-name" /></label>
              <label>Mot de passe<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" /></label>
              {error ? <p className={styles.error} role="alert">{error}</p> : null}
              <button disabled={submitting} type="submit">
                {submitting ? "Création du compte…" : "Accepter l’invitation"}
              </button>
            </form>
          </>
        ) : null}
        {!loading && !invitation ? (
          <>
            <p className={styles.error} role="alert">{error}</p>
            <Link className={styles.back} href="/login">Retour à la connexion</Link>
          </>
        ) : null}
      </section>
    </main>
  );
}
