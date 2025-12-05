import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import JobCard from "@/components/JobCard";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Search, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

const FindJobs = () => {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState("");

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("jobs")
        .select(`
          *,
          employer:employer_profiles(company_name, location)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching jobs:", error);
      } else {
        setJobs(data || []);
      }
    } catch (error) {
      console.error("Unexpected fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredJobs = jobs.filter((job) => {
    const term = searchTerm.toLowerCase();
    const loc = locationFilter.toLowerCase();

    const matchesSearch =
      !term ||
      (job.title || "").toLowerCase().includes(term) ||
      (job.description || "").toLowerCase().includes(term) ||
      (job.employer?.company_name || "").toLowerCase().includes(term);

    const matchesLocation =
      !loc || 
      (job.location || "").toLowerCase().includes(loc);

    return matchesSearch && matchesLocation;
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <div className="container mx-auto px-6 py-12 flex-grow">
        <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-bold mb-2">Find Jobs</h1>
            <p className="text-muted-foreground">Discover your next career move</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Job title, keyword, or company"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-background"
              />
            </div>
            <div className="relative w-full sm:w-64">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Location"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="pl-9 bg-background"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="text-lg text-muted-foreground">Loading opportunities...</p>
            </div>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="text-center py-20 bg-muted/30 rounded-xl border border-border/50">
            <p className="text-lg text-muted-foreground">No jobs found matching your search.</p>
            <Button 
              variant="link" 
              onClick={() => { setSearchTerm(""); setLocationFilter(""); }}
              className="mt-2"
            >
              Clear filters
            </Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
            {filteredJobs.map((job) => (
              <JobCard
                key={job.id}
                id={job.id}
                title={job.title}
                company={job.employer?.company_name || "Confidential"}
                location={job.location}
                salaryMin={job.salary_min}
                salaryMax={job.salary_max}
                jobType={job.job_type}
                workAuthorization={job.work_authorization}
                skills={job.skills_required}
              />
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default FindJobs;