import { useNavigate } from 'react-router-dom';
import { MessageCircle, Shield, Users, Lock, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen hero-gradient network-bg relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Network nodes */}
        <div className="absolute top-20 left-10 w-2 h-2 rounded-full bg-primary/40 animate-pulse-glow" />
        <div className="absolute top-40 right-20 w-3 h-3 rounded-full bg-accent/30 animate-pulse-glow" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-40 left-1/4 w-2 h-2 rounded-full bg-primary/50 animate-pulse-glow" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/3 right-1/3 w-2 h-2 rounded-full bg-accent/40 animate-pulse-glow" style={{ animationDelay: '0.5s' }} />
        <div className="absolute bottom-20 right-10 w-3 h-3 rounded-full bg-primary/30 animate-pulse-glow" style={{ animationDelay: '1.5s' }} />
        
        {/* Connection lines (decorative) */}
        <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
          <line x1="10%" y1="20%" x2="30%" y2="40%" stroke="hsl(185 85% 55%)" strokeWidth="1" />
          <line x1="70%" y1="15%" x2="85%" y2="35%" stroke="hsl(270 60% 50%)" strokeWidth="1" />
          <line x1="20%" y1="70%" x2="45%" y2="55%" stroke="hsl(160 70% 50%)" strokeWidth="1" />
          <line x1="60%" y1="80%" x2="80%" y2="60%" stroke="hsl(185 85% 55%)" strokeWidth="1" />
        </svg>
      </div>
      
      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-4 py-4 md:px-8 lg:px-12">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-7 w-7 md:h-8 md:w-8 text-primary" />
          <span className="text-lg md:text-xl font-bold text-foreground">SilentVoice</span>
        </div>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6 lg:gap-8">
          <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
          <a href="#about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">About</a>
          <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">How It Works</a>
        </nav>
        
        <div className="flex items-center gap-2 md:gap-3">
          <ThemeToggle />
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/auth')}
            className="text-xs md:text-sm border-primary/30 hover:bg-primary/10 hover:border-primary/50"
          >
            Admin Login
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 flex flex-col lg:flex-row items-center justify-between px-4 md:px-8 lg:px-12 xl:px-20 pt-8 md:pt-12 lg:pt-16 pb-12 md:pb-16 lg:pb-20 gap-8 lg:gap-12 max-w-7xl mx-auto">
        {/* Left Content */}
        <div className="flex-1 text-center lg:text-left max-w-xl lg:max-w-2xl animate-fade-in">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4 md:mb-6 leading-tight">
            Share & Connect.{' '}
            <span className="gradient-text">Anonymously.</span>
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-8 md:mb-10 leading-relaxed">
            Share your thoughts, find understanding, without judgment. 
            Empower every voice in your meetings.
          </p>

          {/* Primary CTA */}
          <Button
            size="lg"
            onClick={() => navigate('/join')}
            className="gradient-btn text-base md:text-lg px-8 md:px-10 py-5 md:py-6 h-auto rounded-full shadow-lg"
          >
            <Users className="mr-2 h-5 w-5" />
            Join Meeting Now
          </Button>

          {/* Feature badges */}
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 md:gap-6 mt-8 md:mt-10">
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="p-2 rounded-lg bg-primary/10">
                <Lock className="h-4 w-4 text-primary" />
              </div>
              <span className="text-sm font-medium">Private</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="p-2 rounded-lg bg-primary/10">
                <Shield className="h-4 w-4 text-primary" />
              </div>
              <span className="text-sm font-medium">Secure</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="p-2 rounded-lg bg-primary/10">
                <Heart className="h-4 w-4 text-primary" />
              </div>
              <span className="text-sm font-medium">Inclusive</span>
            </div>
          </div>
        </div>

        {/* Right Illustration */}
        <div className="flex-1 flex items-center justify-center lg:justify-end animate-float">
          <div className="relative w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96">
            {/* Abstract figures */}
            <svg viewBox="0 0 400 400" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              {/* Figure 1 */}
              <ellipse cx="150" cy="280" rx="60" ry="80" fill="url(#gradient1)" opacity="0.9" />
              <circle cx="150" cy="180" r="35" fill="url(#gradient1)" />
              
              {/* Figure 2 */}
              <ellipse cx="250" cy="280" rx="60" ry="80" fill="url(#gradient2)" opacity="0.9" />
              <circle cx="250" cy="180" r="35" fill="url(#gradient2)" />
              
              {/* Speech bubbles */}
              <g className="animate-pulse-glow">
                <rect x="80" y="80" rx="12" ry="12" width="50" height="40" fill="hsl(185 85% 55%)" opacity="0.9" />
                <text x="105" y="105" textAnchor="middle" fill="hsl(230 40% 8%)" fontSize="18">?</text>
              </g>
              
              <g className="animate-pulse-glow" style={{ animationDelay: '1s' }}>
                <rect x="270" y="60" rx="12" ry="12" width="50" height="40" fill="hsl(185 85% 55%)" opacity="0.9" />
                <text x="295" y="85" textAnchor="middle" fill="hsl(230 40% 8%)" fontSize="18">?</text>
              </g>
              
              <g className="animate-pulse-glow" style={{ animationDelay: '0.5s' }}>
                <rect x="180" y="40" rx="12" ry="12" width="45" height="35" fill="hsl(160 70% 50%)" opacity="0.9" />
                <text x="202" y="62" textAnchor="middle" fill="hsl(230 40% 8%)" fontSize="14">💬</text>
              </g>
              
              <g className="animate-pulse-glow" style={{ animationDelay: '1.5s' }}>
                <rect x="320" y="120" rx="10" ry="10" width="40" height="35" fill="hsl(270 60% 60%)" opacity="0.9" />
                <text x="340" y="142" textAnchor="middle" fill="white" fontSize="12">✓</text>
              </g>
              
              <g className="animate-pulse-glow" style={{ animationDelay: '2s' }}>
                <rect x="40" y="140" rx="10" ry="10" width="40" height="35" fill="hsl(270 60% 60%)" opacity="0.9" />
                <text x="60" y="162" textAnchor="middle" fill="white" fontSize="12">💡</text>
              </g>
              
              {/* Gradients */}
              <defs>
                <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="hsl(185 85% 55%)" />
                  <stop offset="100%" stopColor="hsl(270 60% 60%)" />
                </linearGradient>
                <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="hsl(270 60% 60%)" />
                  <stop offset="100%" stopColor="hsl(185 85% 55%)" />
                </linearGradient>
              </defs>
            </svg>
            
            {/* Glow effect behind illustration */}
            <div className="absolute inset-0 -z-10 blur-3xl opacity-30">
              <div className="absolute top-1/4 left-1/4 w-1/2 h-1/2 rounded-full bg-primary" />
              <div className="absolute bottom-1/4 right-1/4 w-1/2 h-1/2 rounded-full bg-accent" />
            </div>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section id="features" className="relative z-10 px-4 md:px-8 lg:px-12 pb-16 md:pb-24">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-foreground mb-10 md:mb-14">
            Why Choose <span className="gradient-text">SilentVoice</span>?
          </h2>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            <div className="glass-card rounded-2xl p-5 md:p-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <div className="w-11 h-11 md:w-12 md:h-12 rounded-xl bg-primary/15 flex items-center justify-center mb-4">
                <Shield className="h-5 w-5 md:h-6 md:w-6 text-primary" />
              </div>
              <h3 className="text-base md:text-lg font-semibold text-foreground mb-2">100% Anonymous</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                No personal data collected. Participants join with just a meeting code.
              </p>
            </div>

            <div className="glass-card rounded-2xl p-5 md:p-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <div className="w-11 h-11 md:w-12 md:h-12 rounded-xl bg-accent/15 flex items-center justify-center mb-4">
                <MessageCircle className="h-5 w-5 md:h-6 md:w-6 text-accent" />
              </div>
              <h3 className="text-base md:text-lg font-semibold text-foreground mb-2">Real-Time Discussion</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Submit questions, opinions, and suggestions that appear instantly.
              </p>
            </div>

            <div className="glass-card rounded-2xl p-5 md:p-6 animate-slide-up sm:col-span-2 lg:col-span-1" style={{ animationDelay: '0.3s' }}>
              <div className="w-11 h-11 md:w-12 md:h-12 rounded-xl bg-primary/15 flex items-center justify-center mb-4">
                <Users className="h-5 w-5 md:h-6 md:w-6 text-primary" />
              </div>
              <h3 className="text-base md:text-lg font-semibold text-foreground mb-2">Balanced Participation</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Upvote the best contributions and let moderators highlight key insights.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/50 px-4 md:px-8 py-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            <span className="text-sm font-semibold text-foreground">SilentVoice</span>
          </div>
          <p className="text-xs text-muted-foreground">
            © 2026 SilentVoice. Empowering every voice.
          </p>
        </div>
      </footer>
    </div>
  );
}
