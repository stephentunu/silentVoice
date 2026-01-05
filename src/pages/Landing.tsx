import { useNavigate } from 'react-router-dom';
import { MessageCircle, Shield, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
      
      {/* Header */}
      <header className="relative z-10 flex items-center justify-between p-4 md:p-6">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold text-foreground">SilentVoice</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button 
            variant="outline" 
            onClick={() => navigate('/auth')}
            className="hidden sm:inline-flex"
          >
            Admin Login
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 flex flex-col items-center justify-center px-4 pt-12 pb-20 md:pt-24">
        <div className="text-center max-w-3xl mx-auto animate-fade-in">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            Every voice deserves a{' '}
            <span className="gradient-text">safe space</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
            Empower introverted and shy participants to contribute anonymously during meetings. 
            No sign-up required for participants.
          </p>

          {/* Primary CTA */}
          <Button
            size="lg"
            onClick={() => navigate('/join')}
            className="text-lg px-8 py-6 h-auto rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            <Users className="mr-2 h-5 w-5" />
            Join Meeting
          </Button>

          {/* Mobile Admin Link */}
          <div className="mt-6 sm:hidden">
            <Button variant="ghost" onClick={() => navigate('/auth')}>
              Admin Login
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mt-20 max-w-5xl mx-auto w-full">
          <div className="glass-card rounded-2xl p-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">100% Anonymous</h3>
            <p className="text-muted-foreground">
              No personal data collected. Participants join with just a meeting code.
            </p>
          </div>

          <div className="glass-card rounded-2xl p-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
              <MessageCircle className="h-6 w-6 text-accent" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Real-Time Discussion</h3>
            <p className="text-muted-foreground">
              Submit questions, opinions, and suggestions that appear instantly.
            </p>
          </div>

          <div className="glass-card rounded-2xl p-6 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Balanced Participation</h3>
            <p className="text-muted-foreground">
              Upvote the best contributions and let moderators highlight key insights.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
