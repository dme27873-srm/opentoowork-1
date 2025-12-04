import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Quote } from "lucide-react";

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Software Engineer",
    company: "Google",
  quote: "OPENTOOWORK helped me land my dream job at Google. The platform made it easy to connect with the right opportunities.",
    initials: "SC"
  },
  {
    name: "Raj Patel",
    role: "Data Scientist",
    company: "Microsoft",
    quote: "Amazing experience! I found multiple great roles and the hiring process was much faster than I expected.",
    initials: "RP"
  },
  {
    name: "Maria Garcia",
    role: "Product Manager",
    company: "Amazon",
    quote: "The best platform for discovering top U.S. companies and jobs tailored to your skills and career goals.",
    initials: "MG"
  }
];

const SuccessStories = () => {
  return (
    <section className="py-20 bg-gradient-to-b from-primary-light/20 to-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold">Success Stories</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Professionals growing their careers with us
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <Card 
              key={index}
              className="p-6 bg-card border-border/50 hover:shadow-2xl hover:-translate-y-2 transition-all"
            >
              <div className="space-y-6">
                <Quote className="h-10 w-10 text-primary opacity-60" />
                
                <p className="text-muted-foreground leading-relaxed italic">
                  “{testimonial.quote}”
                </p>

                <div className="flex items-center gap-4 pt-6 border-t border-border/40">
                  <Avatar className="h-12 w-12 bg-gradient-to-br from-primary to-accent shadow">
                    <AvatarFallback className="bg-transparent text-primary-foreground font-semibold">
                      {testimonial.initials}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div>
                    <p className="font-semibold text-lg">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {testimonial.role} at {testimonial.company}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SuccessStories;
