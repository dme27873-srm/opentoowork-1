import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Save, Share2 } from "lucide-react";

const ContentTab = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState({
    hero_title: "",
    hero_description: "",
    mission_title: "",
    mission_body: "",
    contact_email: "",
    contact_phone: "",
    contact_address: "",
    social_linkedin: "",
    social_twitter: "",
    social_facebook: "",
    social_instagram: ""
  });

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    const { data, error } = await supabase
      .from("site_content")
      .select("content")
      .eq("section_key", "about_page")
      .single();

    if (data?.content) {
      setContent(prev => ({ ...prev, ...data.content }));
    }
  };

  const handleSave = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from("site_content")
      .upsert({
        section_key: "about_page",
        content: content,
        last_updated_by: user?.id,
        updated_at: new Date().toISOString()
      }, { onConflict: 'section_key' });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Content updated successfully!" });
    }
    setLoading(false);
  };

  const handleChange = (field: string, value: string) => {
    setContent(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Site Content Management</h2>
        <Button onClick={handleSave} disabled={loading}>
          <Save className="w-4 h-4 mr-2" />
          {loading ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Hero Section</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Page Title</Label>
              <Input 
                value={content.hero_title} 
                onChange={(e) => handleChange('hero_title', e.target.value)} 
                placeholder="About OPENTOOWORK"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea 
                value={content.hero_description} 
                onChange={(e) => handleChange('hero_description', e.target.value)} 
                placeholder="Hero text..."
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mission Section</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Mission Title</Label>
              <Input 
                value={content.mission_title} 
                onChange={(e) => handleChange('mission_title', e.target.value)} 
                placeholder="Our Mission"
              />
            </div>
            <div>
              <Label>Mission Body</Label>
              <Textarea 
                value={content.mission_body} 
                onChange={(e) => handleChange('mission_body', e.target.value)} 
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contact & Footer</CardTitle>
            <p className="text-sm text-muted-foreground">Contact details appear on the About page and Footer.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Contact Email</Label>
                <Input 
                  value={content.contact_email} 
                  onChange={(e) => handleChange('contact_email', e.target.value)} 
                />
              </div>
              <div>
                <Label>Contact Phone</Label>
                <Input 
                  value={content.contact_phone} 
                  onChange={(e) => handleChange('contact_phone', e.target.value)} 
                />
              </div>
            </div>
            <div>
              <Label>Address</Label>
              <Textarea 
                value={content.contact_address} 
                onChange={(e) => handleChange('contact_address', e.target.value)} 
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5" /> Social Media Links
            </CardTitle>
            <p className="text-sm text-muted-foreground">Leave empty to hide from the footer.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>LinkedIn URL</Label>
                <Input 
                  value={content.social_linkedin} 
                  onChange={(e) => handleChange('social_linkedin', e.target.value)} 
                  placeholder="https://linkedin.com/company/..."
                />
              </div>
              <div>
                <Label>Twitter (X) URL</Label>
                <Input 
                  value={content.social_twitter} 
                  onChange={(e) => handleChange('social_twitter', e.target.value)} 
                  placeholder="https://twitter.com/..."
                />
              </div>
              <div>
                <Label>Facebook URL</Label>
                <Input 
                  value={content.social_facebook} 
                  onChange={(e) => handleChange('social_facebook', e.target.value)} 
                  placeholder="https://facebook.com/..."
                />
              </div>
              <div>
                <Label>Instagram URL</Label>
                <Input 
                  value={content.social_instagram} 
                  onChange={(e) => handleChange('social_instagram', e.target.value)} 
                  placeholder="https://instagram.com/..."
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ContentTab;