import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhyChooseUs from "@/components/sections/WhyChooseUs";
import HowItWorks from "@/components/sections/HowItWorks";

const About = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <header className="py-24 bg-gradient-to-b from-primary-light/10 to-background">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">About OPENTOOWORK</h1>
          <p className="max-w-3xl mx-auto text-lg text-muted-foreground">
            OPENTOOWORK connects talented professionals with meaningful career opportunities across the
            United States. Our mission is to simplify the job search and make hiring faster and fairer for
            everyone.
          </p>
        </div>
      </header>

      <main className="space-y-24">
        <WhyChooseUs />

        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold">Our Mission</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto mt-4">
                We believe every skilled candidate deserves access to opportunities that match their
                ambitions. OPENTOOWORK builds tools that help candidates showcase skills and connect with
                verified employers quickly and transparently.
              </p>
            </div>

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
