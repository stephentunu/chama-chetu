import { 
  Wallet, 
  Users, 
  TrendingUp, 
  Shield, 
  BarChart3, 
  Bell,
  Smartphone,
  FileText
} from 'lucide-react';

const features = [
  {
    icon: Wallet,
    title: 'M-Pesa Integration',
    description: 'Seamlessly collect and disburse funds via M-Pesa. Automated reminders and instant confirmations.',
    color: 'bg-secondary',
  },
  {
    icon: Users,
    title: 'Member Management',
    description: 'Easily manage your Chama members, track attendance, and monitor participation levels.',
    color: 'bg-accent',
  },
  {
    icon: TrendingUp,
    title: 'Loan Processing',
    description: 'Apply, approve, and track loans with automatic interest calculations and repayment schedules.',
    color: 'bg-primary',
  },
  {
    icon: Shield,
    title: 'Secure & Compliant',
    description: 'Bank-grade security with CBK and SASRA compliance. Your data is always protected.',
    color: 'bg-success',
  },
  {
    icon: BarChart3,
    title: 'Financial Reports',
    description: 'Generate comprehensive reports for meetings, audits, and regulatory submissions.',
    color: 'bg-secondary',
  },
  {
    icon: Bell,
    title: 'Smart Notifications',
    description: 'Automated SMS and in-app reminders for contributions, meetings, and loan repayments.',
    color: 'bg-accent',
  },
  {
    icon: Smartphone,
    title: 'USSD Access',
    description: 'Access your Chama from any phone using USSD codes. No smartphone required.',
    color: 'bg-primary',
  },
  {
    icon: FileText,
    title: 'Digital Records',
    description: 'Say goodbye to paper. All transactions and minutes are securely stored digitally.',
    color: 'bg-success',
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-block text-sm font-semibold text-secondary uppercase tracking-wider mb-3">
            Features
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Everything You Need to Run Your Chama
          </h2>
          <p className="text-lg text-muted-foreground">
            From contributions to loans, we've got you covered with powerful tools designed for Kenyan savings groups.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div 
              key={feature.title}
              className="group bg-card rounded-2xl p-6 shadow-card hover:shadow-elegant transition-all duration-300 border border-border hover:border-primary/20 animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={`w-14 h-14 ${feature.color} rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className="w-7 h-7 text-primary-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
