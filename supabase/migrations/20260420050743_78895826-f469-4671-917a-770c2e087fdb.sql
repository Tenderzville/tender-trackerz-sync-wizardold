-- Forum posts table (questions + replies in single threaded feed)
CREATE TABLE public.forum_posts (
  id BIGSERIAL PRIMARY KEY,
  parent_id BIGINT REFERENCES public.forum_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  title TEXT,
  body TEXT NOT NULL,
  upvotes INTEGER NOT NULL DEFAULT 0,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  is_locked BOOLEAN NOT NULL DEFAULT false,
  tags TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT forum_top_level_needs_title CHECK (parent_id IS NOT NULL OR (title IS NOT NULL AND length(title) > 0))
);

CREATE INDEX idx_forum_posts_parent ON public.forum_posts(parent_id);
CREATE INDEX idx_forum_posts_created ON public.forum_posts(created_at DESC);
CREATE INDEX idx_forum_posts_user ON public.forum_posts(user_id);

-- Votes table
CREATE TABLE public.forum_votes (
  id BIGSERIAL PRIMARY KEY,
  post_id BIGINT NOT NULL REFERENCES public.forum_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

CREATE INDEX idx_forum_votes_post ON public.forum_votes(post_id);

-- Enable RLS
ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_votes ENABLE ROW LEVEL SECURITY;

-- forum_posts policies
CREATE POLICY "Anyone authenticated can view posts"
  ON public.forum_posts FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Users can create posts"
  ON public.forum_posts FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts"
  ON public.forum_posts FOR UPDATE
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts"
  ON public.forum_posts FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins manage all posts"
  ON public.forum_posts FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- forum_votes policies
CREATE POLICY "Anyone authenticated can view votes"
  ON public.forum_votes FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Users can vote"
  ON public.forum_votes FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own vote"
  ON public.forum_votes FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Trigger: keep upvotes count in sync
CREATE OR REPLACE FUNCTION public.sync_forum_upvotes()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.forum_posts SET upvotes = upvotes + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.forum_posts SET upvotes = GREATEST(0, upvotes - 1) WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER forum_votes_sync
AFTER INSERT OR DELETE ON public.forum_votes
FOR EACH ROW EXECUTE FUNCTION public.sync_forum_upvotes();

-- Trigger: updated_at on posts
CREATE TRIGGER forum_posts_updated_at
BEFORE UPDATE ON public.forum_posts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();