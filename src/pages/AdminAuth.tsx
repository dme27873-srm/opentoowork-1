import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck } from "lucide-react";

const AdminAuth = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    // If already logged in, redirect to dashboard
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate("/dashboard");
    });
  }, [navigate]);

  // Admin Login
  const handleSignIn = async (e: any) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Check if the user is actually an admin
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();

      if (profile?.role !== "admin") {
        toast({ 
          title: "Access Denied", 
          description: "This account does not have admin privileges.", 
          variant: "destructive" 
        });
        await supabase.auth.signOut();
      } else {
        toast({ title: "Welcome back, Admin!" });
        navigate("/dashboard");
      }

    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4">
      <Card className="w-full max-w-md p-8 shadow-2xl border-zinc-800 bg-zinc-900 text-zinc-100">
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="p-3 rounded-full bg-red-900/20 text-red-500">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Admin Portal
          </h1>
          <p className="text-zinc-400 text-center text-sm">
            Restricted access for platform administrators only.
          </p>
        </div>

        <form onSubmit={handleSignIn} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-zinc-300">Email</Label>
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-zinc-950 border-zinc-800 focus:border-red-600"
              placeholder="admin@opentoowork.com"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-zinc-300">Password</Label>
            <Input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-zinc-950 border-zinc-800 focus:border-red-600"
            />
          </div>
          <Button className="w-full bg-red-600 hover:bg-red-700 text-white font-medium" disabled={loading}>
            {loading ? "Authenticating..." : "Access Panel"}
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default AdminAuth;