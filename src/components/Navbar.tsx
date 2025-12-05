import { Link, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Shield, LayoutDashboard, LogOut, Menu, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";

const Navbar = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userRole, setUserRole] = useState<"candidate" | "employer" | "admin" | null>(null);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    checkUser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session) {
        await fetchRole(session.user.id);
      } else {
        setUserRole(null);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setSession(session);
    if (session) await fetchRole(session.user.id);
  };

  const fetchRole = async (userId: string) => {
    const { data } = await supabase.from("profiles").select("role").eq("id", userId).single();
    if (data) setUserRole(data.role);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
    toast({ title: "Signed out successfully" });
  };

  const NavLinks = ({ mobile = false }: { mobile?: boolean }) => {
    const baseClass = mobile ? "flex flex-col gap-4 w-full" : "flex items-center gap-2 md:gap-4";
    const btnClass = mobile ? "w-full justify-start" : "";

    return (
      <div className={baseClass}>
        {userRole !== 'admin' && (
          <Link to="/jobs" className={mobile ? "w-full" : ""}>
            <Button variant="ghost" className={`text-base ${btnClass}`}>
              {userRole === 'employer' ? "View Jobs" : "Find Jobs"}
            </Button>
          </Link>
        )}

        <Link to="/about" className={mobile ? "w-full" : ""}>
          <Button variant="ghost" className={`text-base ${btnClass}`}>About</Button>
        </Link>

        {session ? (
          <>
            <Link to={userRole === 'admin' ? "/admin" : "/dashboard"} className={mobile ? "w-full" : ""}>
              <Button variant="ghost" className={`text-base text-primary font-medium ${btnClass}`}>
                {userRole === 'admin' ? <><Shield className="w-4 h-4 mr-2" /> Admin Portal</> : <><LayoutDashboard className="w-4 h-4 mr-2" /> Dashboard</>}
              </Button>
            </Link>

            {mobile ? (
              <Button variant="outline" onClick={handleSignOut} className={`mt-4 ${btnClass}`}><LogOut className="w-4 h-4 mr-2" /> Sign Out</Button>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10 border border-border">
                      <AvatarImage src="" />
                      <AvatarFallback className="bg-primary/10 text-primary font-bold">{userRole ? userRole.charAt(0).toUpperCase() : <User className="w-4 h-4"/>}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal"><p className="text-sm font-medium capitalize">{userRole}</p><p className="text-xs text-muted-foreground">{session.user.email}</p></DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate(userRole === 'admin' ? '/admin' : '/dashboard')}><LayoutDashboard className="mr-2 h-4 w-4" /><span>Dashboard</span></DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-red-600"><LogOut className="mr-2 h-4 w-4" /><span>Log out</span></DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </>
        ) : (
          <>
            <Link to="/employer/auth"><Button variant="outline" className={btnClass}>For Employer</Button></Link>
            <Link to="/candidate/auth"><Button variant="outline" className={btnClass}>For Candidate</Button></Link>
            <Link to="/candidate/auth"><Button className={`bg-gradient-to-r from-primary to-accent text-white ${btnClass}`}>Get Started</Button></Link>
          </>
        )}
      </div>
    );
  };

  return (
    <nav className="border-b border-border/40 bg-background/95 sticky top-0 z-50 backdrop-blur-md shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2"><img src="/assets/opentoowork-icon1-BZ2bbVrF.png" alt="Logo" className="h-10 w-10" /><span className="text-lg md:text-xl font-bold text-primary">OPENTOOWORK</span></Link>
          <div className="hidden md:block"><NavLinks /></div>
          <div className="md:hidden"><Sheet><SheetTrigger asChild><Button variant="ghost" size="icon"><Menu className="h-6 w-6" /></Button></SheetTrigger><SheetContent side="right" className="w-[300px]"><div className="flex flex-col gap-6 pt-10"><NavLinks mobile /></div></SheetContent></Sheet></div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;