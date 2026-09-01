import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import Logo from "../../components/layout/Logo.jsx";
import Button from "../../components/ui/Button.jsx";
import { Input } from "../../components/ui/Input.jsx";
import { InlineError } from "../../components/ui/Feedback.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useTheme } from "../../context/ThemeContext.jsx";
import { toUserMessage } from "../../services/api/index.js";
import Icon from "../../components/ui/Icon.jsx";

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ username: "", password: "" });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) return <Navigate to="/" replace />;

  const submit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!form.username.trim()) next.username = "Username is required.";
    if (!form.password) next.password = "Password is required.";
    setErrors(next);
    setFormError("");
    if (Object.keys(next).length) return;

    setLoading(true);
    try {
      await login({ username: form.username.trim().toLowerCase(), password: form.password });
      navigate(location.state?.from || "/", { replace: true });
    } catch (err) {
      setFormError(toUserMessage(err, "Unable to sign in. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-full flex-col bg-bg px-5 py-8">
      <div className="flex items-center justify-between">
        <Logo size="sm" />
        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="flex size-10 items-center justify-center rounded-xl text-muted hover:bg-surface2 hover:text-fg"
        >
          <Icon name={theme === "dark" ? "sun" : "moon"} />
        </button>
      </div>

      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
        <Logo size="lg" showTag className="mb-8" />
        <h1 className="text-2xl font-bold tracking-tight text-fg">Sign in</h1>
        <p className="mt-1 text-sm text-muted">
          Access sales, customers and loyalty for your team.
        </p>

        <form onSubmit={submit} className="mt-7 space-y-4" noValidate>
          <Input
            label="Username"
            name="username"
            autoComplete="username"
            autoCapitalize="none"
            placeholder="admin"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            error={errors.username}
            required
          />
          <Input
            label="Password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            error={errors.password}
            required
          />
          <InlineError message={formError} />
          <Button type="submit" size="lg" className="w-full" loading={loading} loadingText="Signing in...">
            Login
          </Button>
        </form>
      </div>
    </div>
  );
}
