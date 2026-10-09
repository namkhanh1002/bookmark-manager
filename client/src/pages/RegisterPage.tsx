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
    if (name.trim().length > 80) next.name = "Tên tối đa 80 ký tự";
    if (!email.trim()) next.email = "Email là bắt buộc";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email = "Vui lòng nhập email hợp lệ";
    if (password.length < 8) next.password = "Mật khẩu phải có ít nhất 8 ký tự";
    if (confirm !== password) next.confirm = "Mật khẩu không khớp";
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
      setFormError(err instanceof ApiError ? err.message : "Không thể tạo tài khoản.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthCard
      title="Tạo tài khoản của bạn"
      subtitle="Bắt đầu sắp xếp web thành một thư viện thực sự có ý nghĩa."
      footer={
        <>
          Đã có tài khoản?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Đăng nhập
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">Tên</Label>
          <div className="relative">
            <User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Nguyễn Văn A (tùy chọn)"
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
              placeholder="ban@email.com"
              className="pl-9"
              autoComplete="email"
            />
          </div>
          <FieldError message={errors.email} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="register-password">Mật khẩu</Label>
          <div className="relative">
            <KeyRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="register-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Ít nhất 8 ký tự"
              className="pl-9"
              autoComplete="new-password"
            />
          </div>
          <FieldError message={errors.password} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirm-password">Xác nhận mật khẩu</Label>
          <div className="relative">
            <KeyRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="confirm-password"
              type="password"
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              placeholder="Nhập lại mật khẩu của bạn"
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
          Tạo tài khoản
        </Button>
      </form>
    </AuthCard>
  );
}
