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
import { Trash2, Save, RefreshCw, ShieldAlert, CheckCircle, XCircle, LayoutDashboard, Pencil, Eye, Edit3, Plus } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Data States
  const [users, setUsers] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [employers, setEmployers] = useState<any[]>([]); // To link jobs to employers
  const [aboutContent, setAboutContent] = useState({
    hero_title: "",
    hero_description: "",
    mission_title: "",
    mission_body: ""
  });

  // Edit States
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editingJob, setEditingJob] = useState<any>(null);
  
  // Dialog States
  const [isJobDialogOpen, setIsJobDialogOpen] = useState(false);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/admin/auth");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();

    if (profile?.role !== "admin") {
      toast({ title: "Access Denied", description: "You do not have permission to view this page.", variant: "destructive" });
      navigate("/");
      return;
    }

    setIsAdmin(true);
    fetchData();
  };

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchUsers(), fetchJobs(), fetchContent(), fetchEmployers()]);
    setLoading(false);
  };

  const fetchUsers = async () => {
    const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    if (data) setUsers(data);
  };

  const fetchEmployers = async () => {
    const { data } = await supabase.from("employer_profiles").select("id, company_name");
    if (data) setEmployers(data);
  };

  const fetchJobs = async () => {
    const { data } = await supabase.from("jobs").select("*, employer:employer_profiles(company_name)").order("created_at", { ascending: false });
    if (data) setJobs(data);
  };

  const fetchContent = async () => {
    const { data } = await supabase.from("site_content").select("content").eq("section_key", "about_page").single();
    if (data?.content) {
      // @ts-ignore
      setAboutContent(data.content);
    }
  };

  // --- CONTENT ACTIONS ---

  const handleUpdateContent = async () => {
    const { error } = await supabase
      .from("site_content")
      .upsert({ 
        section_key: "about_page", 
        content: aboutContent,
        updated_at: new Date().toISOString()
      }, { onConflict: 'section_key' });

    if (error) {
      toast({ title: "Error updating content", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Content updated successfully" });
    }
  };

  // --- USER ACTIONS ---

  const handleDeleteUser = async (id: string) => {
    const { error } = await supabase.from("profiles").delete().eq("id", id);
    if (error) {
      toast({ title: "Error deleting user", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "User deleted" });
      fetchUsers();
    }
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;
    const { error } = await supabase.from("profiles").update({
      full_name: editingUser.full_name,
      role: editingUser.role,
      // We do not update email here as it requires auth API interaction which is restricted client-side
    }).eq("id", editingUser.id);

    if (error) {
      toast({ title: "Error updating user", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "User updated successfully" });
      setIsUserDialogOpen(false);
      setEditingUser(null);
      fetchUsers();
    }
  };

  // --- JOB ACTIONS ---

  const handleToggleJobStatus = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase.from("jobs").update({ is_active: !currentStatus }).eq("id", id);
    if (error) {
      toast({ title: "Error updating job", variant: "destructive" });
    } else {
      toast({ title: "Job status updated" });
      fetchJobs();
    }
  };

  const handleDeleteJob = async (id: string) => {
    const { error } = await supabase.from("jobs").delete().eq("id", id);
    if (error) {
      toast({ title: "Error deleting job", variant: "destructive" });
    } else {
      toast({ title: "Job deleted" });
      fetchJobs();
    }
  };

  const handleSaveJob = async () => {
    if (!editingJob) return;

    // Basic validation
    if (!editingJob.title || !editingJob.employer_id) {
        toast({ title: "Validation Error", description: "Title and Employer are required.", variant: "destructive" });
        return;
    }

    const jobData = {
        employer_id: editingJob.employer_id,
        title: editingJob.title,
        location: editingJob.location,
        description: editingJob.description,
        salary_min: editingJob.salary_min || null,
        salary_max: editingJob.salary_max || null,
        job_type: editingJob.job_type,
        is_active: editingJob.is_active !== undefined ? editingJob.is_active : true
    };

    let error;
    if (editingJob.id) {
        // Update
        const { error: updateError } = await supabase.from("jobs").update(jobData).eq("id", editingJob.id);
        error = updateError;
    } else {
       // Create logic (if enabled later)
       // const { error: insertError } = await supabase.from("jobs").insert(jobData);
       // error = insertError;
       return; 
    }

    if (error) {
      toast({ title: "Error saving job", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Job updated successfully" });
      setIsJobDialogOpen(false);
      setEditingJob(null);
      fetchJobs();
    }
  };

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />
      
      <div className="container mx-auto py-8 px-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2 text-slate-800 dark:text-slate-100">
              <ShieldAlert className="h-8 w-8 text-red-600" />
              Admin Portal
            </h1>
            <p className="text-muted-foreground">Manage site content, users, and job listings.</p>
          </div>
          <Button onClick={fetchData} variant="outline" size="sm" className="gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
        </div>

        <Tabs defaultValue="content" className="space-y-6">
          <TabsList className="bg-white dark:bg-slate-900 border p-1 grid grid-cols-3 w-full md:w-[400px]">
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="jobs">Jobs</TabsTrigger>
          </TabsList>

          {/* CONTENT EDITOR TAB - DECLUTTERED */}
          <TabsContent value="content">
            <Card className="border-l-4 border-l-red-500 shadow-sm overflow-hidden">
                <Tabs defaultValue="edit" className="w-full">
                    <div className="bg-slate-100 dark:bg-slate-900 border-b px-4 py-2 flex items-center justify-between">
                        <div className="font-semibold text-slate-700 dark:text-slate-200">About Page Configuration</div>
                        <TabsList className="h-8">
                            <TabsTrigger value="edit" className="text-xs px-3"><Edit3 className="w-3 h-3 mr-1" /> Edit</TabsTrigger>
                            <TabsTrigger value="preview" className="text-xs px-3"><Eye className="w-3 h-3 mr-1" /> Preview</TabsTrigger>
                        </TabsList>
                    </div>
                    
                    <TabsContent value="edit" className="p-0 m-0">
                        <CardContent className="space-y-6 pt-6">
                            <div className="grid gap-6">
                                <div className="space-y-2">
                                    <Label className="text-base font-semibold">Hero Section</Label>
                                    <div className="grid gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border">
                                        <div>
                                            <Label className="text-xs text-muted-foreground uppercase mb-1 block">Title</Label>
                                            <Input 
                                                value={aboutContent.hero_title} 
                                                onChange={(e) => setAboutContent({...aboutContent, hero_title: e.target.value})}
                                                className="bg-white dark:bg-slate-950"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-xs text-muted-foreground uppercase mb-1 block">Description</Label>
                                            <Textarea 
                                                rows={3}
                                                value={aboutContent.hero_description} 
                                                onChange={(e) => setAboutContent({...aboutContent, hero_description: e.target.value})}
                                                className="bg-white dark:bg-slate-950"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-base font-semibold">Mission Section</Label>
                                    <div className="grid gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border">
                                        <div>
                                            <Label className="text-xs text-muted-foreground uppercase mb-1 block">Title</Label>
                                            <Input 
                                                value={aboutContent.mission_title} 
                                                onChange={(e) => setAboutContent({...aboutContent, mission_title: e.target.value})}
                                                className="bg-white dark:bg-slate-950"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-xs text-muted-foreground uppercase mb-1 block">Body</Label>
                                            <Textarea 
                                                rows={5}
                                                value={aboutContent.mission_body} 
                                                onChange={(e) => setAboutContent({...aboutContent, mission_body: e.target.value})}
                                                className="bg-white dark:bg-slate-950"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <Button onClick={handleUpdateContent} className="w-full bg-red-600 hover:bg-red-700 text-white gap-2">
                                <Save className="h-4 w-4" /> Save All Changes
                            </Button>
                        </CardContent>
                    </TabsContent>

                    <TabsContent value="preview" className="p-0 m-0 min-h-[400px] bg-slate-50 dark:bg-slate-950">
                        <div className="p-8 max-w-4xl mx-auto space-y-12">
                            <div className="text-center space-y-4">
                                <h1 className="text-4xl md:text-5xl font-extrabold">{aboutContent.hero_title || "Hero Title"}</h1>
                                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{aboutContent.hero_description || "Hero description goes here..."}</p>
                            </div>
                            <div className="text-center space-y-4">
                                <h2 className="text-3xl font-bold">{aboutContent.mission_title || "Mission Title"}</h2>
                                <p className="text-muted-foreground max-w-2xl mx-auto whitespace-pre-wrap">{aboutContent.mission_body || "Mission body text..."}</p>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </Card>
          </TabsContent>

          {/* USERS TAB */}
          <TabsContent value="users">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Users Directory</CardTitle>
                    <CardDescription>View, edit, and delete users.</CardDescription>
                </div>
                {/* CREATE USER BUTTON REMOVED */}
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.full_name}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge variant={user.role === 'admin' ? 'destructive' : user.role === 'employer' ? 'default' : 'secondary'}>
                              {user.role}
                            </Badge>
                          </TableCell>
                          <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                          <TableCell className="text-right flex justify-end gap-2">
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => {
                                    setEditingUser(user);
                                    setIsUserDialogOpen(true);
                                }}
                            >
                                <Pencil className="h-4 w-4 text-blue-600" />
                            </Button>

                            {user.role !== 'admin' && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete User?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will permanently remove <b>{user.full_name}</b> and all their data.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteUser(user.id)} className="bg-destructive text-destructive-foreground">
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* EDIT USER DIALOG */}
            <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit User Profile</DialogTitle>
                        <DialogDescription>Make changes to the user's role or basic info here.</DialogDescription>
                    </DialogHeader>
                    {editingUser && (
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="name" className="text-right">Name</Label>
                                <Input id="name" value={editingUser.full_name} onChange={(e) => setEditingUser({...editingUser, full_name: e.target.value})} className="col-span-3" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="email" className="text-right">Email</Label>
                                <Input id="email" value={editingUser.email} disabled className="col-span-3 bg-muted" title="Email cannot be changed directly" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="role" className="text-right">Role</Label>
                                <Select value={editingUser.role} onValueChange={(val) => setEditingUser({...editingUser, role: val})}>
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Select a role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="candidate">Candidate</SelectItem>
                                        <SelectItem value="employer">Employer</SelectItem>
                                        <SelectItem value="admin">Admin</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button onClick={handleSaveUser}>Save changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
          </TabsContent>

          {/* JOBS TAB */}
          <TabsContent value="jobs">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Job Listings</CardTitle>
                    <CardDescription>Moderate and manage all job postings.</CardDescription>
                </div>
                {/* CREATE JOB BUTTON REMOVED */}
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {jobs.map((job) => (
                        <TableRow key={job.id}>
                          <TableCell className="font-medium">{job.title}</TableCell>
                          <TableCell>{job.employer?.company_name || 'Unknown'}</TableCell>
                          <TableCell>{job.location}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 cursor-pointer hover:opacity-80" onClick={() => handleToggleJobStatus(job.id, job.is_active)}>
                              {job.is_active ? (
                                <Badge className="bg-green-600 hover:bg-green-700"><CheckCircle className="w-3 h-3 mr-1" /> Active</Badge>
                              ) : (
                                <Badge variant="secondary"><XCircle className="w-3 h-3 mr-1" /> Inactive</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right flex justify-end gap-2">
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => {
                                    setEditingJob(job);
                                    setIsJobDialogOpen(true);
                                }}
                            >
                                <Pencil className="h-4 w-4 text-blue-600" />
                            </Button>

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Job?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete <b>{job.title}</b>?
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteJob(job.id)} className="bg-destructive text-destructive-foreground">
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* EDIT JOB DIALOG - ONLY FOR EDITING NOW */}
            <Dialog open={isJobDialogOpen} onOpenChange={setIsJobDialogOpen}>
                <DialogContent className="max-w-lg overflow-y-auto max-h-[90vh]">
                    <DialogHeader>
                        <DialogTitle>Edit Job</DialogTitle>
                        <DialogDescription>
                            Update the details for the job listing.
                        </DialogDescription>
                    </DialogHeader>
                    {editingJob && (
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="employer">Employer</Label>
                                <Select 
                                    value={editingJob.employer_id} 
                                    onValueChange={(val) => setEditingJob({...editingJob, employer_id: val})}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Employer" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {employers.map(emp => (
                                            <SelectItem key={emp.id} value={emp.id}>{emp.company_name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="title">Job Title</Label>
                                <Input id="title" value={editingJob.title} onChange={(e) => setEditingJob({...editingJob, title: e.target.value})} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="location">Location</Label>
                                <Input id="location" value={editingJob.location} onChange={(e) => setEditingJob({...editingJob, location: e.target.value})} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="salary_min">Min Salary</Label>
                                    <Input id="salary_min" type="number" value={editingJob.salary_min} onChange={(e) => setEditingJob({...editingJob, salary_min: e.target.value})} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="salary_max">Max Salary</Label>
                                    <Input id="salary_max" type="number" value={editingJob.salary_max} onChange={(e) => setEditingJob({...editingJob, salary_max: e.target.value})} />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="type">Job Type</Label>
                                <Select value={editingJob.job_type} onValueChange={(val) => setEditingJob({...editingJob, job_type: val})}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Job Type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Full-time">Full-time</SelectItem>
                                        <SelectItem value="Part-time">Part-time</SelectItem>
                                        <SelectItem value="Contract">Contract</SelectItem>
                                        <SelectItem value="Internship">Internship</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea id="description" rows={4} value={editingJob.description} onChange={(e) => setEditingJob({...editingJob, description: e.target.value})} />
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button onClick={handleSaveJob}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;