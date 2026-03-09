import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface LearningGuide {
  id: number;
  user_id: string;
  title: string;
  title_sw: string | null;
  description: string;
  description_sw: string | null;
  content: string;
  content_sw: string | null;
  category: string;
  read_time: string;
  is_published: boolean;
  is_approved: boolean;
  created_at: string;
}

export interface LearningTemplate {
  id: number;
  user_id: string;
  title: string;
  title_sw: string | null;
  description: string | null;
  description_sw: string | null;
  format: string;
  category: string;
  file_url: string;
  is_published: boolean;
  is_approved: boolean;
  download_count: number;
  created_at: string;
}

export interface LearningCourse {
  id: number;
  user_id: string;
  title: string;
  title_sw: string | null;
  description: string | null;
  description_sw: string | null;
  level: string;
  modules: number;
  duration: string;
  duration_sw: string | null;
  topics: string[];
  course_url: string | null;
  is_published: boolean;
  is_approved: boolean;
  enrollment_count: number;
  created_at: string;
}

export function useLearningGuides() {
  return useQuery({
    queryKey: ['learning-guides'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('learning_guides')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as LearningGuide[];
    },
  });
}

export function useLearningTemplates() {
  return useQuery({
    queryKey: ['learning-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('learning_templates')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as LearningTemplate[];
    },
  });
}

export function useLearningCourses() {
  return useQuery({
    queryKey: ['learning-courses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('learning_courses')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as LearningCourse[];
    },
  });
}

export function useSubmitGuide() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (guide: {
      title: string; title_sw?: string; description: string; description_sw?: string;
      content: string; content_sw?: string; category: string; read_time: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase.from('learning_guides').insert({
        ...guide, user_id: user.id, payment_status: 'pending',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Guide Submitted', description: 'Your guide is pending review and payment.' });
      queryClient.invalidateQueries({ queryKey: ['learning-guides'] });
    },
    onError: (err: Error) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });
}

export function useSubmitTemplate() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (template: {
      title: string; title_sw?: string; description?: string; description_sw?: string;
      format: string; category: string; file_url: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase.from('learning_templates').insert({
        ...template, user_id: user.id, payment_status: 'pending',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Template Submitted', description: 'Your template is pending review and payment.' });
      queryClient.invalidateQueries({ queryKey: ['learning-templates'] });
    },
    onError: (err: Error) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });
}

export function useSubmitCourse() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (course: {
      title: string; title_sw?: string; description?: string; description_sw?: string;
      level: string; modules: number; duration: string; duration_sw?: string;
      topics: string[]; course_url?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase.from('learning_courses').insert({
        ...course, user_id: user.id, payment_status: 'pending',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Course Submitted', description: 'Your course is pending review and payment.' });
      queryClient.invalidateQueries({ queryKey: ['learning-courses'] });
    },
    onError: (err: Error) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });
}
