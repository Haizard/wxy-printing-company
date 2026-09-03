import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "react-router-dom";

export default function AuthPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { login, register } = useAuth();

  // Staff-area routes live behind the admin panel — clients must never be
  // dropped back into them after signing in.
  const STAFF_AREA_PREFIXES = [
    "/dashboard",
    "/catalog",
    "/calculator",
    "/quotes",
    "/orders",
    "/jobs",
    "/inventory",
    "/reports",
    "/price-rules",
    "/projects",
    "/messages",
    "/users",
    "/settings",
    "/chat",
    "/cart",
  ];

  // When a guest was sent here from a protected page (client orders, chat…),
  // send them back there after sign-in. Otherwise route by role: clients land
  // in their own area, staff in the dashboard.
  const getReturnPath = (role?: string) => {
    const from = (location.state as any)?.from;
    const fromPath = from?.pathname && from.pathname !== "/auth" ? from.pathname : "";
    const isStaffArea = STAFF_AREA_PREFIXES.some(
      (prefix) => fromPath === prefix || fromPath.startsWith(prefix + "/"),
    );
    if (role === "customer" && (!fromPath || isStaffArea)) {
      return "/client";
    }
    if (fromPath) {
      return fromPath + (from.search || "") + (from.hash || "");
    }
    return "/dashboard";
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const account = await login(email, password);
      toast({
        title: "Welcome back!",
        description: "You've been signed in successfully.",
        variant: "success",
      });
      navigate(getReturnPath(account?.role), { replace: true });
    } catch (err: any) {
      toast({
        title: "Sign in failed",
        description: err.message || "Invalid credentials",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const fullName = formData.get("name") as string;
    const email = formData.get("signup-email") as string;
    const password = formData.get("signup-password") as string;

    try {
      const account = await register({ fullName, email, password });
      toast({
        title: "Welcome to WXY Business Solutions!",
        description: "Your client account has been created.",
        variant: "success",
      });
      navigate(getReturnPath(account?.role), { replace: true });
    } catch (err: any) {
      toast({
        title: "Registration failed",
        description: err.message || "Could not create account",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      {/* Decorative orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[var(--accent-primary)] opacity-[0.03] rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[var(--accent-tertiary)] opacity-[0.03] rounded-full blur-[120px]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Back to home */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-subhead text-[var(--text-secondary)] hover:text-[var(--accent-primary)] mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>

        {/* Logo */}
        <div className="text-center mb-8">
          <img
            src="/wxy-logo.svg"
            alt="WXY Business Solutions"
            className="h-12 w-auto mx-auto mb-4"
          />
          <h1 className="text-title-1 font-bold text-[var(--text-primary)]">
            Welcome to WXY Business Solutions
          </h1>
          <p className="text-subhead text-[var(--text-secondary)] mt-2">
            Clients place requests and chat with our team — staff manage the
            platform.
          </p>
        </div>

        {/* Auth form */}
        <div className="glass-card-strong p-6">
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="w-full mb-6">
              <TabsTrigger value="signin" className="flex-1">
                Sign In
              </TabsTrigger>
              <TabsTrigger value="signup" className="flex-1">
                Sign Up
              </TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="John Doe"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    name="signup-email"
                    type="email"
                    placeholder="you@example.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="signup-password"
                      name="signup-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a password"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Creating account..." : "Create Account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>

        <p className="text-center text-caption text-[var(--text-tertiary)] mt-6">
          By continuing, you agree to WXY Business Solutions' Terms of Service
          and Privacy Policy.
        </p>
      </motion.div>
    </div>
  );
}
