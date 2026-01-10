import { UserPlus, Settings, CreditCard, TrendingUp } from 'lucide-react';

const steps = [
  {
    number: '01',
    icon: UserPlus,
    title: 'Register Your Group',
    description: 'Create your Chama account and invite members to join. Quick and easy setup in minutes.',
  },
  {
    number: '02',
    icon: Settings,
    title: 'Set Contributions',
    description: 'Define your weekly or monthly savings goals. Customize contribution amounts for each member.',
  },
  {
    number: '03',
    icon: CreditCard,
    title: 'Manage Loans',
    description: 'Members can apply for loans, get approvals, and track repayments all in one place.',
  },
  {
    number: '04',
    icon: TrendingUp,
    title: 'Grow Together',
    description: 'Watch your collective savings grow. Invest and earn dividends as a group.',
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-20 bg-muted/50">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-block text-sm font-semibold text-primary uppercase tracking-wider mb-3">
            How It Works
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Start Growing Your Wealth in 4 Simple Steps
          </h2>
          <p className="text-lg text-muted-foreground">
            Getting started with Our Future Chama is easy. Follow these steps to digitize your savings group.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {/* Connection line for desktop */}
          <div className="hidden lg:block absolute top-16 left-[12%] right-[12%] h-0.5 bg-border" />
          
          {steps.map((step, index) => (
            <div 
              key={step.number} 
              className="relative animate-fade-in"
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              {/* Step card */}
              <div className="bg-card rounded-2xl p-6 shadow-card border border-border text-center h-full">
                {/* Number badge */}
                <div className="relative inline-flex mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center relative z-10">
                    <step.icon className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <span className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-sm font-bold text-secondary-foreground shadow-md z-20">
                    {step.number}
                  </span>
                </div>
                
                <h3 className="text-xl font-semibold text-foreground mb-3">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{step.description}</p>
              </div>
              
              {/* Arrow for mobile */}
              {index < steps.length - 1 && (
                <div className="lg:hidden flex justify-center py-4">
                  <div className="w-0.5 h-8 bg-border" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
