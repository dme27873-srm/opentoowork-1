import { Link } from "react-router-dom";
import { Button } from "./ui/button";

const Navbar = () => {
  return (
    <nav className="border-b border-border/40 bg-background/95 sticky top-0 z-50 backdrop-blur-md shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <img
              src="/src/assets/opentoowork-icon1.png"
              alt="Opentoowork Logo"
              className="h-14 w-14 object-contain"
            />
            <span className="text-xl font-bold text-primary tracking-wide">
              OPENTOOWORK
            </span>
          </Link>

          {/* ALL NAV BUTTONS */}
          <div className="flex items-center gap-6">

            {/* Find Jobs */}
            <Link to="/jobs">
              <Button variant="ghost" className="text-base">
                Find Jobs
              </Button>
            </Link>


            {/* About */}
            <Link to="/about">
              <Button variant="ghost" className="text-base">
                About
              </Button>
            </Link>

            {/* For Employer */}
            <Link to="/employer/auth">
              <Button variant="outline" className="text-base border-primary">
                For Employer
              </Button>
            </Link>

            {/* Sign In */}
            <Link to="/candidate/auth">
              <Button variant="outline">For Candidate</Button>
            </Link>

            {/* Get Started */}
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
