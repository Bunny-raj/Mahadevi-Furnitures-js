import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function AdminLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await login(email, password);
    setLoading(false);
    if (res.ok) navigate("/admin");
    else setError(res.error);
  };

  return (
    <div data-testid="admin-login-page" className="flex min-h-screen items-center justify-center bg-[#1A1817] px-6">
      <div className="w-full max-w-sm">
        <Link to="/" data-testid="admin-login-logo" className="mb-10 block text-center leading-none">
          <span className="font-display block text-2xl font-bold tracking-tight text-[#FAF7F2]">MAHADEVI</span>
          <span className="mt-1 block text-[10px] uppercase tracking-[0.45em] text-[#8C5A35]">Furnitures · Admin</span>
        </Link>
        <form
          onSubmit={submit}
          className="border border-[#EAE3D6]/15 bg-[#FAF7F2]/5 p-8 backdrop-blur"
        >
          <div className="mb-5">
            <Label htmlFor="admin-email" className="text-xs uppercase tracking-[0.2em] text-[#EAE3D6]/70">Email</Label>
            <Input
              id="admin-email"
              data-testid="admin-email-input"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@mahadevifurnitures.com"
              className="mt-2 rounded-none border-[#EAE3D6]/20 bg-transparent text-[#FAF7F2] placeholder:text-[#EAE3D6]/30 focus-visible:ring-[#8C5A35]/50"
            />
          </div>
          <div className="mb-6">
            <Label htmlFor="admin-password" className="text-xs uppercase tracking-[0.2em] text-[#EAE3D6]/70">Password</Label>
            <Input
              id="admin-password"
              data-testid="admin-password-input"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-2 rounded-none border-[#EAE3D6]/20 bg-transparent text-[#FAF7F2] placeholder:text-[#EAE3D6]/30 focus-visible:ring-[#8C5A35]/50"
            />
          </div>
          {error && (
            <p data-testid="admin-login-error" className="mb-4 border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
              {error}
            </p>
          )}
          <Button
            data-testid="admin-login-submit-button"
            type="submit"
            disabled={loading}
            className="w-full rounded-none bg-[#8C5A35] py-6 text-xs uppercase tracking-[0.25em] text-[#FAF7F2] transition-colors duration-300 hover:bg-[#734A2C]"
          >
            {loading ? "Signing in…" : "Sign In"}
          </Button>
        </form>
        <Link to="/" data-testid="admin-back-to-site" className="mt-6 block text-center text-xs uppercase tracking-[0.25em] text-[#EAE3D6]/50 transition-colors duration-300 hover:text-[#EAE3D6]">
          ← Back to website
        </Link>
      </div>
    </div>
  );
}
