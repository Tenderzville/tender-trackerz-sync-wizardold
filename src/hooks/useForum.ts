import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ForumPost {
  id: number;
  parent_id: number | null;
  user_id: string;
  title: string | null;
  body: string;
  upvotes: number;
  is_pinned: boolean;
  is_locked: boolean;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export function useForumQuestions() {
  return useQuery({
    queryKey: ['forum', 'questions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('forum_posts')
        .select('*')
        .is('parent_id', null)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data || []) as ForumPost[];
    },
  });
}

export function useForumReplies(parentId: number | null) {
  return useQuery({
    queryKey: ['forum', 'replies', parentId],
    enabled: !!parentId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('forum_posts')
        .select('*')
        .eq('parent_id', parentId!)
        .order('upvotes', { ascending: false })
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data || []) as ForumPost[];
    },
  });
}

export function useUserVotes() {
  return useQuery({
    queryKey: ['forum', 'my-votes'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return new Set<number>();
      const { data, error } = await supabase
        .from('forum_votes')
        .select('post_id')
        .eq('user_id', user.id);
      if (error) throw error;
      return new Set((data || []).map((v) => v.post_id as number));
    },
  });
}

export function useCreatePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { title?: string; body: string; parent_id?: number; tags?: string[] }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Sign in required');
      const { error } = await supabase.from('forum_posts').insert({
        user_id: user.id,
        title: input.title ?? null,
        body: input.body,
        parent_id: input.parent_id ?? null,
        tags: input.tags ?? [],
      });
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['forum', 'questions'] });
      if (vars.parent_id) qc.invalidateQueries({ queryKey: ['forum', 'replies', vars.parent_id] });
      toast.success(vars.parent_id ? 'Reply posted' : 'Question posted');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useToggleVote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId, hasVoted }: { postId: number; hasVoted: boolean }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Sign in required');
      if (hasVoted) {
        const { error } = await supabase.from('forum_votes').delete().eq('post_id', postId).eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('forum_votes').insert({ post_id: postId, user_id: user.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['forum'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
