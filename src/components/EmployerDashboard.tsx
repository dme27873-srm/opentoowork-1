import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Briefcase, Users, Eye, MapPin, AlertCircle, Globe, Trash2, Check, X, FileText } from "lucide-react";
import { Badge } from "./ui/badge";

const EmployerDashboard = () => {
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  // Job Form States
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [jobType, setJobType] = useState("Full-time");
  const [skills, setSkills] = useState("");

  useEffect(() => {
    fetchProfileAndJobs();
  }, []);

  const fetchProfileAndJobs = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: employerProfile } = await supabase
        .from("employer_profiles")
        .select("*, profiles(*)")
        .eq("user_id", session.user.id)
        .single();

      if (employerProfile) {
        setProfile(employerProfile);
        const { data: jobsData } = await supabase
          .from("jobs")
          .select("*")
          .eq("employer_id", employerProfile.id)
          .order("created_at", { ascending: false });

        setJobs(jobsData || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = async (jobId: string) => {
    const { data } = await supabase
      .from("applications")
      .select(`*, candidate:candidate_profiles(*, profiles(*))`)
      .eq("job_id", jobId)
      .order('applied_at', { ascending: false });

    setApplications(data || []);
  };

  const handleUpdateStatus = async (applicationId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("applications")
        .update({ status: newStatus })
        .eq("id", applicationId);

      if (error) throw error;

      toast({ title: `Application ${newStatus}!` });
      setApplications(prev => prev.map(app => app.id === applicationId ? { ...app, status: newStatus } : app));
    } catch (error: any) {
      toast({ title: "Error updating status", description: error.message, variant: "destructive" });
    }
  };

  const handlePostJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setPosting(true);

    try {
      const minSal = salaryMin ? parseInt(salaryMin.toString()) : null;
      const maxSal = salaryMax ? parseInt(salaryMax.toString()) : null;

      const { error } = await supabase.from("jobs").insert({
        employer_id: profile.id,
        title,
        description,
        location,
        salary_min: minSal,
        salary_max: maxSal,
        job_type: jobType,
        skills_required: skills.split(',').map(s => s.trim()).filter(Boolean),
        is_active: true
      });

      if (error) throw error;

      toast({ title: "Success!", description: "Job posted." });
      setIsDialogOpen(false);
      fetchProfileAndJobs();
      setTitle(""); setDescription(""); setLocation(""); setSalaryMin(""); setSalaryMax(""); setSkills("");
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setPosting(false);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    const { error } = await supabase.from("jobs").delete().eq("id", jobId);
    if (error) toast({ title: "Error", description: "Could not delete job.", variant: "destructive" });
    else {
      toast({ title: "Job deleted" });
      fetchProfileAndJobs();
    }
  };

  const handleViewApplications = (job: any) => {
    setSelectedJob(job);
    fetchApplications(job.id);
  };

  if (loading) return <div className="p-8 text-center animate-pulse">Loading dashboard...</div>;
  if (!profile) return <div className="p-8 text-center text-red-500">Employer profile not found.</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
            <h1 className="text-3xl font-bold">Employer Dashboard</h1>
            <p className="text-muted-foreground flex items-center gap-2">{profile.company_name}</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild><Button className="bg-primary hover:bg-primary/90"><Plus className="mr-2 h-4 w-4" /> Post New Job</Button></DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Post a New Job</DialogTitle></DialogHeader>
            <form onSubmit={handlePostJob} className="space-y-4 py-4">
              <div className="grid gap-2"><Label>Job Title *</Label><Input required value={title} onChange={(e) => setTitle(e.target.value)} /></div>
              <div className="grid gap-2"><Label>Description *</Label><Textarea required rows={5} value={description} onChange={(e) => setDescription(e.target.value)} /></div>
              <div className="grid md:grid-cols-2 gap-4">
                <div><Label>Location *</Label><Input required value={location} onChange={(e) => setLocation(e.target.value)} /></div>
                <div><Label>Job Type</Label>
                    <Select value={jobType} onValueChange={setJobType}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="Full-time">Full-time</SelectItem><SelectItem value="Part-time">Part-time</SelectItem><SelectItem value="Contract">Contract</SelectItem><SelectItem value="Internship">Internship</SelectItem></SelectContent>
                    </Select>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div><Label>Min Salary</Label><Input type="number" value={salaryMin} onChange={(e) => setSalaryMin(e.target.value)} /></div>
                <div><Label>Max Salary</Label><Input type="number" value={salaryMax} onChange={(e) => setSalaryMax(e.target.value)} /></div>
              </div>
              <div><Label>Skills</Label><Input value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="React, Node.js" /></div>
              <Button type="submit" className="w-full" disabled={posting}>{posting ? "Posting..." : "Post Job"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-6">Your Jobs <Badge variant="secondary">{jobs.length}</Badge></h2>
        {jobs.length === 0 ? <p className="text-center text-muted-foreground py-8">No jobs posted yet.</p> : (
          <div className="grid gap-4">
            {jobs.map(job => (
              <div key={job.id} className="p-4 border rounded-lg flex flex-col md:flex-row justify-between gap-4 bg-card hover:shadow-sm">
                <div>
                  <h3 className="font-semibold text-lg">{job.title}</h3>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                    <span><MapPin className="inline w-3 h-3 mr-1" />{job.location}</span>
                    <span>{job.job_type}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleViewApplications(job)}><Users className="h-4 w-4 mr-2" /> Applicants</Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader><AlertDialogTitle>Delete Job?</AlertDialogTitle><AlertDialogDescription>This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                      <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteJob(job.id)} className="bg-destructive">Delete</AlertDialogAction></AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Dialog open={!!selectedJob} onOpenChange={() => setSelectedJob(null)}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Applicants for {selectedJob?.title}</DialogTitle></DialogHeader>
          {applications.length === 0 ? <p className="text-center py-8 text-muted-foreground">No applicants yet.</p> : (
            <div className="space-y-4 mt-4">
              {applications.map(app => (
                <Card key={app.id} className={`p-6 border-l-4 ${app.status === 'accepted' ? 'border-l-green-500' : app.status === 'rejected' ? 'border-l-red-500' : 'border-l-yellow-500'}`}>
                  <div className="flex flex-col md:flex-row justify-between gap-6">
                    <div className="flex-1 space-y-2">
                        <div className="flex justify-between"><h4 className="font-bold text-lg">{app.candidate?.profiles?.full_name}</h4><Badge>{app.status}</Badge></div>
                        <p className="text-sm text-muted-foreground">{app.candidate?.profiles?.email}</p>
                        {app.cover_letter && <div className="bg-muted p-3 rounded-md text-sm mt-2"><p className="font-semibold text-xs uppercase mb-1">Cover Letter</p>{app.cover_letter}</div>}
                    </div>
                    <div className="flex flex-col gap-2 min-w-[140px]">
                        {app.candidate?.resume_url ? (
                            <Button variant="outline" className="w-full" asChild><a href={app.candidate.resume_url} target="_blank" rel="noreferrer"><FileText className="w-4 h-4 mr-2" /> Resume</a></Button>
                        ) : <Button variant="outline" disabled className="w-full">No Resume</Button>}
                        <div className="flex gap-2">
                            <Button onClick={() => handleUpdateStatus(app.id, 'accepted')} disabled={app.status === 'accepted'} className="flex-1 bg-green-600 hover:bg-green-700 text-white"><Check className="w-4 h-4" /></Button>
                            <Button onClick={() => handleUpdateStatus(app.id, 'rejected')} disabled={app.status === 'rejected'} variant="destructive" className="flex-1"><X className="w-4 h-4" /></Button>
                        </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmployerDashboard;