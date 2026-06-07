import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button, Hero } from "@/components/ui";
import { useAuth } from "../hooks";
import { routePaths } from "../routes";
import { getAuthErrorMessage } from "../services";

export default function Login() {
  const navigate = useNavigate();
  const { login, user, loading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      navigate(routePaths.dashboard);
    }
  }, [loading, navigate, user]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await login(email, password);
      navigate(routePaths.dashboard);
    } catch (err) {
      setError(getAuthErrorMessage(err, "login"));
    } finally {
      setSubmitting(false);
    }
  }

  const isDisabled = loading || submitting;

  return (
    <div className="min-h-screen text-slate-50">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl items-center px-6 py-10 lg:px-10">
        <div className="grid w-full gap-12 rounded-[32px] border border-white/10 bg-[linear-gradient(135deg,rgba(10,10,10,0.72),rgba(3,3,3,0.78))] p-6 shadow-[0_40px_120px_rgba(0,0,0,0.45)] backdrop-blur-[6px] lg:grid-cols-[minmax(0,1.2fr)_minmax(420px,0.8fr)] lg:p-10">
          <Hero
            onPrimaryAction={() => {
              document.getElementById("login-card")?.scrollIntoView({
                behavior: "smooth",
                block: "center",
              });
            }}
            onSecondaryAction={() => navigate(routePaths.signup)}
          />

          <div
            id="login-card"
            className="w-full rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(8,8,8,0.76),rgba(3,3,3,0.84))] p-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl sm:p-10"
          >
            <div className="mb-7">
              <p className="mb-3 text-xs uppercase tracking-[0.22em] text-neutral-100">
                Sign In
              </p>
              <h2 className="text-3xl font-semibold tracking-tight text-white">
                Welcome back
              </h2>
              <p className="mt-3 text-sm leading-6 text-neutral-400 sm:text-base">
                Log in to continue building your roadmap, tracking placements, and
                using KeepUP AI.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <label className="flex flex-col gap-2">
                <span className="text-sm text-neutral-200">Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                  className="h-12 rounded-2xl border border-white/8 bg-white/[0.08] px-4 text-sm text-white placeholder:text-neutral-500 focus:border-white focus:bg-white/[0.1] focus:outline-none"
                />
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-sm text-neutral-200">Password</span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  className="h-12 rounded-2xl border border-white/8 bg-white/[0.08] px-4 text-sm text-white placeholder:text-neutral-500 focus:border-white focus:bg-white/[0.1] focus:outline-none"
                />
              </label>

              {error ? (
                <div className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-neutral-200">
                  {error}
                </div>
              ) : null}

              <Button
                type="submit"
                disabled={isDisabled}
                size="lg"
                className="mt-2 h-12 w-full rounded-2xl text-sm font-semibold"
              >
                {loading ? "Checking session..." : submitting ? "Logging in..." : "Login"}
                {!loading && !submitting ? <ArrowRight className="ml-2 h-4 w-4" /> : null}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-neutral-500">
              New here?{" "}
              <Link
                to={routePaths.signup}
                className="font-medium text-white transition-colors hover:text-neutral-200"
              >
                Create account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
