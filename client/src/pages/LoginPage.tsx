import { useState } from "react";
import type { FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { KeyRound, Mail } from "lucide-react";
import { AuthCard } from "../components/AuthCard";
import { Button } from "../components/ui/button";
import { FieldError, Input, Label } from "../components/ui/input";
import { Spinner } from "../components/ui/skeleton";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../lib/api";

const DEMO_EMAIL = "demo@example.com";
const DEMO_PASSWORD = "password123";

export function LoginPage() {
  const { login, user, initializing } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!initializing && user) return <Navigate to="/bookmarks" replace />;

  const validate = () => {
    const next: { email?: string; password?: string } = {};
    if (!email.trim()) next.email = "Email là bắt buộc";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email = "Vui lòng nhập email hợp lệ";
    if (!password) next.password = "Mật khẩu là bắt buộc";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);
    if (!validate()) return;

    setBusy(true);
    try {
      await login(email.trim().toLowerCase(), password);
      navigate("/bookmarks", { replace: true });
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Không thể đăng nhập. Vui lòng thử lại.");
    } finally {
      setBusy(false);
    }
  };

  const fillDemo = () => {
    setEmail(DEMO_EMAIL);
    setPassword(DEMO_PASSWORD);
    setErrors({});
    setFormError(null);
  };

  return (
    <AuthCard
      title="Chào mừng trở lại"
      subtitle="Đăng nhập để truy cập các liên kết, thẻ và bộ sưu tập của bạn."
      footer={
        <>
          Lần đầu đến đây?{" "}
          <Link to="/register" className="font-medium text-primary hover:underline">
            Tạo tài khoản
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="ban@email.com"
              className="pl-9"
              autoComplete="email"
              autoFocus
            />
          </div>
          <FieldError message={errors.email} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Mật khẩu</Label>
          <div className="relative">
            <KeyRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              className="pl-9"
              autoComplete="current-password"
            />
          </div>
          <FieldError message={errors.password} />
        </div>

        {formError && (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
            {formError}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={busy}>
          {busy && <Spinner className="size-4" />}
          Đăng nhập
        </Button>

        <button
          type="button"
          onClick={fillDemo}
          className="w-full rounded-lg border border-dashed border-border px-3 py-2.5 text-xs font-medium text-muted-foreground transition hover:border-primary/40 hover:text-primary"
        >
          Dùng tài khoản demo · demo@example.com / password123
        </button>
      </form>
    </AuthCard>
  );
}
