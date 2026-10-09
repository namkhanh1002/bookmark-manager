import { useState } from "react";
import type { FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { KeyRound, Mail, User } from "lucide-react";
import { AuthCard } from "../components/AuthCard";
import { Button } from "../components/ui/button";
import { FieldError, Input, Label } from "../components/ui/input";
import { Spinner } from "../components/ui/skeleton";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../lib/api";

export function RegisterPage() {
  const { register, user, initializing } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string; confirm?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!initializing && user) return <Navigate to="/bookmarks" replace />;

  const validate = () => {
    const next: typeof errors = {};
    if (name.trim().length > 80) next.name = "Name must be 80 characters or fewer";
    if (!email.trim()) next.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email = "Enter a valid email";
    if (password.length < 8) next.password = "Password must be at least 8 characters";
    if (confirm !== password) next.confirm = "Passwords do not match";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);
    if (!validate()) return;

    setBusy(true);
    try {
      await register(email.trim().toLowerCase(), password, name.trim() || undefined);
      navigate("/bookmarks", { replace: true });
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Could not create the account.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthCard
      title="Create your account"
      subtitle="Start organizing the web into a library that actually makes sense."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">Name</Label>
          <div className="relative">
            <User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Jane Doe (optional)"
              className="pl-9"
              autoComplete="name"
              autoFocus
            />
          </div>
          <FieldError message={errors.name} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="register-email">Email</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="register-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="pl-9"
              autoComplete="email"
            />
          </div>
          <FieldError message={errors.email} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="register-password">Password</Label>
          <div className="relative">
            <KeyRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="register-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 8 characters"
              className="pl-9"
              autoComplete="new-password"
            />
          </div>
          <FieldError message={errors.password} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirm-password">Confirm password</Label>
          <div className="relative">
            <KeyRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="confirm-password"
              type="password"
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              placeholder="Repeat your password"
              className="pl-9"
              autoComplete="new-password"
            />
          </div>
          <FieldError message={errors.confirm} />
        </div>

        {formError && (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
            {formError}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={busy}>
          {busy && <Spinner className="size-4" />}
          Create account
        </Button>
      </form>
    </AuthCard>
  );
}
