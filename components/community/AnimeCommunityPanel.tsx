'use client';

import { useEffect, useState } from 'react';
import { MessageCircle, ThumbsDown, ThumbsUp, Trophy } from 'lucide-react';
import {
  addAnimeComment,
  getAnimeCommunity,
  getViewerProgress,
  timeSince,
  toggleAnimeReaction,
  type AnimeCommunityEntry,
  type ViewerProgress,
} from '@/lib/utils';
import { useAuthStore } from '@/store';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface AnimeCommunityPanelProps {
  animeId: number | string;
  title: string;
  description: string;
}

const emptyProgress: ViewerProgress = {
  xp: 0,
  level: 1,
  currentLevelXp: 0,
  nextLevelXp: 120,
  progressPercent: 0,
  watchedCount: 0,
  watchedEpisodes: {},
};

export function AnimeCommunityPanel({ animeId, title, description }: AnimeCommunityPanelProps) {
  const user = useAuthStore(state => state.user);
  const [community, setCommunity] = useState<AnimeCommunityEntry>(() => getAnimeCommunity(animeId));
  const [viewerProgress, setViewerProgress] = useState<ViewerProgress>(emptyProgress);
  const [comment, setComment] = useState('');

  useEffect(() => {
    setCommunity(getAnimeCommunity(animeId));
    setViewerProgress(getViewerProgress());
  }, [animeId]);

  const handleReaction = (reaction: 'like' | 'dislike') => {
    setCommunity(toggleAnimeReaction(animeId, reaction));
  };

  const handleComment = () => {
    const next = addAnimeComment(animeId, comment, user?.name || 'Kuru viewer');
    setCommunity(next);
    setComment('');
  };

  return (
    <section className="mt-10 grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
      <Card className="overflow-hidden">
        <CardHeader>
          <Badge className="w-fit">anime description</Badge>
          <CardTitle>{title}</CardTitle>
          <CardDescription>
            Community reactions, comments, and your watch progress live here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-7 text-kuro-muted">
            {description || 'No description is available for this anime yet.'}
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button
              type="button"
              onClick={() => handleReaction('like')}
              variant={community.viewerReaction === 'like' ? 'default' : 'outline'}
              size="sm"
              className="rounded-full"
            >
              <ThumbsUp size={15} />
              Like {community.likes}
            </Button>
            <Button
              type="button"
              onClick={() => handleReaction('dislike')}
              variant={community.viewerReaction === 'dislike' ? 'default' : 'outline'}
              size="sm"
              className="rounded-full"
            >
              <ThumbsDown size={15} />
              Dislike {community.dislikes}
            </Button>
            <Badge variant="muted" className="gap-2 px-4">
              <MessageCircle size={14} />
              {community.comments.length} comments
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader>
          <Badge variant="outline" className="w-fit gap-2">
            <Trophy size={14} />
            watched xp
          </Badge>
          <CardTitle>Level {viewerProgress.level}</CardTitle>
          <CardDescription>
            {viewerProgress.watchedCount} watched episodes counted.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-3xl border border-white/10 bg-black/30 p-4">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-kuro-dim">total xp</p>
                <p className="mt-1 font-display text-5xl leading-none text-white">{viewerProgress.xp}</p>
              </div>
              <p className="text-xs text-kuro-muted">
                {viewerProgress.currentLevelXp}/{viewerProgress.nextLevelXp} XP
              </p>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-white shadow-red-glow transition-all"
                style={{ width: `${viewerProgress.progressPercent}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Comments</CardTitle>
          <CardDescription>Leave a note for this title. Comments are saved on this device.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <textarea
              value={comment}
              onChange={event => setComment(event.target.value)}
              maxLength={500}
              rows={3}
              placeholder="Write your thoughts..."
              className="min-h-24 w-full resize-none rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-kuro-dim focus:border-white/40 focus:ring-4 focus:ring-white/10"
            />
            <Button type="button" onClick={handleComment} disabled={!comment.trim()} className="self-end rounded-full">
              Post comment
            </Button>
          </div>

          <div className="mt-6 space-y-3">
            {community.comments.length ? community.comments.map(item => (
              <div key={item.id} className="rounded-3xl border border-white/10 bg-white/[0.035] p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-bold text-white">{item.author}</p>
                  <p className="text-xs text-kuro-dim">{timeSince(item.createdAt)}</p>
                </div>
                <p className="mt-2 text-sm leading-6 text-kuro-muted">{item.body}</p>
              </div>
            )) : (
              <div className="rounded-3xl border border-dashed border-white/10 p-6 text-center text-sm text-kuro-muted">
                No comments yet. Start the thread for this anime.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
