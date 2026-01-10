import { Star, Quote } from 'lucide-react';

const testimonials = [
  {
    name: 'Jane Wanjiru',
    role: 'Chairperson, Umoja Women Group',
    content: 'Our Future helped us grow from Ksh 50,000 to Ksh 2.5M in savings! The digital records have made our AGMs so much easier.',
    rating: 5,
    location: 'Nairobi',
  },
  {
    name: 'David Omondi',
    role: 'Treasurer, Jijenge Youth Group',
    content: 'The loan management system saved us 10 hours of work every week. Now I can focus on growing our investments instead of paperwork.',
    rating: 5,
    location: 'Kisumu',
  },
  {
    name: 'Mary Akinyi',
    role: 'Secretary, Pamoja Sacco',
    content: 'The M-Pesa integration is amazing! Members pay on time now because they get automatic reminders. Our collection rate improved by 40%.',
    rating: 5,
    location: 'Mombasa',
  },
];

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-block text-sm font-semibold text-secondary uppercase tracking-wider mb-3">
            Testimonials
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Success Stories from Kenyan Chamas
          </h2>
          <p className="text-lg text-muted-foreground">
            See how savings groups across Kenya are transforming their operations with Our Future Chama.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div 
              key={testimonial.name}
              className="bg-card rounded-2xl p-8 shadow-card border border-border relative animate-fade-in"
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              {/* Quote icon */}
              <div className="absolute -top-4 left-8">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                  <Quote className="w-5 h-5 text-primary-foreground" />
                </div>
              </div>
              
              {/* Rating */}
              <div className="flex items-center gap-1 mb-4 pt-2">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-secondary text-secondary" />
                ))}
              </div>
              
              {/* Content */}
              <p className="text-foreground mb-6 leading-relaxed italic">
                "{testimonial.content}"
              </p>
              
              {/* Author */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                  <span className="text-lg font-semibold text-primary">
                    {testimonial.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">{testimonial.name}</h4>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  <p className="text-xs text-muted-foreground">{testimonial.location}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
