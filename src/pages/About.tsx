import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhyChooseUs from "@/components/sections/WhyChooseUs";
import HowItWorks from "@/components/sections/HowItWorks";
import { supabase } from "@/lib/supabase";
import { Mail, Phone, MapPin, Loader2 } from "lucide-react";
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

  // Default fallbacks if content hasn't been set by admin yet
  const heroTitle = content?.hero_title || "About OPENTOOWORK";
  const heroDesc = content?.hero_description || "OPENTOOWORK connects talented professionals with meaningful career opportunities across the United States.";
  const missionTitle = content?.mission_title || "Our Mission";
  const missionBody = content?.mission_body || "We believe every skilled candidate deserves access to opportunities that match their ambitions.";

  // Check if any contact info exists to decide whether to render the section
  const showContact = content?.contact_email || content?.contact_phone || content?.contact_address;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />

      <main className="flex-grow">
        {/* Dynamic Hero Section */}
        <header className="relative py-24 bg-gradient-to-b from-primary/5 to-background overflow-hidden">
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto text-center space-y-6">
              <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                {heroTitle}
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed">
                {heroDesc}
              </p>
            </div>
          </div>
        </header>

        <WhyChooseUs />

        {/* Dynamic Mission Section */}
        <section className="py-24 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">{missionTitle}</h2>
              <div className="prose prose-lg dark:prose-invert mx-auto text-muted-foreground">
                <p className="whitespace-pre-wrap leading-relaxed">{missionBody}</p>
              </div>
            </div>
            
            {/* Mission Cards (Static Structure as these are core features) */}
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {[
                { title: "For Candidates", desc: "Create a professional profile, search confidently, and apply to roles with a single click." },
                { title: "For Employers", desc: "Post verified job openings, discover vetted talent, and streamline your hiring workflow." },
                { title: "Trust & Safety", desc: "We verify employers and protect candidate data with best-in-class security practices." }
              ].map((item, i) => (
                <Card key={i} className="p-8 border-border/50 hover:border-primary/20 transition-all hover:shadow-lg bg-card/50 backdrop-blur-sm">
                  <h3 className="font-semibold text-xl mb-3">{item.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {item.desc}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <HowItWorks />

        {/* Adaptive Contact Section */}
        {showContact && (
          <section className="py-24 bg-muted/30">
            <div className="container mx-auto px-4">
              <div className="max-w-5xl mx-auto">
                <h2 className="text-3xl font-bold mb-12 text-center">Get in Touch</h2>
                
                {/* Flex container handles centering and wrapping automatically based on count */}
                <div className="flex flex-wrap justify-center gap-8 md:gap-12">
                  
                  {content?.contact_email && (
                    <div className="flex flex-col items-center text-center p-6 bg-background rounded-2xl shadow-sm border border-border/50 min-w-[280px] flex-1 md:flex-none max-w-sm hover:-translate-y-1 transition-transform">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4 text-primary">
                        <Mail className="h-6 w-6" />
                      </div>
                      <h3 className="font-semibold mb-2">Email Us</h3>
                      <a href={`mailto:${content.contact_email}`} className="text-muted-foreground hover:text-primary transition-colors">
                        {content.contact_email}
                      </a>
                    </div>
                  )}

                  {content?.contact_phone && (
                    <div className="flex flex-col items-center text-center p-6 bg-background rounded-2xl shadow-sm border border-border/50 min-w-[280px] flex-1 md:flex-none max-w-sm hover:-translate-y-1 transition-transform">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4 text-primary">
                        <Phone className="h-6 w-6" />
                      </div>
                      <h3 className="font-semibold mb-2">Call Us</h3>
                      <a href={`tel:${content.contact_phone}`} className="text-muted-foreground hover:text-primary transition-colors">
                        {content.contact_phone}
                      </a>
                    </div>
                  )}

                  {content?.contact_address && (
                    <div className="flex flex-col items-center text-center p-6 bg-background rounded-2xl shadow-sm border border-border/50 min-w-[280px] flex-1 md:flex-none max-w-sm hover:-translate-y-1 transition-transform">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4 text-primary">
                        <MapPin className="h-6 w-6" />
                      </div>
                      <h3 className="font-semibold mb-2">Visit Us</h3>
                      <p className="text-muted-foreground whitespace-pre-wrap max-w-[250px]">
                        {content.contact_address}
                      </p>
                    </div>
                  )}

                </div>
              </div>
            </div>
          </section>
        )}

        <section className="py-20 bg-primary/5 border-t border-primary/10">
          <div className="container mx-auto px-4 text-center">
            <h3 className="text-3xl font-bold mb-4">Ready to start your journey?</h3>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-8 text-lg">
              Join thousands of professionals finding their dream jobs today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/candidate/auth" className="inline-flex items-center justify-center px-8 py-4 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors shadow-lg hover:shadow-primary/25">
                Get Started Now
              </a>
              <a href="/jobs" className="inline-flex items-center justify-center px-8 py-4 rounded-lg border border-border bg-background hover:bg-accent text-foreground font-semibold transition-colors">
                Browse Open Roles
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