import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms',
  description: 'Kuru.live terms of use.',
};

export default function TermsPage() {
  const sections = [
    ['Use of Kuru.live', 'Use the site for personal discovery and viewing. Do not misuse, disrupt, scrape, or attempt to bypass protections around the experience.'],
    ['Availability', 'Titles, episodes, and features can change or become unavailable without notice. Kuru.live does not guarantee uninterrupted access to every item.'],
    ['Content ownership', 'Names, artwork, video, and related media remain the property of their respective rights holders.'],
    ['Your responsibility', 'You are responsible for using Kuru.live in accordance with the laws and viewing requirements that apply where you live.'],
  ];

  return (
    <main className="min-h-screen">
      <section className="page-hero">
        <div className="relative mx-auto max-w-4xl" data-reveal>
          <p className="micro-label mb-5">The house rules</p>
          <h1 className="font-display text-7xl leading-none text-white sm:text-9xl">Terms</h1>
          <p className="mt-6 text-lg leading-8 text-kuro-muted">
            A short, plain-language guide to using Kuru.live responsibly.
          </p>
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
