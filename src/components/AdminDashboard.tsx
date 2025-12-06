import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import UsersTab from "./admin/UsersTab";
import JobsTab from "./admin/JobsTab";
import ContentTab from "./admin/ContentTab";
import { ShieldCheck } from "lucide-react";

const AdminDashboard = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 rounded-lg bg-primary/10">
          <ShieldCheck className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Admin Panel</h1>
          <p className="text-muted-foreground">Manage users, jobs, and site content</p>
        </div>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="jobs">Jobs</TabsTrigger>
          <TabsTrigger value="content">Site Content</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card className="p-6">
            <UsersTab />
          </Card>
        </TabsContent>

        <TabsContent value="jobs">
          <Card className="p-6">
            <JobsTab />
          </Card>
        </TabsContent>

        <TabsContent value="content">
          <ContentTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;