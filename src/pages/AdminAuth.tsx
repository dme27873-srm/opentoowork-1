import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck, Lock } from "lucide-react";

const AdminAuth = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");

  useEffect(() => {
    // If already logged in, redirect to dashboard
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate("/dashboard");
    });
  }, [navigate]);

  // STEP 1: Admin Sign Up
  const handleSignUp = async (e: any) => {
    e.preventDefault();
    setLoading(true);

    try {
      // We pass role: 'admin' in metadata so the trigger assigns it in the profiles table
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: "admin",
            full_name: fullName,
          },
        },
      });

      if (error) throw error;

      toast({ title: "Verification code sent to your email!" });
      setShowOtpInput(true);

    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: Verify OTP
  const handleVerifyOtp = async (e: any) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'signup',
      });

      if (error) throw error;

      toast({ title: "Admin account verified!" });
      navigate("/dashboard");

    } catch (error: any) {
      toast({
        title: "Verification failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Standard Login
  const handleSignIn = async (e: any) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Optional: Check if the user is actually an admin
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
            {showOtpInput ? <Lock className="h-8 w-8" /> : <ShieldCheck className="h-8 w-8" />}
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            {showOtpInput ? "Verify Identity" : "Admin Portal"}
          </h1>
          <p className="text-zinc-400 text-center text-sm">
            {showOtpInput 
              ? "Enter the code sent to your email" 
              : "Secure access for platform administrators"}
          </p>
        </div>

        {showOtpInput ? (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-zinc-300">Verification Code</Label>
              <Input 
                value={otp} 
                onChange={(e) => setOtp(e.target.value)} 
                placeholder="123456"
                className="text-center text-lg tracking-widest bg-zinc-950 border-zinc-800"
                required 
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-red-600 hover:bg-red-700 text-white">
              {loading ? "Verifying..." : "Verify & Access"}
            </Button>
            <Button 
              type="button" 
              variant="ghost" 
              className="w-full text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800" 
              onClick={() => setShowOtpInput(false)}
            >
              Back
            </Button>
          </form>
        ) : (
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 bg-zinc-950">
              <TabsTrigger value="signin" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-100">Login</TabsTrigger>
              <TabsTrigger value="signup" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-100">Create Admin</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-zinc-300">Email</Label>
                  <Input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-zinc-950 border-zinc-800"
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
                    className="bg-zinc-950 border-zinc-800"
                  />
                </div>
                <Button className="w-full bg-red-600 hover:bg-red-700 text-white" disabled={loading}>
                  {loading ? "Authenticating..." : "Access Panel"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-zinc-300">Full Name</Label>
                  <Input 
                    value={fullName} 
                    onChange={(e) => setFullName(e.target.value)} 
                    required 
                    className="bg-zinc-950 border-zinc-800"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-300">Email</Label>
                  <Input 
                    type="email" 
                    value={email} 
                    required 
                    onChange={(e) => setEmail(e.target.value)} 
                    className="bg-zinc-950 border-zinc-800"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-300">Password</Label>
                  <Input
                    type="password"
                    minLength={6}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-zinc-950 border-zinc-800"
                  />
                </div>
                <Button className="w-full bg-red-600 hover:bg-red-700 text-white" disabled={loading}>
                  {loading ? "Creating Account..." : "Create Admin Account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        )}
      </Card>
    </div>
  );
};

export default AdminAuth;