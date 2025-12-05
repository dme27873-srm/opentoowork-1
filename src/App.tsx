import { HashRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";

import Index from "./pages/Index";
import About from "./pages/About";
import CandidateAuth from "./pages/CandidateAuth";
import EmployerAuth from "./pages/EmployerAuth";
import Dashboard from "./pages/Dashboard";
import JobDetail from "./pages/JobDetail";
import NotFound from "./pages/NotFound";
import FindJobs from "./pages/FindJobs";
import AdminDashboard from "./pages/AdminDashboard";
import AdminAuth from "./pages/AdminAuth"; // <--- Import

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <HashRouter>
          <Toaster />
          <Sonner />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/jobs" element={<FindJobs />} />
            <Route path="/about" element={<About />} />
            
            {/* Auth Routes */}
            <Route path="/candidate/auth" element={<CandidateAuth />} />
            <Route path="/employer/auth" element={<EmployerAuth />} />
            <Route path="/admin/auth" element={<AdminAuth />} /> {/* <--- New Route */}

            {/* App Routes */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/jobs/:id" element={<JobDetail />} />
            <Route path="/admin" element={<AdminDashboard />} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </HashRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;