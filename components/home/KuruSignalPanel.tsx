import { Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

export function KuruSignalPanel() {
  return (
    <section data-reveal className="relative z-10 -mt-12 mb-24 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-screen-2xl">
        <Card className="kuru-panel overflow-hidden rounded-[2rem] p-5 sm:p-7">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <Badge variant="muted" className="mb-4 w-fit">kuru signal</Badge>
              <h2 className="font-display text-5xl leading-none text-white sm:text-7xl">
                Anime discovery, refined.
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-kuro-muted sm:text-base">
              Browse cleanly, track your watch progress, and keep every title close without breaking the mood.
            </p>
          </div>
        </Card>
        <div className="mt-5 flex items-center justify-center gap-3 text-center text-xs uppercase tracking-[0.24em] text-kuro-dim">
          <Sparkles size={14} className="text-kuro-primary" />
          Kuru.live keeps the anime experience clean and focused
        </div>
      </div>
    </section>
  );
}
