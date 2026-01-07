import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, ThumbsUp, Pin, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/ThemeToggle';
import { supabase } from '@/integrations/supabase/client';
import { getSessionToken } from '@/lib/session';
import { toast } from 'sonner';

type SubmissionType = 'question' | 'opinion' | 'answer' | 'suggestion';

interface Submission {
  id: string;
  content: string;
  type: SubmissionType;
  upvotes: number;
  is_pinned: boolean;
  created_at: string;
  session_token: string | null;
  participant_name?: string | null;
}

const submissionTypes: { value: SubmissionType; label: string; color: string }[] = [
  { value: 'question', label: 'Question', color: 'bg-primary' },
  { value: 'opinion', label: 'Opinion', color: 'bg-accent' },
  { value: 'answer', label: 'Answer', color: 'bg-primary/70' },
  { value: 'suggestion', label: 'Suggestion', color: 'bg-accent/70' },
];

export default function DiscussionRoom() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [meetingId, setMeetingId] = useState<string | null>(null);
  const [meetingStatus, setMeetingStatus] = useState<string>('active');
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [content, setContent] = useState('');
  const [selectedType, setSelectedType] = useState<SubmissionType>('question');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set());
  const sessionToken = getSessionToken();

  useEffect(() => {
    if (!code) return;

    const fetchMeeting = async () => {
      const { data: meeting, error } = await supabase
        .from('meetings')
        .select('id, status')
        .eq('code', code)
        .maybeSingle();

      if (error || !meeting) {
        toast.error('Meeting not found');
        navigate('/join');
        return;
      }

      setMeetingId(meeting.id);
      setMeetingStatus(meeting.status);
    };

    fetchMeeting();
  }, [code, navigate]);

  useEffect(() => {
    if (!meetingId) return;

    const fetchSubmissions = async () => {
      const { data } = await supabase
        .from('submissions')
        .select('*')
        .eq('meeting_id', meetingId)
        .eq('is_hidden', false)
        .order('is_pinned', { ascending: false })
        .order('upvotes', { ascending: false })
        .order('created_at', { ascending: false });

      if (data) {
        // Fetch participant names for submissions
        const sessionTokens = [...new Set(data.map(s => s.session_token).filter(Boolean))];
        
        let participantMap: Record<string, string> = {};
        if (sessionTokens.length > 0) {
          const { data: participants } = await supabase
            .from('participants')
            .select('session_token, display_name')
            .in('session_token', sessionTokens);
          
          if (participants) {
            participantMap = participants.reduce((acc, p) => {
              acc[p.session_token] = p.display_name || 'Anonymous';
              return acc;
            }, {} as Record<string, string>);
          }
        }
        
        const submissionsWithNames = data.map(s => ({
          ...s,
          participant_name: s.session_token ? participantMap[s.session_token] || 'Anonymous' : 'Anonymous'
        }));
        
        setSubmissions(submissionsWithNames as Submission[]);
      }
    };

    fetchSubmissions();

    // Fetch user's votes
    const fetchVotes = async () => {
      const { data } = await supabase
        .from('votes')
        .select('submission_id')
        .eq('session_token', sessionToken);

      if (data) {
        setVotedIds(new Set(data.map(v => v.submission_id)));
      }
    };

    fetchVotes();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('submissions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'submissions',
          filter: `meeting_id=eq.${meetingId}`,
        },
        () => {
          fetchSubmissions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [meetingId, sessionToken]);

  const handleSubmit = async () => {
    if (!content.trim() || !meetingId) return;

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('submissions').insert({
        meeting_id: meetingId,
        content: content.trim(),
        type: selectedType,
        session_token: sessionToken,
      });

      if (error) {
        toast.error('Failed to submit. Please try again.');
      } else {
        setContent('');
        toast.success('Submitted successfully!');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVote = async (submissionId: string) => {
    if (votedIds.has(submissionId)) {
      toast.info('You already voted on this');
      return;
    }

    const { error } = await supabase.from('votes').insert({
      submission_id: submissionId,
      session_token: sessionToken,
    });

    if (error) {
      if (error.code === '23505') {
        toast.info('You already voted on this');
      } else {
        toast.error('Failed to vote');
      }
      return;
    }

    // Update upvote count
    const { error: updateError } = await supabase
      .from('submissions')
      .update({ upvotes: submissions.find(s => s.id === submissionId)!.upvotes + 1 })
      .eq('id', submissionId);

    if (!updateError) {
      setVotedIds(prev => new Set([...prev, submissionId]));
    }
  };

  const pinnedSubmissions = submissions.filter(s => s.is_pinned);
  const regularSubmissions = submissions.filter(s => !s.is_pinned);

  if (meetingStatus === 'ended') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="glass-card rounded-2xl p-8 text-center max-w-md">
          <MessageCircle className="h-12 w-12 text-primary mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Meeting Ended</h1>
          <p className="text-muted-foreground mb-6">
            This meeting has concluded. Thank you for participating!
          </p>
          <Button onClick={() => navigate('/')}>Return Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5 pointer-events-none" />

      <header className="sticky top-0 z-20 glass-card border-b border-border/50 p-4">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <Button variant="ghost" onClick={() => navigate('/')} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Leave
          </Button>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="font-mono">
              {code}
            </Badge>
            {meetingStatus === 'paused' && (
              <Badge variant="destructive">Paused</Badge>
            )}
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="relative z-10 max-w-4xl mx-auto p-4 pb-48">
        {/* Pinned Submissions */}
        {pinnedSubmissions.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
              <Pin className="h-4 w-4" />
              Pinned
            </h2>
            <div className="space-y-3">
              {pinnedSubmissions.map((submission) => (
                <SubmissionCard
                  key={submission.id}
                  submission={submission}
                  onVote={handleVote}
                  hasVoted={votedIds.has(submission.id)}
                  isPinned
                />
              ))}
            </div>
          </div>
        )}

        {/* Regular Submissions */}
        <div className="space-y-3">
          {regularSubmissions.map((submission) => (
            <SubmissionCard
              key={submission.id}
              submission={submission}
              onVote={handleVote}
              hasVoted={votedIds.has(submission.id)}
            />
          ))}
        </div>

        {submissions.length === 0 && (
          <div className="text-center py-12">
            <MessageCircle className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">
              No contributions yet. Be the first to share!
            </p>
          </div>
        )}
      </main>

      {/* Input Section */}
      <div className="fixed bottom-0 left-0 right-0 z-20 glass-card-elevated border-t border-border/50 p-4">
        <div className="max-w-4xl mx-auto space-y-3">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {submissionTypes.map((type) => (
              <Button
                key={type.value}
                variant={selectedType === type.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedType(type.value)}
                className="shrink-0"
              >
                {type.label}
              </Button>
            ))}
          </div>
          <div className="flex gap-2">
            <Textarea
              placeholder={meetingStatus === 'paused' ? 'Submissions paused...' : 'Share your thoughts anonymously...'}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="resize-none min-h-[60px]"
              disabled={meetingStatus === 'paused'}
            />
            <Button
              onClick={handleSubmit}
              disabled={!content.trim() || isSubmitting || meetingStatus === 'paused'}
              size="icon"
              className="h-auto aspect-square"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SubmissionCard({
  submission,
  onVote,
  hasVoted,
  isPinned,
}: {
  submission: Submission;
  onVote: (id: string) => void;
  hasVoted: boolean;
  isPinned?: boolean;
}) {
  const typeInfo = submissionTypes.find((t) => t.value === submission.type);

  return (
    <div
      className={`glass-card rounded-xl p-4 animate-scale-in ${
        isPinned ? 'border-2 border-primary/30' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="secondary" className="text-xs">
              {typeInfo?.label}
            </Badge>
            <span className="text-xs text-muted-foreground">
              by {submission.participant_name || 'Anonymous'}
            </span>
          </div>
          <p className="text-foreground whitespace-pre-wrap break-words">
            {submission.content}
          </p>
        </div>
        <Button
          variant={hasVoted ? 'default' : 'outline'}
          size="sm"
          onClick={() => onVote(submission.id)}
          className={`shrink-0 gap-1 transition-all ${hasVoted ? 'bg-primary text-primary-foreground' : ''}`}
        >
          <ThumbsUp className={`h-4 w-4 ${hasVoted ? 'fill-current' : ''}`} />
          <span>{submission.upvotes}</span>
        </Button>
      </div>
    </div>
  );
}
