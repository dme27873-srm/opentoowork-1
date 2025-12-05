import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhyChooseUs from "@/components/sections/WhyChooseUs";
import HowItWorks from "@/components/sections/HowItWorks";
import { Skeleton } from "@/components/ui/skeleton";
import { Mail, Phone, MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";

const About = () => {
  const [content, setContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      const { data } = await supabase
        .from("site_content")
        .select("content")
        .eq("section_key", "about_page")
        .single();

      if (data?.content) {
        setContent(data.content);
      }
      setLoading(false);
    };

    fetchContent();
  }, []);

  // Use content from DB, or defaults ONLY if content hasn't loaded yet.
  // If content is loaded but empty string, we respect the empty string (to hide it).
  const heroTitle = content ? content.hero_title : "About OPENTOOWORK";
  const heroDesc = content ? content.hero_description : "Connecting professionals with opportunities.";
  const missionTitle = content ? content.mission_title : "Our Mission";
  const missionBody = content ? content.mission_body : "To simplify the job search.";
  
  const contactEmail = content?.contact_email;
  const contactPhone = content?.contact_phone;
  const contactAddress = content?.contact_address;

  // Check if any contact info exists to decide whether to render the main container
  const hasContactInfo = contactEmail || contactPhone || contactAddress;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      {/* HERO SECTION */}
      {(heroTitle || heroDesc) && (
        <header className="py-24 bg-gradient-to-b from-primary-light/10 to-background">
          <div className="container mx-auto px-4 text-center">
            {loading ? (
              <div className="space-y-4 flex flex-col items-center">
                <Skeleton className="h-12 w-3/4 md:w-1/2" />
                <Skeleton className="h-4 w-full md:w-2/3" />
              </div>
            ) : (
              <>
                {heroTitle && <h1 className="text-4xl md:text-5xl font-extrabold mb-4 animate-fade-in">{heroTitle}</h1>}
                {heroDesc && (
                  <p className="max-w-3xl mx-auto text-lg text-muted-foreground whitespace-pre-wrap animate-fade-in delay-100">
                    {heroDesc}
                  </p>
                )}
              </>
            )}
          </div>
        </header>
      )}

      <main className="space-y-24">
        <WhyChooseUs />

        {/* MISSION SECTION */}
        {(missionTitle || missionBody) && (
          <section className="py-20 bg-background">
            <div className="container mx-auto px-4">
              <div className="text-center mb-12">
                {loading ? (
                  <div className="space-y-4 flex flex-col items-center">
                    <Skeleton className="h-8 w-1/4" />
                    <Skeleton className="h-20 w-2/3" />
                  </div>
                ) : (
                  <>
                    {missionTitle && <h2 className="text-3xl md:text-4xl font-bold">{missionTitle}</h2>}
                    {missionBody && (
                      <p className="text-muted-foreground max-w-2xl mx-auto mt-4 whitespace-pre-wrap">
                        {missionBody}
                      </p>
                    )}
                  </>
                )}
              </div>

              {/* Static Feature Cards (Always visible as core features) */}
              <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                <div className="p-6 bg-card border-border/50 rounded-lg">
                  <h3 className="font-semibold text-xl mb-2">For Candidates</h3>
                  <p className="text-muted-foreground">
                    Create a professional profile, search confidently, and apply to roles with a single click.
                  </p>
                </div>
                <div className="p-6 bg-card border-border/50 rounded-lg">
                  <h3 className="font-semibold text-xl mb-2">For Employers</h3>
                  <p className="text-muted-foreground">
                    Post verified job openings, discover vetted talent, and streamline your hiring workflow.
                  </p>
                </div>
                <div className="p-6 bg-card border-border/50 rounded-lg">
                  <h3 className="font-semibold text-xl mb-2">Trust & Safety</h3>
                  <p className="text-muted-foreground">
                    We verify employers and protect candidate data with best-in-class security practices.
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* CONTACT SECTION - Adapts Layout */}
        {hasContactInfo && (
          <section className="py-20 bg-muted/30">
            <div className="container mx-auto px-4">
              <div className="max-w-5xl mx-auto text-center">
                <h2 className="text-3xl font-bold mb-12">Contact Us</h2>
                
                {/* Flex container for adaptive centering */}
                <div className="flex flex-wrap justify-center gap-6">
                  
                  {contactEmail && (
                    <Card className="p-6 flex flex-col items-center gap-4 hover:shadow-md transition-all min-w-[280px] flex-1 md:flex-none">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <Mail className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">Email</h3>
                        <p className="text-sm text-muted-foreground break-all">{contactEmail}</p>
                      </div>
                    </Card>
                  )}
                  
                  {contactPhone && (
                    <Card className="p-6 flex flex-col items-center gap-4 hover:shadow-md transition-all min-w-[280px] flex-1 md:flex-none">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <Phone className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">Phone</h3>
                        <p className="text-sm text-muted-foreground">{contactPhone}</p>
                      </div>
                    </Card>
                  )}

                  {contactAddress && (
                    <Card className="p-6 flex flex-col items-center gap-4 hover:shadow-md transition-all min-w-[280px] flex-1 md:flex-none">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <MapPin className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">Office</h3>
                        <p className="text-sm text-muted-foreground px-4">{contactAddress}</p>
                      </div>
                    </Card>
                  )}

                </div>
              </div>
            </div>
          </section>
        )}

        <HowItWorks />

        <section className="py-16 bg-primary/5">
          <div className="container mx-auto px-4 text-center">
            <h3 className="text-2xl font-bold mb-4">Ready to find your next role?</h3>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-6">
              Create a profile, explore jobs, and get discovered by top employers across the USA.
            </p>
            <div className="inline-flex gap-3">
              <a href="/candidate/auth" className="inline-block px-6 py-3 rounded-lg bg-gradient-to-r from-primary to-accent text-white font-semibold">
                Get Started
              </a>
              <a href="/jobs" className="inline-block px-6 py-3 rounded-lg border border-border text-foreground">
                Browse Jobs
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default About;