import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";
import { withTimeout } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Building2, DollarSign, Briefcase, Calendar, Globe, CheckCircle } from "lucide-react";

const JobDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isApplying, setIsApplying] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const [userRole, setUserRole] = useState<string | null>(null);
  const [candidateProfile, setCandidateProfile] = useState<any>(null);

  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    fetchJob();
    checkUser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      setSession(session);

      const profileResp = (await withTimeout(
        supabase.from("profiles").select("role").eq("id", session.user.id).single().then((r) => r),
        6000
      ).catch(() => ({ data: null } as any))) as any;

      const profile = profileResp.data;
      if (profile) {
        setUserRole(profile.role);

        if (profile.role === "candidate") {
          const resp = (await withTimeout(
            supabase.from("candidate_profiles").select("*").eq("user_id", session.user.id).single().then((r) => r),
            6000
          ).catch(() => ({ data: null } as any))) as any;

          const candidateData = resp.data;
          setCandidateProfile(candidateData);

          if (candidateData) {
            const appResp = (await withTimeout(
              supabase
                .from("applications")
                .select("id")
                .eq("job_id", id)
                .eq("candidate_id", candidateData.id)
                .single()
                .then((r) => r),
              6000
            ).catch(() => ({ data: null } as any))) as any;

            const existingApp = appResp.data;
            if (existingApp) setHasApplied(true);
          }
        }
      }
    } catch (error) {
      console.error("checkUser error:", error);
    }
  };

  const fetchJob = async () => {
    setLoading(true);
    try {
      const query = supabase
        .from("jobs")
        .select(`
          *,
          employer:employer_profiles(
            company_name,
            company_website,
            location,
            description
          )
        `)
        .eq("id", id)
        .single();

      const resp = await withTimeout(query.then((r) => r), 8000) as any;
      const { data, error } = resp;
      if (error) {
        toast({ title: "Error", description: "Could not load job details", variant: "destructive" });
      } else {
        setJob(data);
      }
    } catch (error) {
      toast({ title: "Error", description: "Could not load job details (timeout)", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleApplyClick = () => {
    if (!candidateProfile?.resume_url) {
      toast({
        title: "Resume Required",
        description: "Please upload your resume in the Dashboard before applying.",
        variant: "destructive",
      });
      navigate("/dashboard");
      return;
    }
  };

  const handleApplySubmit = async () => {
    setIsApplying(true);
    try {
      const { error } = await supabase.from("applications").insert({
        job_id: job.id,
        candidate_id: candidateProfile.id,
        cover_letter: coverLetter,
      });

      if (error) throw error;

      toast({ title: "Application submitted!", description: "Good luck with your application!" });
      setHasApplied(true);
      setCoverLetter("");
    } catch (error: any) {
      toast({
        title: "Application Failed",
        description: error.message.includes("unique constraint") ? "You have already applied to this job." : error.message,
        variant: "destructive",
      });
    } finally {
      setIsApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-8 text-center animate-pulse"><p>Loading job details...</p></div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-8 text-center"><p>Job not found</p><Button onClick={() => navigate("/jobs")} variant="link">Browse Jobs</Button></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-primary-light/10">
      <Navbar />
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <Card className="p-8 shadow-xl border-border/50">
            <div className="space-y-6">
              <div className="pb-6 border-b border-border/50">
                <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  {job.title}
                </h1>
                <div className="flex flex-wrap gap-4 text-muted-foreground mb-4">
                  <span className="flex items-center gap-2 font-medium text-foreground"><Building2 className="h-5 w-5" />{job.employer?.company_name}</span>
                  <span className="flex items-center gap-2"><MapPin className="h-5 w-5" />{job.location}</span>
                  <span className="flex items-center gap-2"><Briefcase className="h-5 w-5" />{job.job_type}</span>
                  <span className="flex items-center gap-2"><Calendar className="h-5 w-5" />Posted {new Date(job.created_at).toLocaleDateString()}</span>
                  {job.employer?.company_website && <a href={job.employer.company_website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-primary transition-colors"><Globe className="h-5 w-5" />Website</a>}
                </div>
              </div>

              {(job.salary_min || job.salary_max) && (
                <div className="flex items-center gap-3 text-lg font-semibold text-success bg-success/10 rounded-xl p-4">
                  <DollarSign className="h-6 w-6" />
                  ${job.salary_min?.toLocaleString()} - ${job.salary_max?.toLocaleString()} / year
                </div>
              )}

              {job.skills_required && job.skills_required.length > 0 && (
                <div>
                  <Label className="text-base font-semibold mb-2 block">Required Skills</Label>
                  <div className="flex flex-wrap gap-2">
                    {job.skills_required.map((skill: string) => (
                      <Badge key={skill} className="bg-primary/10 text-primary hover:bg-primary/20 border-0">{skill}</Badge>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <Label className="text-base font-semibold mb-2 block">Job Description</Label>
                <div className="text-muted-foreground whitespace-pre-wrap leading-relaxed">{job.description}</div>
              </div>

              {job.employer?.description && (
                <div>
                  <Label className="text-base font-semibold mb-2 block">About {job.employer.company_name}</Label>
                  <p className="text-muted-foreground">{job.employer.description}</p>
                </div>
              )}

              {/* ACTION AREA */}
              <div className="pt-6 border-t border-border/50">
                {userRole === "candidate" ? (
                  hasApplied ? (
                    <Button size="lg" disabled className="w-full bg-green-600/90 text-white cursor-not-allowed">
                      <CheckCircle className="mr-2 h-5 w-5" /> Applied
                    </Button>
                  ) : (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          size="lg" 
                          className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-lg text-lg h-14"
                          onClick={handleApplyClick}
                        >
                          Apply Now
                        </Button>
                      </DialogTrigger>
                      {/* Only render content if resume exists, otherwise handleApplyClick redirects */}
                      {candidateProfile?.resume_url && (
                        <DialogContent>
                          <DialogHeader><DialogTitle>Apply for {job.title}</DialogTitle></DialogHeader>
                          <div className="space-y-4 pt-4">
                            <div className="space-y-2">
                              <Label htmlFor="coverletter">Cover Letter (Optional)</Label>
                              <Textarea
                                id="coverletter"
                                value={coverLetter}
                                onChange={(e) => setCoverLetter(e.target.value)}
                                rows={6}
                                placeholder="Tell the employer why you're a great fit..."
                              />
                            </div>
                            <Button onClick={handleApplySubmit} disabled={isApplying} className="w-full">
                              {isApplying ? "Submitting..." : "Submit Application"}
                            </Button>
                          </div>
                        </DialogContent>
                      )}
                    </Dialog>
                  )
                ) : userRole === "employer" || userRole === "admin" ? (
                  <div className="p-4 bg-muted/50 rounded-lg text-center border border-dashed border-border">
                    <p className="text-muted-foreground">You are viewing this job as an <strong>{userRole}</strong>.</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="mb-4 text-muted-foreground">Sign in as a candidate to apply for this position.</p>
                    <Button size="lg" className="w-full" onClick={() => navigate("/candidate/auth")}>Login to Apply</Button>
                  </div>
                )}
              </div>

            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default JobDetail;