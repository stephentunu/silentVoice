import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, ArrowLeft, User, UserX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ThemeToggle } from '@/components/ThemeToggle';
import { supabase } from '@/integrations/supabase/client';
import { getSessionToken } from '@/lib/session';
import { toast } from 'sonner';

type JoinMode = 'anonymous' | 'named';

export default function JoinMeeting() {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [joinMode, setJoinMode] = useState<JoinMode>('anonymous');
  const [displayName, setDisplayName] = useState('');

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setCode(value);
  };

  const handleJoin = async () => {
    if (code.length !== 6) {
      toast.error('Please enter a valid 6-digit code');
      return;
    }

    if (joinMode === 'named' && !displayName.trim()) {
      toast.error('Please enter your name');
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

      // Register as participant with display name
      const sessionToken = getSessionToken();
      const participantName = joinMode === 'named' ? displayName.trim() : null;
      
      await supabase.from('participants').upsert({
        meeting_id: meeting.id,
        session_token: sessionToken,
        display_name: participantName,
      }, { onConflict: 'meeting_id,session_token' });

      // Store display name in session storage for the room
      if (participantName) {
        sessionStorage.setItem('participant_name', participantName);
      } else {
        sessionStorage.removeItem('participant_name');
      }

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

            {/* Join Mode Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">How would you like to join?</Label>
              <RadioGroup
                value={joinMode}
                onValueChange={(value) => setJoinMode(value as JoinMode)}
                className="grid grid-cols-2 gap-3"
              >
                <div className="relative">
                  <RadioGroupItem
                    value="anonymous"
                    id="anonymous"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="anonymous"
                    className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-border cursor-pointer transition-all peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 hover:border-primary/50"
                  >
                    <UserX className="h-5 w-5 text-muted-foreground peer-data-[state=checked]:text-primary" />
                    <span className="text-sm font-medium">Anonymous</span>
                  </Label>
                </div>
                <div className="relative">
                  <RadioGroupItem
                    value="named"
                    id="named"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="named"
                    className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-border cursor-pointer transition-all peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 hover:border-primary/50"
                  >
                    <User className="h-5 w-5 text-muted-foreground peer-data-[state=checked]:text-primary" />
                    <span className="text-sm font-medium">With Name</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Name Input - only shown when named mode is selected */}
            {joinMode === 'named' && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                <Label htmlFor="displayName">Your Name (Full name or nickname)</Label>
                <Input
                  id="displayName"
                  type="text"
                  placeholder="Enter your name..."
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value.slice(0, 50))}
                  maxLength={50}
                  className="h-12"
                />
              </div>
            )}

            <Button
              onClick={handleJoin}
              className="w-full h-12 text-lg"
              disabled={code.length !== 6 || isJoining || (joinMode === 'named' && !displayName.trim())}
            >
              {isJoining ? 'Joining...' : 'Enter Meeting'}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center mt-6">
            {joinMode === 'anonymous' 
              ? 'Your participation will be completely anonymous.'
              : 'Your name will be visible to the meeting host.'}
          </p>
        </div>
      </main>
    </div>
  );
}