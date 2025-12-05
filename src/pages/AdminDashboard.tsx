import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Save, RefreshCw, ShieldAlert, CheckCircle, XCircle, Search, Filter, Building2, Pencil } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // local auth state (replacing AuthContext)
  const [session, setSession] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Data States
  const [users, setUsers] = useState<any[]>([]);
  const [employers, setEmployers] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [content, setContent] = useState<any>({
    hero_title: "",
    hero_description: "",
    mission_title: "",
    mission_body: "",
    contact_email: "",
    contact_phone: "",
    contact_address: ""
  });

  // Edit States
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editingEmployer, setEditingEmployer] = useState<any>(null);
  const [editingJob, setEditingJob] = useState<any>(null);
  
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [isEmployerDialogOpen, setIsEmployerDialogOpen] = useState(false);
  const [isJobDialogOpen, setIsJobDialogOpen] = useState(false);

  // Filter States
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("all");
  const [jobSearch, setJobSearch] = useState("");
  const [jobStatusFilter, setJobStatusFilter] = useState("all");

  useEffect(() => {
    let mounted = true;

    const safetyTimer = setTimeout(() => {
      if (mounted && authLoading) setAuthLoading(false);
    }, 5000);

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!mounted) return;
        setSession(session);

        if (session) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", session.user.id)
            .single();
          if (profile?.role) setUserRole(profile.role);
        }
      } catch (e) {
        console.error("Auth init error:", e);
      } finally {
        if (mounted) setAuthLoading(false);
        clearTimeout(safetyTimer);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setSession(session);
      if (session) {
        (async () => {
          try {
            const { data: profile } = await supabase
              .from("profiles")
              .select("role")
              .eq("id", session.user.id)
              .single();

            if (profile?.role) setUserRole(profile.role);
          } catch (e) {
            console.error(e);
          }
        })();
      } else {
        setUserRole(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearTimeout(safetyTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // After auth resolves, enforce admin access
    if (authLoading) return;

    if (!session) {
      navigate("/admin/auth");
      return;
    }

    if (userRole !== "admin") {
      toast({ title: "Access Denied", description: "You do not have permission to view this page.", variant: "destructive" });
      navigate("/");
      return;
    }

    setIsAdmin(true);
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, session, userRole]);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchUsers(), fetchEmployers(), fetchJobs(), fetchContent()]);
    setLoading(false);
  };

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setUsers(data);
  };

  const fetchEmployers = async () => {
    const { data, error } = await supabase
      .from("employer_profiles")
      .select("*, profiles(email, full_name)")
      .order("created_at", { ascending: false });
    if (data) setEmployers(data);
  };

  const fetchJobs = async () => {
    const { data, error } = await supabase
      .from("jobs")
      .select("*, employer:employer_profiles(company_name)")
      .order("created_at", { ascending: false });
    if (data) setJobs(data);
  };

  const fetchContent = async () => {
    const { data } = await supabase
      .from("site_content")
      .select("content")
      .eq("section_key", "about_page")
      .single();
    if (data?.content) setContent(data.content);
  };

  // --- ACTIONS ---

  const handleSaveUser = async () => {
    if (!editingUser) return;
    const { error } = await supabase.from("profiles").update({
      full_name: editingUser.full_name,
      role: editingUser.role
    }).eq("id", editingUser.id);

    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      toast({ title: "User updated" });
      setIsUserDialogOpen(false);
      fetchUsers();
    }
  };

  const handleSaveEmployer = async () => {
    if (!editingEmployer) return;
    const { error } = await supabase.from("employer_profiles").update({
      company_name: editingEmployer.company_name,
      location: editingEmployer.location,
      company_website: editingEmployer.company_website,
      company_size: editingEmployer.company_size,
      description: editingEmployer.description
    }).eq("id", editingEmployer.id);

    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Employer updated" });
      setIsEmployerDialogOpen(false);
      fetchEmployers();
    }
  };

  const handleSaveJob = async () => {
    if (!editingJob) return;
    const { error } = await supabase.from("jobs").update({
      title: editingJob.title,
      location: editingJob.location,
      salary_min: editingJob.salary_min,
      salary_max: editingJob.salary_max,
      job_type: editingJob.job_type,
      description: editingJob.description,
      is_active: editingJob.is_active
    }).eq("id", editingJob.id);

    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Job updated" });
      setIsJobDialogOpen(false);
      fetchJobs();
    }
  };

  const handleDeleteUser = async (id: string) => {
    const { error } = await supabase.from("profiles").delete().eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      toast({ title: "User deleted" });
      fetchUsers();
    }
  };

  const handleDeleteJob = async (id: string) => {
    const { error } = await supabase.from("jobs").delete().eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Job deleted" });
      fetchJobs();
    }
  };

  const handleUpdateContent = async () => {
    const { error } = await supabase
      .from("site_content")
      .upsert({ 
        section_key: "about_page", 
        content: content,
        updated_at: new Date().toISOString()
      }, { onConflict: 'section_key' });

    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else toast({ title: "Content updated" });
  };

  // --- FILTERING ---

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      (user.full_name?.toLowerCase() || "").includes(userSearch.toLowerCase()) ||
      (user.email?.toLowerCase() || "").includes(userSearch.toLowerCase());
    const matchesRole = userRoleFilter === "all" || user.role === userRoleFilter;
    return matchesSearch && matchesRole;
  });

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = 
      (job.title?.toLowerCase() || "").includes(jobSearch.toLowerCase()) ||
      (job.employer?.company_name?.toLowerCase() || "").includes(jobSearch.toLowerCase());
    const matchesStatus = 
      jobStatusFilter === "all" || 
      (jobStatusFilter === "active" ? job.is_active : !job.is_active);
    return matchesSearch && matchesStatus;
  });

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />
      
      <div className="container mx-auto py-8 px-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2 text-slate-800 dark:text-slate-100">
              <ShieldAlert className="h-8 w-8 text-primary" />
              Admin Portal
            </h1>
            <p className="text-muted-foreground">Manage users, employers, jobs, and site content.</p>
          </div>
          <Button onClick={fetchData} variant="outline" size="sm" className="gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-[500px]">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="employers">Employers</TabsTrigger>
            <TabsTrigger value="jobs">Jobs</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
          </TabsList>

          {/* USERS TAB */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Directory</CardTitle>
                <div className="flex gap-4 pt-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search users..." className="pl-9" value={userSearch} onChange={(e) => setUserSearch(e.target.value)} />
                  </div>
                  <Select value={userRoleFilter} onValueChange={setUserRoleFilter}>
                    <SelectTrigger className="w-[180px]"><SelectValue placeholder="Role" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="candidate">Candidate</SelectItem>
                      <SelectItem value="employer">Employer</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.full_name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell><Badge variant="outline">{user.role}</Badge></TableCell>
                        <TableCell className="text-right flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => { setEditingUser(user); setIsUserDialogOpen(true); }}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteUser(user.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* EMPLOYERS TAB */}
          <TabsContent value="employers">
            <Card>
              <CardHeader><CardTitle>Employer Profiles</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company</TableHead>
                      <TableHead>Contact Person</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Website</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employers.map((emp) => (
                      <TableRow key={emp.id}>
                        <TableCell className="font-medium flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          {emp.company_name}
                        </TableCell>
                        <TableCell>{emp.profiles?.full_name} <br/><span className="text-xs text-muted-foreground">{emp.profiles?.email}</span></TableCell>
                        <TableCell>{emp.location}</TableCell>
                        <TableCell>{emp.company_website || "-"}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => { setEditingEmployer(emp); setIsEmployerDialogOpen(true); }}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* JOBS TAB */}
          <TabsContent value="jobs">
            <Card>
              <CardHeader>
                <CardTitle>Job Postings</CardTitle>
                <div className="flex gap-4 pt-4">
                  <Input placeholder="Search jobs..." value={jobSearch} onChange={(e) => setJobSearch(e.target.value)} />
                  <Select value={jobStatusFilter} onValueChange={setJobStatusFilter}>
                    <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredJobs.map((job) => (
                      <TableRow key={job.id}>
                        <TableCell className="font-medium">{job.title}</TableCell>
                        <TableCell>{job.employer?.company_name}</TableCell>
                        <TableCell>
                          {job.is_active ? <Badge className="bg-green-600">Active</Badge> : <Badge variant="secondary">Inactive</Badge>}
                        </TableCell>
                        <TableCell className="text-right flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => { setEditingJob(job); setIsJobDialogOpen(true); }}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteJob(job.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* CONTENT TAB */}
          <TabsContent value="content">
            <div className="grid gap-6">
              <Card>
                <CardHeader><CardTitle>About Page Content</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div><Label>Hero Title</Label><Input value={content.hero_title || ""} onChange={(e) => setContent({...content, hero_title: e.target.value})} /></div>
                  <div><Label>Hero Description</Label><Textarea value={content.hero_description || ""} onChange={(e) => setContent({...content, hero_description: e.target.value})} /></div>
                  <div><Label>Mission Body</Label><Textarea rows={4} value={content.mission_body || ""} onChange={(e) => setContent({...content, mission_body: e.target.value})} /></div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Contact & Support</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div><Label>Support Email</Label><Input value={content.contact_email || ""} onChange={(e) => setContent({...content, contact_email: e.target.value})} placeholder="support@opentoowork.com" /></div>
                    <div><Label>Support Phone</Label><Input value={content.contact_phone || ""} onChange={(e) => setContent({...content, contact_phone: e.target.value})} placeholder="+1 (555) 000-0000" /></div>
                  </div>
                  <div><Label>Address</Label><Input value={content.contact_address || ""} onChange={(e) => setContent({...content, contact_address: e.target.value})} placeholder="123 Job Street, NY" /></div>
                  <Button onClick={handleUpdateContent} className="w-full mt-4"><Save className="mr-2 h-4 w-4" /> Save All Content</Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* DIALOGS */}
        {/* User Edit Dialog */}
        <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Edit User</DialogTitle></DialogHeader>
            {editingUser && (
              <div className="grid gap-4 py-4">
                <div className="grid gap-2"><Label>Full Name</Label><Input value={editingUser.full_name} onChange={(e) => setEditingUser({...editingUser, full_name: e.target.value})} /></div>
                <div className="grid gap-2"><Label>Role</Label>
                  <Select value={editingUser.role} onValueChange={(val) => setEditingUser({...editingUser, role: val})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="candidate">Candidate</SelectItem><SelectItem value="employer">Employer</SelectItem><SelectItem value="admin">Admin</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>
            )}
            <DialogFooter><Button onClick={handleSaveUser}>Save Changes</Button></DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Employer Edit Dialog */}
        <Dialog open={isEmployerDialogOpen} onOpenChange={setIsEmployerDialogOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Edit Employer Profile</DialogTitle></DialogHeader>
            {editingEmployer && (
              <div className="grid gap-4 py-4">
                <div className="grid gap-2"><Label>Company Name</Label><Input value={editingEmployer.company_name} onChange={(e) => setEditingEmployer({...editingEmployer, company_name: e.target.value})} /></div>
                <div className="grid gap-2"><Label>Location</Label><Input value={editingEmployer.location} onChange={(e) => setEditingEmployer({...editingEmployer, location: e.target.value})} /></div>
                <div className="grid gap-2"><Label>Website</Label><Input value={editingEmployer.company_website || ''} onChange={(e) => setEditingEmployer({...editingEmployer, company_website: e.target.value})} /></div>
              </div>
            )}
            <DialogFooter><Button onClick={handleSaveEmployer}>Save Changes</Button></DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Job Edit Dialog */}
        <Dialog open={isJobDialogOpen} onOpenChange={setIsJobDialogOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Edit Job</DialogTitle></DialogHeader>
            {editingJob && (
              <div className="grid gap-4 py-4">
                <div className="grid gap-2"><Label>Title</Label><Input value={editingJob.title} onChange={(e) => setEditingJob({...editingJob, title: e.target.value})} /></div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>Min Salary</Label><Input type="number" value={editingJob.salary_min || ''} onChange={(e) => setEditingJob({...editingJob, salary_min: e.target.value})} /></div>
                  <div><Label>Max Salary</Label><Input type="number" value={editingJob.salary_max || ''} onChange={(e) => setEditingJob({...editingJob, salary_max: e.target.value})} /></div>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Label>Is Active?</Label>
                  <input type="checkbox" checked={editingJob.is_active} onChange={(e) => setEditingJob({...editingJob, is_active: e.target.checked})} className="h-4 w-4" />
                </div>
              </div>
            )}
            <DialogFooter><Button onClick={handleSaveJob}>Save Changes</Button></DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
};

export default AdminDashboard;