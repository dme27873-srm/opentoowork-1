import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { backupCurrentSession } from "@/lib/sessionStorage";
import { Briefcase, Mail, Globe } from "lucide-react";

const EmployerAuth = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  
  const [companyName, setCompanyName] = useState("");
  const [location, setLocation] = useState("");
  const [website, setWebsite] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate("/dashboard");
    });
  }, [navigate]);

  const handleSignUp = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { role: "employer", company_name: companyName, location: location, company_website: website || null },
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
      // Backup session after successful verification
      backupCurrentSession();
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
      // Backup session after successful login
      backupCurrentSession();
      toast({ title: "Welcome back!" });
      navigate("/dashboard");
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <Card className="w-full max-w-md p-8 shadow-xl">
        <div className="flex flex-col items-center gap-3 mb-8">
          {showOtpInput ? <Mail className="h-12 w-12 text-primary" /> : <Briefcase className="h-12 w-12 text-primary" />}
          <h1 className="text-3xl font-bold text-slate-900">{showOtpInput ? "Verify Email" : "Employer Portal"}</h1>
        </div>

        {showOtpInput ? (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <Label>Verification Code</Label>
            <Input value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="123456" className="text-center text-lg tracking-widest" required />
            <Button type="submit" disabled={loading} className="w-full">{loading ? "Verifying..." : "Verify & Login"}</Button>
            <Button type="button" variant="ghost" className="w-full" onClick={() => setShowOtpInput(false)}>Back</Button>
          </form>
        ) : (
          <Tabs defaultValue="signin">
            <TabsList className="grid grid-cols-2 mb-6">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2"><Label>Email</Label><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
                <div className="space-y-2"><Label>Password</Label><Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} /></div>
                <Button className="w-full" disabled={loading}>{loading ? "Signing in..." : "Sign In"}</Button>
              </form>
            </TabsContent>
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2"><Label>Company Name</Label><Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} required /></div>
                <div className="space-y-2"><Label>Company Location</Label><Input value={location} onChange={(e) => setLocation(e.target.value)} required /></div>
                <div className="space-y-2"><Label>Website (Optional)</Label><div className="relative"><Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input value={website} onChange={(e) => setWebsite(e.target.value)} className="pl-9" /></div></div>
                <div className="space-y-2"><Label>Email</Label><Input type="email" value={email} required onChange={(e) => setEmail(e.target.value)} /></div>
                <div className="space-y-2"><Label>Password</Label><Input type="password" minLength={6} required value={password} onChange={(e) => setPassword(e.target.value)} /></div>
                <Button className="w-full" disabled={loading}>{loading ? "Creating Account..." : "Sign Up"}</Button>
              </form>
            </TabsContent>
          </Tabs>
        )}
      </Card>
    </div>
  );
};

export default EmployerAuth;