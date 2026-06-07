import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy',
  description: 'Kuru.live privacy information.',
};

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Your space"
      title="Privacy"
      intro="Kuru.live is designed to remember only what helps your viewing experience feel continuous."
      sections={[
        ['What is remembered', 'Your saved titles, viewing progress, and interface preferences may be stored on your device so you can continue where you left off.'],
        ['What you control', 'You can remove saved titles and clear site data through your browser at any time.'],
        ['External destinations', 'Some playback or media links may open content provided by other services. Their own privacy terms apply when you visit them.'],
        ['Changes', 'This notice may evolve as Kuru.live grows. Material updates will be reflected on this page.'],
      ]}
    />
  );
}

function LegalPage({ eyebrow, title, intro, sections }: {
  eyebrow: string;
  title: string;
  intro: string;
  sections: Array<[string, string]>;
}) {
  return (
    <main className="min-h-screen">
      <section className="page-hero">
        <div className="relative mx-auto max-w-4xl" data-reveal>
          <p className="micro-label mb-5">{eyebrow}</p>
          <h1 className="font-display text-7xl leading-none text-white sm:text-9xl">{title}</h1>
          <p className="mt-6 text-lg leading-8 text-kuro-muted">{intro}</p>
        </div>
      </section>
      <section className="px-4 pb-24 sm:px-6">
        <div className="content-card mx-auto max-w-4xl rounded-[2rem] p-7 sm:p-10" data-reveal>
          {sections.map(([heading, copy]) => (
            <div key={heading} className="border-b border-white/8 py-7 first:pt-0 last:border-0 last:pb-0">
              <h2 className="font-display text-3xl text-white">{heading}</h2>
              <p className="mt-2 text-sm leading-7 text-kuro-muted">{copy}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
