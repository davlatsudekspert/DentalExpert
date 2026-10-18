import { useEffect, useRef, useState } from 'react';
import {
  Anchor, ArrowLeft, Baby, Bandage, ChevronRight, Clock, Droplet, Grid3x3, HeartPulse,
  Info, ShieldPlus, Siren, Sparkles, TriangleAlert, Waypoints, Wind, Zap,
  type LucideIcon,
} from 'lucide-react';
import { GUIDES, GUIDE_UI, type Guide, type GuideIcon, type GuideLang } from './patientGuides';
import './guides.css';

const ICONS: Record<GuideIcon, LucideIcon> = {
  brush: Sparkles,
  floss: Waypoints,
  pain: Zap,
  extraction: Bandage,
  filling: ShieldPlus,
  gums: Droplet,
  child: Baby,
  pregnancy: HeartPulse,
  braces: Grid3x3,
  implant: Anchor,
  breath: Wind,
  trauma: Siren,
};

const pad = (n: number) => String(n).padStart(2, '0');

function ReadTime({ minutes, lang }: { minutes: number; lang: GuideLang }) {
  return (
    <span className="pg-time">
      <Clock size={14} strokeWidth={2} aria-hidden="true" />
      {minutes} {GUIDE_UI.minRead[lang]}
    </span>
  );
}

function GuideView({ guide, index, lang, onBack }: { guide: Guide; index: number; lang: GuideLang; onBack: () => void }) {
  const Icon = ICONS[guide.icon];
  const backRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    backRef.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onBack(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onBack]);

  return (
    <article className="pg-guide" aria-labelledby={`pg-h-${guide.id}`}>
      <button ref={backRef} type="button" className="pg-back" data-back onClick={onBack}>
        <ArrowLeft size={20} strokeWidth={2} aria-hidden="true" />
        <span>{GUIDE_UI.back[lang]}</span>
      </button>

      <header className="pg-guide-head">
        <span className="pg-icon pg-icon-lg" aria-hidden="true"><Icon size={26} strokeWidth={1.8} /></span>
        <div className="pg-guide-meta">
          <span className="pg-num">{pad(index + 1)} / {pad(GUIDES.length)}</span>
          <ReadTime minutes={guide.minutes} lang={lang} />
        </div>
        <h2 id={`pg-h-${guide.id}`} className="pg-guide-title">{guide.title[lang]}</h2>
        <p className="pg-intro">{guide.intro[lang]}</p>
      </header>

      {guide.sections.map((sec, si) => (
        <section key={si} className="pg-section">
          <h3 className="pg-section-title">{sec.title[lang]}</h3>
          {sec.kind === 'steps' ? (
            <ol className="pg-steps">
              {sec.items.map((it, i) => (
                <li key={i}><span className="pg-step-n" aria-hidden="true">{i + 1}</span><span>{it[lang]}</span></li>
              ))}
            </ol>
          ) : (
            <ul className="pg-bullets">
              {sec.items.map((it, i) => <li key={i}>{it[lang]}</li>)}
            </ul>
          )}
        </section>
      ))}

      <aside className="pg-warn" role="note" aria-labelledby={`pg-w-${guide.id}`}>
        <h3 id={`pg-w-${guide.id}`} className="pg-warn-title">
          <TriangleAlert size={20} strokeWidth={2} aria-hidden="true" />
          <span>{GUIDE_UI.redFlags[lang]}</span>
        </h3>
        <ul className="pg-warn-list">
          {guide.redFlags.map((f, i) => <li key={i}>{f[lang]}</li>)}
        </ul>
      </aside>

      <footer className="pg-note">
        <Info size={18} strokeWidth={2} aria-hidden="true" />
        <p>{GUIDE_UI.disclaimer[lang]}</p>
      </footer>

      <button type="button" className="pg-back pg-back-bottom" onClick={onBack}>
        <ArrowLeft size={20} strokeWidth={2} aria-hidden="true" />
        <span>{GUIDE_UI.allGuides[lang]}</span>
      </button>
    </article>
  );
}

export default function PatientGuides({ lang }: { lang: 'uz' | 'ru' | 'en' }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const lastCard = useRef<string | null>(null);

  const scrollTop = () => {
    const el = rootRef.current;
    if (el && el.getBoundingClientRect().top < 0) el.scrollIntoView({ block: 'start' });
  };

  const open = (id: string) => {
    lastCard.current = id;
    setOpenId(id);
    requestAnimationFrame(scrollTop);
  };

  const back = () => {
    setOpenId(null);
    requestAnimationFrame(() => {
      const card = rootRef.current?.querySelector<HTMLButtonElement>(`[data-guide="${lastCard.current}"]`);
      card?.focus({ preventScroll: true });
      card?.scrollIntoView({ block: 'center' });
    });
  };

  const index = openId ? GUIDES.findIndex(g => g.id === openId) : -1;
  const guide = index >= 0 ? GUIDES[index] : null;

  return (
    <div className="pg-root" lang={lang} ref={rootRef}>
      {guide ? (
        <GuideView guide={guide} index={index} lang={lang} onBack={back} />
      ) : (
        <>
          <header className="pg-head">
            <span className="pg-eyebrow">{GUIDE_UI.eyebrow[lang]}</span>
            <h1 className="pg-title">{GUIDE_UI.heading[lang]}</h1>
            <p className="pg-lead">{GUIDE_UI.lead[lang]}</p>
          </header>
          <ul className="pg-grid">
            {GUIDES.map((g, i) => {
              const Icon = ICONS[g.icon];
              return (
                <li key={g.id}>
                  <button type="button" className="pg-card" data-guide={g.id} onClick={() => open(g.id)}>
                    <span className="pg-icon" aria-hidden="true"><Icon size={22} strokeWidth={1.8} /></span>
                    <span className="pg-card-body">
                      <span className="pg-card-title">{g.title[lang]}</span>
                      <span className="pg-card-sum">{g.summary[lang]}</span>
                    </span>
                    <span className="pg-card-foot">
                      <span className="pg-num" aria-hidden="true">{pad(i + 1)}</span>
                      <ReadTime minutes={g.minutes} lang={lang} />
                      <ChevronRight className="pg-chev" size={20} strokeWidth={2} aria-hidden="true" />
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="pg-note pg-note-list">
            <Info size={18} strokeWidth={2} aria-hidden="true" />
            <span>{GUIDE_UI.disclaimer[lang]}</span>
          </p>
        </>
      )}
    </div>
  );
}
