import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, CheckCircle, Clock, XCircle, AlertTriangle } from "lucide-react";

const CandidateDashboard = () => {
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data } = await supabase
        .from("candidate_profiles")
        .select("*, profiles(*)")
        .eq("user_id", session.user.id)
        .single();

      if (data) {
        setProfile(data);
        fetchApplications(data.id);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = async (candidateId: string) => {
    const { data } = await supabase
      .from("applications")
      .select(`*, jobs(*, employer:employer_profiles(company_name))`)
      .eq("candidate_id", candidateId)
      .order("applied_at", { ascending: false });

    setApplications(data || []);
  };

  const handleResumeUpload = async () => {
    if (!resumeFile || !profile) return;
    setUploading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const fileExt = resumeFile.name.split('.').pop();
      const fileName = `resume_${Date.now()}.${fileExt}`; // Unique name
      const filePath = `${session.user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage.from("resumes").upload(filePath, resumeFile);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from("resumes").getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from("candidate_profiles")
        .update({ resume_url: publicUrl })
        .eq("user_id", session.user.id);

      if (updateError) throw updateError;

      toast({ title: "Resume uploaded successfully!" });
      await fetchProfile(); // Refresh
      setResumeFile(null);
    } catch (error: any) {
      toast({ title: "Upload Failed", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "accepted": return <CheckCircle className="h-5 w-5 text-success" />;
      case "rejected": return <XCircle className="h-5 w-5 text-destructive" />;
      default: return <Clock className="h-5 w-5 text-muted-foreground" />;
    }
  };

  if (loading) return <div className="p-8 text-center animate-pulse">Loading...</div>;
  if (!profile) return <div className="p-8 text-center">Profile not found.</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Candidate Dashboard</h1>
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Your Profile</h2>
            <div className="space-y-4">
              <div><Label className="text-xs uppercase text-muted-foreground">Name</Label><p className="font-medium">{profile.profiles?.full_name}</p></div>
              <div><Label className="text-xs uppercase text-muted-foreground">Email</Label><p className="font-medium">{profile.profiles?.email}</p></div>
              <div className="pt-4 border-t">
                <Label className="block mb-2 font-medium">Resume</Label>
                {profile.resume_url ? (
                  <div className="flex items-center gap-2 mb-4 p-3 bg-muted rounded-md">
                    <FileText className="h-5 w-5 text-primary" />
                    <a href={profile.resume_url} target="_blank" rel="noreferrer" className="text-primary hover:underline text-sm truncate">View Resume</a>
                  </div>
                ) : <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-700 mb-3 text-sm"><AlertTriangle className="inline h-4 w-4 mr-1" /> No resume uploaded.</div>}
                <div className="space-y-2">
                  <Input type="file" accept=".pdf,.doc,.docx" onChange={(e) => setResumeFile(e.target.files?.[0] || null)} />
                  <Button onClick={handleResumeUpload} disabled={!resumeFile || uploading} className="w-full">{uploading ? "Uploading..." : "Upload Resume"}</Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
        <div className="lg:col-span-2">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-6">Applications <Badge className="ml-2">{applications.length}</Badge></h2>
            {applications.length === 0 ? <p className="text-center text-muted-foreground py-8">No applications yet.</p> : (
              <div className="space-y-4">
                {applications.map((app) => (
                  <div key={app.id} className="p-4 border rounded-lg flex justify-between items-center bg-card hover:shadow-sm">
                    <div>
                        <h3 className="font-bold text-lg text-primary">{app.jobs?.title}</h3>
                        <p className="text-sm text-muted-foreground">{app.jobs?.employer?.company_name}</p>
                    </div>
                    <div className="flex items-center gap-2">{getStatusIcon(app.status)}<span className="capitalize font-medium text-sm">{app.status}</span></div>
                  </div>
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