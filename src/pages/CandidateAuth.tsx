import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { UserCircle, Mail } from "lucide-react";

const CandidateAuth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) navigate("/dashboard");
    };
    checkSession();
  }, [navigate]);

  const handleSignUp = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, phone: phone, role: "candidate" },
        },
      });

      if (error) throw error;
      toast({ title: "Verification code sent!" });
      setShowOtpInput(true); 
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({ email, token: otp, type: 'signup' });
      if (error) throw error;
      toast({ title: "Verified!" });
      navigate("/dashboard");
    } catch (error: any) {
      toast({ title: "Verification failed", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast({ title: "Welcome back!" });
      navigate("/dashboard");
    } catch (error: any) {
      toast({ title: "Login failed", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-background p-4">
      <Card className="w-full max-w-md p-8 shadow-xl border-border/40">
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            {showOtpInput ? <Mail className="h-10 w-10 text-primary-foreground" /> : <UserCircle className="h-10 w-10 text-primary-foreground" />}
          </div>
          <h1 className="text-3xl font-bold">
            {showOtpInput ? "Verify Email" : (isSignup ? "Create Account" : "Candidate Login")}
          </h1>
        </div>

        {showOtpInput ? (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <Label>Verification Code</Label>
            <Input value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="123456" className="text-center text-lg tracking-widest" required />
            <Button type="submit" disabled={loading} className="w-full">{loading ? "Verifying..." : "Verify & Login"}</Button>
            <Button type="button" variant="ghost" className="w-full" onClick={() => setShowOtpInput(false)}>Back</Button>
          </form>
        ) : (
          <Tabs value={isSignup ? "signup" : "signin"} onValueChange={(v) => setIsSignup(v === "signup")}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <Label>Email</Label><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                <Label>Password</Label><Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                <Button type="submit" disabled={loading} className="w-full">{loading ? "Signing in..." : "Sign In"}</Button>
              </form>
            </TabsContent>
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <Label>Full Name</Label><Input required value={fullName} onChange={(e) => setFullName(e.target.value)} />
                <Label>Email</Label><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                <Label>Phone</Label><Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
                <Label>Password</Label><Input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
                <Button type="submit" disabled={loading} className="w-full">{loading ? "Sending Code..." : "Sign Up"}</Button>
              </form>
            </TabsContent>
          </Tabs>
        )}
      </Card>
    </div>
  );
};

export default CandidateAuth;