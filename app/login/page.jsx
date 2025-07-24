"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CaravanIcon as Camel } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const users = JSON.parse(localStorage.getItem("users") || "[]");
    const user = users.find((u) => u.email === email);
    if (!user) {
      setError("User not found");
      setLoading(false);
      return;
    }
    if (user.password !== password) {
      setError("Incorrect password");
      setLoading(false);
      return;
    }
    localStorage.setItem("currentUser", JSON.stringify(user));
    setLoading(false);
    router.push("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-950">
      <Card className="w-full max-w-md bg-gray-900 shadow-2xl border-none">
        <CardHeader className="flex flex-col items-center gap-2">
          <Camel className="w-10 h-10 text-amber-400 mb-2" />
          <CardTitle className="text-2xl text-white font-bold">Login</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="bg-gray-800 border border-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="bg-gray-800 border border-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
            />
            {error && (
              <Alert className="border-red-400 bg-red-900/30">
                <AlertDescription className="text-red-200 text-sm">{error}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-lg shadow-md hover:from-amber-600 hover:to-orange-600 focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 transition" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </Button>
            <div className="text-sm text-center mt-2 text-gray-400">
              Don't have an account? <a href="/signup" className="text-amber-400 underline">Sign up</a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 