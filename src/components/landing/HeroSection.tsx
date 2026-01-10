import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Shield, Smartphone, Wallet } from 'lucide-react';

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
      {/* Background with gradient overlay */}
      <div className="absolute inset-0 gradient-hero" />
      
      {/* Decorative elements */}
      <div className="absolute top-1/4 right-0 w-96 h-96 bg-secondary/20 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 left-0 w-80 h-80 bg-accent/20 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 py-20 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-card/10 backdrop-blur-sm border border-primary-foreground/20 rounded-full px-4 py-2 mb-8 animate-fade-in">
            <span className="text-sm font-medium text-primary-foreground">🇰🇪 Trusted by 10,000+ Kenyan Chamas</span>
          </div>
          
          {/* Main Headline */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-6 leading-tight animate-fade-in" style={{ animationDelay: '0.1s' }}>
            Welcome to{' '}
            <span className="text-secondary">Our Future Chama</span>
          </h1>
          
          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-primary-foreground/80 mb-10 max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: '0.2s' }}>
            Digitizing Kenyan Savings Groups for a Prosperous Future. 
            Manage contributions, loans, and investments with ease.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <Button 
              size="lg" 
              className="bg-secondary hover:bg-secondary/90 text-secondary-foreground text-lg px-8 py-6 rounded-xl shadow-lg hover:shadow-xl transition-all"
              asChild
            >
              <Link to="/auth?tab=signup">
                Join a Chama
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 text-lg px-8 py-6 rounded-xl"
              asChild
            >
              <Link to="/auth?tab=signup&create=true">
                Start a Chama
              </Link>
            </Button>
          </div>
          
          {/* Feature highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <div className="flex items-center gap-3 bg-card/10 backdrop-blur-sm rounded-xl p-4 border border-primary-foreground/10">
              <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                <Wallet className="w-6 h-6 text-secondary-foreground" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-primary-foreground">M-Pesa Integrated</h3>
                <p className="text-sm text-primary-foreground/70">Seamless payments</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 bg-card/10 backdrop-blur-sm rounded-xl p-4 border border-primary-foreground/10">
              <div className="w-12 h-12 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
                <Smartphone className="w-6 h-6 text-accent-foreground" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-primary-foreground">USSD & Mobile</h3>
                <p className="text-sm text-primary-foreground/70">Access via any phone</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 bg-card/10 backdrop-blur-sm rounded-xl p-4 border border-primary-foreground/10">
              <div className="w-12 h-12 rounded-lg bg-primary-foreground flex items-center justify-center flex-shrink-0">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-primary-foreground">CBK Compliant</h3>
                <p className="text-sm text-primary-foreground/70">Secure & regulated</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Wave decoration at bottom */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
          <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="hsl(var(--background))"/>
        </svg>
      </div>
    </section>
  );
}
