import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ThemeToggle } from '@/components/ThemeToggle';
import { supabase } from '@/integrations/supabase/client';
import { getSessionToken } from '@/lib/session';
import { toast } from 'sonner';

export default function JoinMeeting() {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setCode(value);
  };

  const handleJoin = async () => {
    if (code.length !== 6) {
      toast.error('Please enter a valid 6-digit code');
      return;
    }

    setIsJoining(true);

    try {
      // Check if meeting exists and is active
      const { data: meeting, error } = await supabase
        .from('meetings')
        .select('id, status')
        .eq('code', code)
        .maybeSingle();

      if (error) {
        toast.error('Failed to join meeting. Please try again.');
        return;
      }

      if (!meeting) {
        toast.error('Meeting not found. Please check the code.');
        return;
      }

      if (meeting.status !== 'active') {
        toast.error('This meeting has ended or is paused.');
        return;
      }

      // Register as participant
      const sessionToken = getSessionToken();
      await supabase.from('participants').upsert({
        meeting_id: meeting.id,
        session_token: sessionToken,
      }, { onConflict: 'meeting_id,session_token' });

      // Navigate to the discussion room
      navigate(`/room/${code}`);
    } catch (err) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
      
      <header className="relative z-10 flex items-center justify-between p-4 md:p-6">
        <Button variant="ghost" onClick={() => navigate('/')} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <ThemeToggle />
      </header>

      <main className="relative z-10 flex flex-col items-center justify-center px-4 py-12 min-h-[80vh]">
        <div className="glass-card rounded-2xl p-8 w-full max-w-md animate-scale-in">
          <div className="flex items-center justify-center gap-2 mb-8">
            <MessageCircle className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold text-foreground">SilentVoice</span>
          </div>

          <h1 className="text-2xl font-bold text-center text-foreground mb-2">
            Join a Meeting
          </h1>
          <p className="text-muted-foreground text-center mb-8">
            Enter the 6-digit code shared by your meeting host
          </p>

          <div className="space-y-6">
            <Input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="000000"
              value={code}
              onChange={handleCodeChange}
              className="text-center text-3xl tracking-[0.5em] h-16 font-mono"
              maxLength={6}
            />

            <Button
              onClick={handleJoin}
              className="w-full h-12 text-lg"
              disabled={code.length !== 6 || isJoining}
            >
              {isJoining ? 'Joining...' : 'Enter Meeting'}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center mt-6">
            No sign-up required. Your participation is completely anonymous.
          </p>
        </div>
      </main>
    </div>
  );
}
