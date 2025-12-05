import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import CandidateDashboard from "@/components/CandidateDashboard";
import EmployerDashboard from "@/components/EmployerDashboard";
import { withTimeout } from "@/lib/utils";
import { restoreSessionFromBackup } from "@/lib/sessionStorage";
import { useToast } from "@/hooks/use-toast";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<"candidate" | "employer" | "admin" | null>(null);

  useEffect(() => {
    let mounted = true;

    const checkUser = async () => {
      try {
        // Attempt to get session with a timeout (e.g. 4 seconds)
        // If Supabase hangs, this will error out and we can handle it
        const { data: { session } } = await withTimeout(
          supabase.auth.getSession().then((res) => res),
          10000
        );

        if (!session) {
          if (mounted) {
            setLoading(false);
            navigate("/candidate/auth");
          }
          return;
        }

        const { data: profile } = await withTimeout(
          supabase
            .from("profiles")
            .select("role")
            .eq("id", session.user.id)
            .single()
            .then((res) => res),
          4000
        );

        if (mounted) {
          if (profile) {
            setUserRole(profile.role);
          }
          setLoading(false);
        }
      } catch (error) {
        console.error("Dashboard Auth Error or Timeout:", error);
        // If it times out or fails, stop loading so the user isn't stuck
        if (mounted) setLoading(false);
      }
    };

    checkUser();

    // FAILSAFE: Stop loading after 5 seconds no matter what
    const timer = setTimeout(() => {
        if (mounted && loading) setLoading(false);
    }, 5000);

    return () => {
        mounted = false;
        clearTimeout(timer);
    };
  }, [navigate]);

  // If loading stalls for > 8 seconds, attempt to restore session
  useEffect(() => {
    if (!loading) return;

    const timeout = setTimeout(() => {
      console.warn("[Dashboard] Loading stalled for 8 seconds, attempting session recovery...");
      if (restoreSessionFromBackup()) {
        toast({
          title: "Session Recovered",
          description: "Your session was restored. Refreshing page...",
        });
        setTimeout(() => window.location.reload(), 1500);
      } else {
        toast({
          title: "Session Lost",
          description: "Could not recover session. Please log in again.",
          variant: "destructive",
        });
        setTimeout(() => navigate("/candidate/auth"), 2000);
      }
    }, 8000);

    return () => clearTimeout(timeout);
  }, [loading, navigate, toast]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // If role is null after loading (e.g. timeout), show a fallback or error
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto py-6">
        {userRole === "candidate" && <CandidateDashboard />}
        {userRole === "employer" && <EmployerDashboard />}
        {userRole === "admin" && (
            <div className="text-center py-20">
                <h1 className="text-2xl font-bold">Admin Account</h1>
                <p>Please use the <a href="/#/admin" className="text-primary hover:underline">Admin Portal</a> to manage the platform.</p>
            </div>
        )}
        {!userRole && (
            <div className="text-center py-20">
                <p className="text-muted-foreground">Unable to load profile information.</p>
                <a href="/candidate/auth" className="text-primary hover:underline mt-2 inline-block">Go to Login</a>
            </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;