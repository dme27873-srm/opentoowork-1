import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import CandidateDashboard from "@/components/CandidateDashboard";
import EmployerDashboard from "@/components/EmployerDashboard";

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<"candidate" | "employer" | "admin" | null>(null);

  useEffect(() => {
    let mounted = true;

    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          if (mounted) {
            setLoading(false);
            navigate("/candidate/auth");
          }
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single();

        if (mounted) {
          if (profile) {
            setUserRole(profile.role);
          }
          setLoading(false);
        }
      } catch (error) {
        console.error("Dashboard Auth Error:", error);
        if (mounted) setLoading(false);
      }
    };

    checkUser();

    // FAILSAFE: Stop loading after 3 seconds no matter what
    const timer = setTimeout(() => {
        if (mounted && loading) setLoading(false);
    }, 3000);

    return () => {
        mounted = false;
        clearTimeout(timer);
    };
  }, [navigate]);

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
      </div>
    </div>
  );
};

export default Dashboard;