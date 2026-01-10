import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Phone } from 'lucide-react';

export function CTASection() {
  return (
    <section className="py-20 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 gradient-primary" />
      
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-secondary/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground mb-6">
            Ready to Transform Your Chama?
          </h2>
          <p className="text-xl text-primary-foreground/80 mb-10 max-w-2xl mx-auto">
            Join thousands of Kenyan savings groups that have already made the switch to digital. 
            Start your free trial today — no credit card required.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Button 
              size="lg" 
              className="bg-secondary hover:bg-secondary/90 text-secondary-foreground text-lg px-8 py-6 rounded-xl shadow-lg hover:shadow-xl transition-all"
              asChild
            >
              <Link to="/auth?tab=signup">
                Get Started Free
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 text-lg px-8 py-6 rounded-xl"
            >
              <Phone className="mr-2 w-5 h-5" />
              Talk to Sales
            </Button>
          </div>
          
          {/* Trust badges */}
          <div className="flex flex-wrap items-center justify-center gap-8 text-primary-foreground/60 text-sm">
            <span>✅ Free 14-day trial</span>
            <span>✅ No credit card required</span>
            <span>✅ Cancel anytime</span>
            <span>✅ 24/7 support</span>
          </div>
        </div>
      </div>
    </section>
  );
}
