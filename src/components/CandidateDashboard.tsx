import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, CheckCircle, Clock, XCircle, MapPin, Building2, Calendar, Briefcase, Pencil } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const WORK_AUTH_OPTIONS = [
  "H1B", "CPT-EAD", "OPT-EAD", "GC", "GC-EAD", "USC", "TN"
];

const CandidateDashboard = () => {
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editExperience, setEditExperience] = useState("");
  const [editWorkAuth, setEditWorkAuth] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    fetchProfile();
    fetchApplications();
  }, []);

  const fetchProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data } = await supabase
      .from("candidate_profiles")
      .select("*, profiles(*)")
      .eq("user_id", session.user.id)
      .single();

    if (data) {
      setProfile(data);
      setEditExperience(data.experience_years?.toString() || "");
      setEditWorkAuth(data.work_authorization || "");
    }
  };

  const fetchApplications = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data: candidateProfile } = await supabase
      .from("candidate_profiles")
      .select("id")
      .eq("user_id", session.user.id)
      .single();

    if (candidateProfile) {
      const { data } = await supabase
        .from("applications")
        .select(`
          *,
          jobs(
            *,
            employer:employer_profiles(company_name)
          )
        `)
        .eq("candidate_id", candidateProfile.id)
        .order("applied_at", { ascending: false });

      setApplications(data || []);
    }
  };

  const handleUpdateProfile = async () => {
    setSavingProfile(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("candidate_profiles")
        .update({
          experience_years: editExperience ? parseInt(editExperience) : null,
          work_authorization: editWorkAuth
        })
        .eq("user_id", session.user.id);

      if (error) throw error;

      toast({ title: "Profile updated successfully!" });
      setIsEditing(false);
      fetchProfile();
    } catch (error: any) {
      toast({
        title: "Error updating profile",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleResumeUpload = async () => {
    if (!resumeFile || !profile) return;

    setUploading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const fileExt = resumeFile.name.split('.').pop();
      const filePath = `${session.user.id}/resume.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("resumes")
        .upload(filePath, resumeFile, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("resumes")
        .getPublicUrl(filePath);

      const resumeUrlWithTimestamp = `${publicUrl}?t=${new Date().getTime()}`;

      const { error: updateError } = await supabase
        .from("candidate_profiles")
        .update({ resume_url: resumeUrlWithTimestamp })
        .eq("user_id", session.user.id);

      if (updateError) throw updateError;

      toast({
        title: "Resume uploaded successfully!",
        description: "Your profile has been updated."
      });
      setResumeFile(null);
      fetchProfile();
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "accepted":
        return <Badge className="bg-green-600 hover:bg-green-700 gap-1 pl-1.5"><CheckCircle className="w-3.5 h-3.5" /> Accepted</Badge>;
      case "rejected":
        return <Badge variant="destructive" className="gap-1 pl-1.5"><XCircle className="w-3.5 h-3.5" /> Rejected</Badge>;
      default:
        return <Badge variant="secondary" className="gap-1 pl-1.5 bg-muted-foreground/10 text-muted-foreground border-transparent"><Clock className="w-3.5 h-3.5" /> Pending</Badge>;
    }
  };

  if (!profile) return <div className="min-h-[50vh] flex items-center justify-center text-muted-foreground">Loading profile...</div>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Candidate Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back, {profile.profiles.full_name}</p>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Profile Card */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="p-6 border shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">My Profile</h2>
              
              <Dialog open={isEditing} onOpenChange={setIsEditing}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted">
                    <Pencil className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit Profile</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Work Authorization</Label>
                      <Select value={editWorkAuth} onValueChange={setEditWorkAuth}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          {WORK_AUTH_OPTIONS.map((auth) => (
                            <SelectItem key={auth} value={auth}>{auth}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Experience (Years)</Label>
                      <Input 
                        type="number" 
                        min="0"
                        value={editExperience} 
                        onChange={(e) => setEditExperience(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                    <Button onClick={handleUpdateProfile} disabled={savingProfile}>
                      {savingProfile ? "Saving..." : "Save Changes"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            
            <div className="space-y-5">
              <div>
                <Label className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Contact</Label>
                <div className="mt-1 font-medium">{profile.profiles.email}</div>
                {profile.profiles.phone && <div className="text-sm text-muted-foreground">{profile.profiles.phone}</div>}
              </div>

              <div>
                <Label className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Details</Label>
                <div className="mt-2 flex flex-col gap-2 bg-muted/30 p-3 rounded-md">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Work Auth:</span>
                    <Badge variant="outline" className="bg-background text-xs font-normal">{profile.work_authorization}</Badge>
                  </div>
                  <div className="flex justify-between text-sm items-center">
                    <span className="text-muted-foreground">Experience:</span>
                    <span className="font-medium">{profile.experience_years || 0} Years</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <Label className="text-sm font-semibold mb-3 block">Resume</Label>
                {profile.resume_url ? (
                  <div className="flex items-center gap-2 mb-4 bg-primary/5 p-3 rounded-lg border border-primary/10 transition-colors hover:bg-primary/10">
                    <FileText className="h-5 w-5 text-primary" />
                    <a 
                      href={profile.resume_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-primary hover:underline truncate flex-1"
                    >
                      View Current Resume
                    </a>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                ) : (
                  <div className="text-sm text-yellow-700 bg-yellow-50 p-3 rounded-lg mb-4 border border-yellow-200 flex gap-2 items-start">
                    <Clock className="w-4 h-4 mt-0.5 shrink-0" />
                    Please upload a resume to apply for jobs.
                  </div>
                )}
                
                <div className="space-y-2">
                  <Input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                    className="text-sm file:text-primary file:font-semibold cursor-pointer"
                  />
                  <Button 
                    onClick={handleResumeUpload} 
                    disabled={!resumeFile || uploading}
                    className="w-full"
                    variant={resumeFile ? "default" : "secondary"}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {uploading ? "Uploading..." : "Update Resume"}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Applications List */}
        <div className="lg:col-span-8">
          <Card className="p-6 border shadow-sm min-h-[500px]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Application History</h2>
              <Badge variant="outline" className="text-sm font-normal">
                {applications.length} Applications
              </Badge>
            </div>

            {applications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mb-4">
                  <Briefcase className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <h3 className="text-lg font-medium">No applications yet</h3>
                <p className="text-muted-foreground max-w-xs mt-2 mb-6">
                  Start searching for jobs that match your skills and apply today!
                </p>
                <Button onClick={() => window.location.href = "/jobs"} className="bg-gradient-to-r from-primary to-accent shadow-md">
                  Browse Open Roles
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {applications.map((app) => (
                  <Card key={app.id} className="p-5 border hover:border-primary/30 transition-all hover:shadow-md group">
                    <div className="flex flex-col md:flex-row gap-4 justify-between">
                      <div className="space-y-3 flex-1">
                        <div className="flex items-center justify-between md:justify-start gap-3">
                          <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">
                            {app.jobs?.title}
                          </h3>
                          <div className="md:hidden">
                            {getStatusBadge(app.status)}
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                          <span className="flex items-center">
                            <Building2 className="w-4 h-4 mr-1.5 opacity-70" />
                            {app.jobs?.employer?.company_name}
                          </span>
                          <span className="flex items-center">
                            <MapPin className="w-4 h-4 mr-1.5 opacity-70" />
                            {app.jobs?.location}
                          </span>
                          <span className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1.5 opacity-70" />
                            Applied: {new Date(app.applied_at).toLocaleDateString()}
                          </span>
                        </div>

                        {app.cover_letter && (
                          <div className="mt-3 pt-3 border-t border-dashed">
                            <p className="text-[10px] font-bold text-muted-foreground mb-1 uppercase tracking-wider">Your Note</p>
                            <p className="text-sm text-foreground/80 line-clamp-2 hover:line-clamp-none transition-all cursor-default leading-relaxed bg-muted/20 p-2 rounded-md">
                              "{app.cover_letter}"
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="hidden md:flex flex-col items-end justify-start pl-4 border-l min-w-[120px]">
                        <span className="text-xs font-medium text-muted-foreground mb-1.5">Status</span>
                        {getStatusBadge(app.status)}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CandidateDashboard;