import { Shield, Zap, Users, Award } from "lucide-react";
import { Card } from "@/components/ui/card";

const features = [
  {
    icon: Shield,
    title: "Secure & Trusted",
    description: "All employers are verified. Your data and applications are protected with strong security."
  },
  {
    icon: Zap,
    title: "Quick Apply",
    description: "Apply to multiple job openings with a single click — fast and smart hiring process."
  },
  {
    icon: Users,
    title: "Skill-Based Matching",
    description: "We match candidates to roles based on skills and experience — no complex eligibility guesswork."
  },
  {
    icon: Award,
    title: "Career Growth",
    description: "Work with top U.S. companies and start building your professional journey with confidence."
  }
];

const WhyChooseUs = () => {
  return (
    <section className="py-20 bg-gradient-to-b from-background to-primary-light/20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold">Why Choose OPENTOOWORK?</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            A platform designed to help skilled talent build a successful career in the United States
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 bg-card border-border/50"
            >
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-4">
                <feature.icon className="h-7 w-7 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;
