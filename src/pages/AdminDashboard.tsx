import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import {
  LogOut,
  Copy,
  Play,
  Pause,
  StopCircle,
  Users,
  MessageCircle,
  Download,
  Pin,
  PinOff,
  EyeOff,
  Trash2,
  QrCode,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { generateMeetingCode } from '@/lib/session';
import { toast } from 'sonner';

type MeetingStatus = 'active' | 'paused' | 'ended';
type SubmissionType = 'question' | 'opinion' | 'answer' | 'suggestion';

interface Meeting {
  id: string;
  code: string;
  title: string;
  status: MeetingStatus;
  participant_count: number;
  created_at: string;
}

interface Submission {
  id: string;
  content: string;
  type: SubmissionType;
  upvotes: number;
  is_pinned: boolean;
  is_hidden: boolean;
  created_at: string;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, isLoading, isAdmin, isAdminLoading, signOut } = useAuth();
  const [activeMeeting, setActiveMeeting] = useState<Meeting | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [participantCount, setParticipantCount] = useState(0);
  const [totalUsersCount, setTotalUsersCount] = useState(0);
  const [meetingTitle, setMeetingTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAdminLoading && (!user || !isAdmin)) {
      navigate('/auth');
    }
  }, [user, isLoading, isAdmin, isAdminLoading, navigate]);

  useEffect(() => {
    if (!user) return;

    const fetchActiveMeeting = async () => {
      const { data } = await supabase
        .from('meetings')
        .select('*')
        .eq('admin_id', user.id)
        .neq('status', 'ended')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        setActiveMeeting(data as Meeting);
      }
    };

    // Fetch total unique users across all meetings for this admin
    const fetchTotalUsers = async () => {
      // Get all meetings for this admin
      const { data: meetings } = await supabase
        .from('meetings')
        .select('id')
        .eq('admin_id', user.id);

      if (meetings && meetings.length > 0) {
        const meetingIds = meetings.map(m => m.id);
        const { count } = await supabase
          .from('participants')
          .select('session_token', { count: 'exact', head: true })
          .in('meeting_id', meetingIds);

        setTotalUsersCount(count || 0);
      }
    };

    fetchActiveMeeting();
    fetchTotalUsers();
  }, [user]);

  useEffect(() => {
    if (!activeMeeting) return;

    const fetchSubmissions = async () => {
      const { data } = await supabase
        .from('submissions')
        .select('*')
        .eq('meeting_id', activeMeeting.id)
        .order('is_pinned', { ascending: false })
        .order('upvotes', { ascending: false })
        .order('created_at', { ascending: false });

      if (data) {
        setSubmissions(data as Submission[]);
      }
    };

    const fetchParticipantCount = async () => {
      const { count } = await supabase
        .from('participants')
        .select('*', { count: 'exact', head: true })
        .eq('meeting_id', activeMeeting.id);

      setParticipantCount(count || 0);
    };

    fetchSubmissions();
    fetchParticipantCount();

    // Real-time subscriptions
    const submissionsChannel = supabase
      .channel('admin-submissions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'submissions',
          filter: `meeting_id=eq.${activeMeeting.id}`,
        },
        () => fetchSubmissions()
      )
      .subscribe();

    const participantsChannel = supabase
      .channel('admin-participants')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'participants',
          filter: `meeting_id=eq.${activeMeeting.id}`,
        },
        () => fetchParticipantCount()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(submissionsChannel);
      supabase.removeChannel(participantsChannel);
    };
  }, [activeMeeting]);

  const createMeeting = async () => {
    if (!user) return;

    setIsCreating(true);

    try {
      const code = generateMeetingCode();
      const { data, error } = await supabase
        .from('meetings')
        .insert({
          admin_id: user.id,
          code,
          title: meetingTitle || 'Untitled Meeting',
        })
        .select()
        .single();

      if (error) {
        toast.error('Failed to create meeting');
        return;
      }

      setActiveMeeting(data as Meeting);
      setMeetingTitle('');
      toast.success('Meeting created successfully!');
    } finally {
      setIsCreating(false);
    }
  };

  const updateMeetingStatus = async (status: MeetingStatus) => {
    if (!activeMeeting) return;

    const updateData: { status: MeetingStatus; ended_at?: string } = { status };
    if (status === 'ended') {
      updateData.ended_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('meetings')
      .update(updateData)
      .eq('id', activeMeeting.id);

    if (error) {
      toast.error('Failed to update meeting');
      return;
    }

    if (status === 'ended') {
      setActiveMeeting(null);
      toast.success('Meeting ended');
    } else {
      setActiveMeeting({ ...activeMeeting, status });
      toast.success(status === 'paused' ? 'Submissions paused' : 'Submissions resumed');
    }
  };

  const togglePin = async (submissionId: string, isPinned: boolean) => {
    const { error } = await supabase
      .from('submissions')
      .update({ is_pinned: !isPinned })
      .eq('id', submissionId);

    if (error) {
      toast.error('Failed to update');
    }
  };

  const toggleHide = async (submissionId: string, isHidden: boolean) => {
    const { error } = await supabase
      .from('submissions')
      .update({ is_hidden: !isHidden })
      .eq('id', submissionId);

    if (error) {
      toast.error('Failed to update');
    }
  };

  const deleteSubmission = async (submissionId: string) => {
    const { error } = await supabase
      .from('submissions')
      .delete()
      .eq('id', submissionId);

    if (error) {
      toast.error('Failed to delete');
    }
  };

  const copyCode = () => {
    if (activeMeeting) {
      navigator.clipboard.writeText(activeMeeting.code);
      toast.success('Code copied to clipboard');
    }
  };

  const exportData = () => {
    if (!activeMeeting || submissions.length === 0) {
      toast.error('No data to export');
      return;
    }

    const csvContent = [
      ['Type', 'Content', 'Upvotes', 'Pinned', 'Created At'].join(','),
      ...submissions
        .filter((s) => !s.is_hidden)
        .map((s) =>
          [
            s.type,
            `"${s.content.replace(/"/g, '""')}"`,
            s.upvotes,
            s.is_pinned,
            s.created_at,
          ].join(',')
        ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `silentvoice-${activeMeeting.code}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Data exported successfully');
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const joinUrl = activeMeeting
    ? `${window.location.origin}/room/${activeMeeting.code}`
    : '';

  if (isLoading || isAdminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5 pointer-events-none" />

      <header className="sticky top-0 z-20 glass-card border-b border-border/50 p-4">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-6 w-6 text-primary" />
            <span className="font-bold text-foreground">Admin Dashboard</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="outline" onClick={handleSignOut} className="gap-2">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto p-4 space-y-6">
        {!activeMeeting ? (
          <Card className="glass-card animate-scale-in">
            <CardHeader>
              <CardTitle>Create a New Meeting</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Meeting Title (optional)</Label>
                <Input
                  id="title"
                  placeholder="e.g., Team Retrospective"
                  value={meetingTitle}
                  onChange={(e) => setMeetingTitle(e.target.value)}
                />
              </div>
              <Button onClick={createMeeting} disabled={isCreating} className="w-full">
                {isCreating ? 'Creating...' : 'Generate Meeting Code'}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Meeting Info Card */}
            <Card className="glass-card animate-scale-in">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Meeting Code</p>
                    <div className="flex items-center gap-2">
                      <span className="text-4xl font-mono font-bold text-foreground tracking-wider">
                        {activeMeeting.code}
                      </span>
                      <Button variant="ghost" size="icon" onClick={copyCode}>
                        <Copy className="h-5 w-5" />
                      </Button>
                      <Dialog open={showQR} onOpenChange={setShowQR}>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <QrCode className="h-5 w-5" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Scan to Join</DialogTitle>
                          </DialogHeader>
                          <div className="flex flex-col items-center gap-4 p-4">
                            <QRCodeSVG value={joinUrl} size={256} />
                            <p className="text-sm text-muted-foreground text-center">
                              Participants can scan this QR code to join the meeting
                            </p>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      {activeMeeting.title}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {activeMeeting.status === 'active' ? (
                      <Button variant="outline" onClick={() => updateMeetingStatus('paused')}>
                        <Pause className="h-4 w-4 mr-2" />
                        Pause
                      </Button>
                    ) : activeMeeting.status === 'paused' ? (
                      <Button variant="outline" onClick={() => updateMeetingStatus('active')}>
                        <Play className="h-4 w-4 mr-2" />
                        Resume
                      </Button>
                    ) : null}
                    <Button variant="destructive" onClick={() => updateMeetingStatus('ended')}>
                      <StopCircle className="h-4 w-4 mr-2" />
                      End Meeting
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats Cards */}
            <div className="grid md:grid-cols-4 gap-4">
              <Card className="glass-card">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-accent/10">
                      <Users className="h-6 w-6 text-accent" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{totalUsersCount}</p>
                      <p className="text-sm text-muted-foreground">Total Users</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-primary/10">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{participantCount}</p>
                      <p className="text-sm text-muted-foreground">Meeting Participants</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-accent/10">
                      <MessageCircle className="h-6 w-6 text-accent" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">
                        {submissions.filter((s) => !s.is_hidden).length}
                      </p>
                      <p className="text-sm text-muted-foreground">Submissions</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-primary/10">
                        <Download className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">Export Data</p>
                        <p className="text-xs text-muted-foreground">Download as CSV</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={exportData}>
                      Export
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Submissions List */}
            <Card className="glass-card">
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle>Submissions</CardTitle>
                <Badge variant={activeMeeting.status === 'active' ? 'default' : 'secondary'}>
                  {activeMeeting.status === 'active' ? 'Live' : 'Paused'}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {submissions.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No submissions yet. Share the meeting code with participants!
                    </p>
                  ) : (
                    submissions.map((submission) => (
                      <div
                        key={submission.id}
                        className={`p-4 rounded-xl border ${
                          submission.is_hidden
                            ? 'bg-muted/50 opacity-50'
                            : submission.is_pinned
                            ? 'bg-primary/5 border-primary/30'
                            : 'bg-card border-border'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="secondary" className="text-xs">
                                {submission.type}
                              </Badge>
                              {submission.is_pinned && (
                                <Badge className="text-xs">Pinned</Badge>
                              )}
                              {submission.is_hidden && (
                                <Badge variant="destructive" className="text-xs">
                                  Hidden
                                </Badge>
                              )}
                              <span className="text-xs text-muted-foreground">
                                {submission.upvotes} votes
                              </span>
                            </div>
                            <p className="text-foreground whitespace-pre-wrap break-words">
                              {submission.content}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => togglePin(submission.id, submission.is_pinned)}
                              title={submission.is_pinned ? 'Unpin' : 'Pin'}
                            >
                              {submission.is_pinned ? (
                                <PinOff className="h-4 w-4" />
                              ) : (
                                <Pin className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => toggleHide(submission.id, submission.is_hidden)}
                              title={submission.is_hidden ? 'Show' : 'Hide'}
                            >
                              <EyeOff className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteSubmission(submission.id)}
                              className="text-destructive hover:text-destructive"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
