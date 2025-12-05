import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Shield } from "lucide-react";

const Navbar = () => {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single();
      
      if (data?.role === 'admin') {
        setIsAdmin(true);
      }
    }
  };

  return (
    <nav className="border-b border-border/40 bg-background/95 sticky top-0 z-50 backdrop-blur-md shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <img
              src="/assets/opentoowork-icon1-BZ2bbVrF.png"
              alt="Opentoowork Logo"
              className="h-14 w-14 object-contain"
            />
            <span className="text-xl font-bold text-primary tracking-wide">
              OPENTOOWORK
            </span>
          </Link>

          {/* ALL NAV BUTTONS */}
          <div className="flex items-center gap-2 md:gap-4">

            {/* Admin Link (Conditional) */}
            {isAdmin && (
              <Link to="/admin">
                <Button variant="ghost" className="text-base text-red-600 hover:text-red-700 hover:bg-red-50">
                  <Shield className="w-4 h-4 mr-1" />
                  Admin
                </Button>
              </Link>
            )}

            <Link to="/jobs">
              <Button variant="ghost" className="text-base">
                Find Jobs
              </Button>
            </Link>

            <Link to="/about">
              <Button variant="ghost" className="text-base">
                About
              </Button>
            </Link>

            <Link to="/employer/auth">
              <Button variant="outline" className="text-base border-primary hidden md:inline-flex">
                For Employer
              </Button>
            </Link>

            <Link to="/candidate/auth">
              <Button variant="outline" className="hidden md:inline-flex">For Candidate</Button>
            </Link>

            <Link to="/candidate/auth">
              <Button className="bg-gradient-to-r from-primary to-accent text-white shadow-md hover:opacity-90">
                Get Started
              </Button>
            </Link>

          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;