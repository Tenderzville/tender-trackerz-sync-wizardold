import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { ArrowUp, MessageSquare, Lock, Pin, Plus, Loader2 } from 'lucide-react';
import { useForumQuestions, useForumReplies, useCreatePost, useToggleVote, useUserVotes, ForumPost } from '@/hooks/useForum';
import { formatDistanceToNow } from 'date-fns';

function ReplyThread({ parentId }: { parentId: number }) {
  const { data: replies = [], isLoading } = useForumReplies(parentId);
  const { data: votes = new Set<number>() } = useUserVotes();
  const toggleVote = useToggleVote();
  const create = useCreatePost();
  const [reply, setReply] = useState('');

  if (isLoading) return <Loader2 className="h-4 w-4 animate-spin" />;

  return (
    <div className="space-y-3 mt-3 pl-4 border-l-2 border-border">
      {replies.map((r) => (
        <div key={r.id} className="flex gap-3">
          <div className="flex flex-col items-center">
            <Button
              size="icon"
              variant={votes.has(r.id) ? 'default' : 'ghost'}
              className="h-8 w-8"
              onClick={() => toggleVote.mutate({ postId: r.id, hasVoted: votes.has(r.id) })}
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
            <span className="text-xs font-semibold">{r.upvotes}</span>
          </div>
          <div className="flex-1">
            <p className="text-sm whitespace-pre-wrap">{r.body}</p>
            <p className="text-xs text-muted-foreground mt-1">{formatDistanceToNow(new Date(r.created_at))} ago</p>
          </div>
        </div>
      ))}
      <div className="flex gap-2">
        <Textarea
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          placeholder="Write a reply..."
          className="text-sm"
          rows={2}
        />
        <Button
          size="sm"
          disabled={!reply.trim() || create.isPending}
          onClick={() => create.mutate({ body: reply, parent_id: parentId }, { onSuccess: () => setReply('') })}
        >
          Reply
        </Button>
      </div>
    </div>
  );
}

function QuestionCard({ q }: { q: ForumPost }) {
  const [showReplies, setShowReplies] = useState(false);
  const { data: votes = new Set<number>() } = useUserVotes();
  const toggleVote = useToggleVote();

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex gap-4">
          <div className="flex flex-col items-center">
            <Button
              size="icon"
              variant={votes.has(q.id) ? 'default' : 'outline'}
              onClick={() => toggleVote.mutate({ postId: q.id, hasVoted: votes.has(q.id) })}
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
            <span className="text-sm font-semibold mt-1">{q.upvotes}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {q.is_pinned && <Pin className="h-3 w-3 text-primary" />}
              {q.is_locked && <Lock className="h-3 w-3 text-muted-foreground" />}
              <h3 className="font-semibold text-base">{q.title}</h3>
            </div>
            <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{q.body}</p>
            <div className="flex items-center gap-2 flex-wrap mt-2">
              {q.tags.map((t) => (
                <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
              ))}
              <span className="text-xs text-muted-foreground ml-auto">
                {formatDistanceToNow(new Date(q.created_at))} ago
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2"
              onClick={() => setShowReplies(!showReplies)}
            >
              <MessageSquare className="h-4 w-4 mr-1" />
              {showReplies ? 'Hide' : 'Show'} replies
            </Button>
            {showReplies && <ReplyThread parentId={q.id} />}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function CommunityPage() {
  const { data: questions = [], isLoading } = useForumQuestions();
  const create = useCreatePost();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tagsInput, setTagsInput] = useState('');

  const submit = () => {
    const tags = tagsInput.split(',').map((t) => t.trim()).filter(Boolean);
    create.mutate(
      { title, body, tags },
      {
        onSuccess: () => {
          setOpen(false);
          setTitle('');
          setBody('');
          setTagsInput('');
        },
      }
    );
  };

  return (
    <div className="container mx-auto max-w-4xl py-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Community Q&A</h1>
          <p className="text-sm text-muted-foreground">
            Ask questions, share insights, learn from fellow Kenyan suppliers and buyers.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-1" /> Ask Question</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ask the community</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Question title" value={title} onChange={(e) => setTitle(e.target.value)} />
              <Textarea
                placeholder="Provide details — what have you tried? what's the context?"
                rows={5}
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
              <Input
                placeholder="Tags (comma-separated, e.g. AGPO, e-GP, bid-writing)"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button onClick={submit} disabled={!title.trim() || !body.trim() || create.isPending}>
                {create.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                Post Question
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : questions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium">No questions yet</p>
            <p className="text-sm mt-1">Be the first to start a conversation.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {questions.map((q) => <QuestionCard key={q.id} q={q} />)}
        </div>
      )}
    </div>
  );
}
