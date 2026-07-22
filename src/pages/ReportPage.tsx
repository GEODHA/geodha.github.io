import { useState, useRef, useCallback } from 'react';
import {
  CheckCircle, ChevronDown, ChevronUp,
  FileText, Phone, Users, HeartHandshake, Lightbulb,
  Shield, MessageCircle, Layers, Loader2,
  Upload, X, ImageIcon, Smartphone,
} from 'lucide-react';
import StoreButtons from '@/components/StoreButtons';
import { WHATSAPP_COMMUNITY_URL } from '@/config/community';
import { Link } from 'react-router-dom';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { signInAnonymously } from 'firebase/auth';
import { storage, auth } from '@/lib/firebase';

const WEB3FORMS_KEY = '445de55d-332c-4925-8ad4-94e0daff1929';

// ── Lazy anonymous auth — only called if the user uploads images ──────────────

async function ensureAnonAuth() {
  if (auth.currentUser) return;
  await signInAnonymously(auth);
}

// ── Image helpers ─────────────────────────────────────────────────────────────

const MAX_FILES  = 5;
const MAX_MB     = 10;

async function uploadReportImage(file: File, batchId: string): Promise<string> {
  await ensureAnonAuth();
  const safeName  = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  const storageRef = ref(storage, `report-uploads/${batchId}/${safeName}`);
  const snap      = await uploadBytes(storageRef, file);
  return getDownloadURL(snap.ref);
}

// ── ACTION CARDS ──────────────────────────────────────────────────────────────

interface ActionCardDef {
  id: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  title: string;
  description: string;
  type: 'action' | 'expand';
  ctaText: string;
  href?: string;
  contentIntro?: string;
  contentItems?: string[];
  contentOutro?: string;
}

const actionCards: ActionCardDef[] = [
  {
    id: 'bbmp_sahaaya',
    icon: FileText,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    title: 'Submit an Official Complaint',
    description: 'File a formal grievance with the GBA through Namma Bengaluru (Sahaaya 2.0) for official tracking and resolution.',
    type: 'expand',
    ctaText: 'How to submit',
    contentIntro: 'File a formal complaint through Namma Bengaluru Sahaaya 2.0:',
    contentItems: [
      'Visit nammabengaluru.org.in or download the Namma Bengaluru (Sahaaya 2.0) app',
      'Select "Solid Waste Management" as the complaint category',
      'Describe the issue, upload photos, and select the location',
      'Track resolution status on the same portal',
      'You will receive an SMS with a complaint ID for follow-up',
      'Alternatively, call the GBA helpline: 1533',
    ],
  },
  {
    id: 'ward_marshall',
    icon: Phone,
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
    title: 'Civic Hotline',
    description: 'If there is no response to your complaint or no action taken, call the GBA helpline at 1533 to escalate and get the direct contact of your ward marshal.',
    type: 'action',
    ctaText: 'Call GBA Helpline',
    href: 'tel:1533',
  },
  {
    id: 'volunteer_orgs',
    icon: Users,
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
    title: 'Stuck? Get Help For Escalating Issues',
    description: 'If your complaint is being ignored or you are not getting a response from authorities, Broseph Foundation volunteers will follow up and escalate on your behalf.',
    type: 'action',
    ctaText: 'Visit broseph.in',
    href: 'https://broseph.in/contact.html',
  },
  {
    id: 'volunteer_cleanups',
    icon: HeartHandshake,
    iconBg: 'bg-cyan-100',
    iconColor: 'text-cyan-600',
    title: 'Volunteer for Cleanups',
    description: 'Join cleanup drives run by organisations active across Bengaluru. Find events near you and connect with other volunteers.',
    type: 'action',
    ctaText: 'Find cleanup drives',
    href: '/volunteer',
  },
  {
    id: 'waste_solutions',
    icon: Lightbulb,
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    title: 'Waste Management Solutions',
    description: 'There are many infrastructure options such as Kasa Kiosks, Dry Waste Collection Centres, and composting. Learn more about solutions on our blog.',
    type: 'action',
    ctaText: 'Read the blog',
    href: '/blog',
  },
  {
    id: 'legal_rights',
    icon: Shield,
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    title: 'Know Your Rights',
    description: 'Waste rules, constitutional rights, Karnataka HC rulings, and applicable fines.',
    type: 'expand',
    ctaText: 'View legal provisions',
    contentIntro: 'Key legal provisions relevant to waste management:',
    contentItems: [
      'Article 21 — Right to a clean environment (Supreme Court interpretation)',
      'SWM Rules 2026 — In force from April 1, 2026; mandates 4-stream source segregation and financial penalties for non-compliance',
      'Karnataka HC — Has directed civic bodies to ensure scientific disposal of waste',
      'GBA Bye-laws — Fines up to ₹25,000 for open dumping',
      'Open burning — Fineable offence under KSPCB and SWM Rules',
    ],
  },
  {
    id: 'community_group',
    icon: MessageCircle,
    iconBg: 'bg-indigo-100',
    iconColor: 'text-indigo-600',
    title: 'Form a Community Group',
    description: 'Organise your neighbours to collectively tackle recurring waste issues.',
    type: 'expand',
    ctaText: 'How to get started',
    contentIntro: 'Steps to form an effective community group:',
    contentItems: [
      'Gather 5 to 10 interested residents from your area',
      'Create a WhatsApp or Telegram group for coordination',
      'Document recurring waste spots with GEODHA reports',
      'Attend your ward office public grievance meeting, held every Wednesday, and present your evidence',
      'Coordinate with your ward marshal for regular pickups',
    ],
    contentOutro: 'Community pressure is the most effective way to resolve recurring issues.',
  },
  {
    id: 'segregation_guide',
    icon: Layers,
    iconBg: 'bg-green-100',
    iconColor: 'text-green-700',
    title: 'Segregation & Disposal Guide',
    description: 'Learn the 4-stream segregation rules for Bengaluru and how to responsibly dispose of clothes, e-waste, furniture, and other hard-to-recycle items.',
    type: 'action',
    ctaText: 'Read the guide',
    href: '/guide',
  },
];

// ── COMPONENT ─────────────────────────────────────────────────────────────────

const ReportPage = () => {
  const [description, setDescription]           = useState('');
  const [location, setLocation]                 = useState('');
  const [contact, setContact]                   = useState('');
  const [submitting, setSubmitting]             = useState(false);
  const [submitted, setSubmitted]               = useState(false);
  const [error, setError]                       = useState('');
  const [descriptionError, setDescriptionError] = useState(false);
  const [contactError, setContactError]         = useState(false);
  const [expandedCards, setExpandedCards]       = useState<Set<string>>(new Set());

  // Image upload state
  const [uploads, setUploads]       = useState<{ file: File; preview: string }[]>([]);
  const [uploading, setUploading]   = useState(false);
  const [imageError, setImageError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setImageError('');
    const picked = Array.from(e.target.files ?? []);
    e.target.value = '';

    const tooBig = picked.filter((f) => f.size > MAX_MB * 1024 * 1024);
    if (tooBig.length) {
      setImageError(`Each photo must be under ${MAX_MB} MB. ${tooBig.map((f) => f.name).join(', ')} ${tooBig.length > 1 ? 'are' : 'is'} too large.`);
      return;
    }

    setUploads((prev) => {
      const combined = [...prev, ...picked.map((f) => ({ file: f, preview: URL.createObjectURL(f) }))];
      if (combined.length > MAX_FILES) {
        setImageError(`You can attach up to ${MAX_FILES} photos.`);
        return prev;
      }
      return combined;
    });
  }, []);

  const removeUpload = (i: number) => {
    setUploads((prev) => {
      URL.revokeObjectURL(prev[i].preview);
      return prev.filter((_, idx) => idx !== i);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) { setDescriptionError(true); return; }
    if (!contact.trim())     { setContactError(true);     return; }

    setSubmitting(true);
    setUploading(uploads.length > 0);
    setError('');

    try {
      // Upload images first (lazy anon auth only if needed)
      let imageUrls: string[] = [];
      if (uploads.length > 0) {
        const batchId = `${Date.now()}`;
        imageUrls = await Promise.all(uploads.map((u) => uploadReportImage(u.file, batchId)));
      }
      setUploading(false);

      const body: Record<string, string> = {
        access_key:  WEB3FORMS_KEY,
        subject:     'New Problem Report — GEODHA',
        description,
        location,
        contact,
      };
      if (imageUrls.length > 0) {
        body.images = imageUrls.join('\n');
      }

      const res  = await fetch('https://api.web3forms.com/submit', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body:    JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
        window.scrollTo(0, 0);
      } else {
        setError('Something went wrong. Please try again or email us at contact@geodha.org.');
      }
    } catch (err) {
      const msg = (err as Error).message ?? '';
      if (msg.includes('storage') || msg.includes('upload') || msg.includes('auth')) {
        setError('Could not upload your photos. Please check your connection and try again, or submit without photos.');
      } else {
        setError('Could not send your report. Please check your connection and try again.');
      }
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  };

  const resetForm = () => {
    setSubmitted(false);
    setDescription('');
    setLocation('');
    setContact('');
    setError('');
    setDescriptionError(false);
    setContactError(false);
    uploads.forEach((u) => URL.revokeObjectURL(u.preview));
    setUploads([]);
    setImageError('');
  };

  const toggleCard = (id: string) => {
    setExpandedCards(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center py-16">
          <div className="flex justify-center mb-6">
            <CheckCircle className="h-16 w-16 text-primary" />
          </div>
          <h2
            className="text-3xl font-bold text-foreground mb-3"
            style={{ fontFamily: "'Archivo', sans-serif" }}
          >
            Report received
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-6">
            Thank you for your report. We will verify the information and follow up by adding it to the civic dashboard, coordinating with the relevant authorities, or reaching out to you directly. You can also join our WhatsApp group to discuss directly with us.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-3">
            <a
              href={WHATSAPP_COMMUNITY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#25D366] text-white text-md font-semibold rounded-md hover:bg-[#1ebe5d] transition-colors"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.117.549 4.107 1.508 5.84L0 24l6.335-1.482A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.885 0-3.651-.51-5.17-1.399l-.371-.22-3.762.879.921-3.665-.243-.386A9.937 9.937 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
              </svg>
              Join WhatsApp Community
            </a>
            
          </div>
          <span
            onClick={resetForm}
            className="text-primary underline cursor-pointer pt-2.5"
          >
            Explore other solutions
          </span>
        </div>
      </div>
    );
  }

  const inputCls = 'w-full px-4 py-3 rounded-md border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary';

  return (
    <div className="min-h-screen bg-background">

      {/* Page header */}
      <div className="border-b-[3px] border-ink bg-paper">
        <div className="container px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-4xl font-black tracking-[-0.02em] text-foreground mb-3">
            Report a Problem
          </h1>
          <p className="text-muted-foreground leading-relaxed max-w-2xl">
            Tell us more about a problem (garbage related) you are facing. We will verify the information and add it to the civic dashboard, coordinate with authorities, or contact you about how to solve it. Your identity will remain confidential.
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="container px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-xl mx-auto">
          <form onSubmit={handleSubmit} noValidate className="space-y-6">

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-semibold text-foreground mb-1">
                Describe the problem <span className="text-[#EF4444]">*</span>
              </label>
              <p className="text-xs text-muted-foreground mb-3">
                What is the issue? How long has it been there? How severe is it?
              </p>
              <textarea
                id="description"
                value={description}
                onChange={(e) => { setDescription(e.target.value); setDescriptionError(false); }}
                rows={5}
                placeholder="e.g. There is a large illegal garbage dump near the entrance to our street. It has been there for over two weeks and is attracting stray animals."
                className={`${inputCls} resize-none ${descriptionError ? 'border-[#EF4444]' : 'border-border'}`}
              />
              {descriptionError && <p className="text-xs text-[#EF4444] mt-1">A description is required.</p>}
            </div>

            {/* Location */}
            <div>
              <label htmlFor="location" className="block text-sm font-semibold text-foreground mb-1">
                Where are you located?
              </label>
              <p className="text-xs text-muted-foreground mb-3">
                Your area, street, ward, or nearest landmark.
              </p>
              <input
                id="location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Near Konanakunte Circle, Bannerghatta Road, Ward 173"
                className={`${inputCls} border-border`}
              />
            </div>

            {/* Contact */}
            <div>
              <label htmlFor="contact" className="block text-sm font-semibold text-foreground mb-1">
                Contact Details <span className="text-[#EF4444]">*</span>
              </label>
              <p className="text-xs text-muted-foreground mb-3">
                Include your phone number or email address so we can reach you for more information or to provide updates.
              </p>
              <input
                id="contact"
                type="text"
                value={contact}
                onChange={(e) => { setContact(e.target.value); setContactError(false); }}
                placeholder="Phone number or email address"
                className={`${inputCls} ${contactError ? 'border-[#EF4444]' : 'border-border'}`}
              />
              {contactError && <p className="text-xs text-[#EF4444] mt-1">Contact details are required.</p>}
            </div>

            {/* Photos */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1">
                Photos <span className="text-xs font-normal text-muted-foreground">(optional, up to {MAX_FILES})</span>
              </label>
              <p className="text-xs text-muted-foreground mb-3">
                Attach photos of the problem site. Max {MAX_MB} MB per photo. Photos are uploaded securely when you submit.
              </p>

              {/* Thumbnail strip */}
              {uploads.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {uploads.map((u, i) => (
                    <div key={i} className="relative group">
                      <img
                        src={u.preview}
                        alt=""
                        className="h-20 w-20 object-cover rounded-lg border border-border"
                      />
                      <button
                        type="button"
                        onClick={() => removeUpload(i)}
                        className="absolute -top-1.5 -right-1.5 bg-gray-800 text-white rounded-full p-0.5 opacity-80 hover:opacity-100"
                        aria-label="Remove photo"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload button */}
              {uploads.length < MAX_FILES && (
                <>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleFiles}
                  />
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="flex items-center gap-2 w-full px-4 py-3 border border-dashed border-border rounded-md text-sm text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors bg-card"
                  >
                    {uploads.length === 0
                      ? <><ImageIcon className="h-4 w-4 shrink-0" /> Add photos</>
                      : <><Upload className="h-4 w-4 shrink-0" /> Add more photos ({uploads.length}/{MAX_FILES})</>
                    }
                  </button>
                </>
              )}

              {imageError && (
                <p className="text-xs text-[#EF4444] mt-1.5">{imageError}</p>
              )}
            </div>

            {error && (
              <p className="text-sm text-[#EF4444] bg-red-50 border border-red-200 rounded-md px-4 py-3">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 bg-primary text-white font-semibold rounded-md hover:bg-primary/90 active:bg-primary/80 transition-colors text-sm disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {uploading ? 'Uploading photos…' : submitting ? 'Submitting…' : 'Submit Report'}
            </button>

          </form>
        </div>
      </div>

      {/* ── ACTION CARDS SECTION ── */}
      <section className="py-10 sm:py-12 bg-muted/40 border-t-[3px] border-ink">
        <div className="container px-4 sm:px-6 lg:px-8">

          <div className="mb-8">
            <h2 className="text-3xl sm:text-4xl font-black tracking-[-0.02em] text-foreground mb-3">
              What can you do about it?
            </h2>
            <p className="text-muted-foreground max-w-2xl">
              Whether or not you submitted a report, these resources help you escalate the issue, connect with local organisations, or learn about your rights and responsibilities.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* GEODHA app — first action card */}
            <div
              className="bg-tint-green rounded-2xl border-[3px] border-ink p-5 flex flex-col"
              style={{ boxShadow: 'var(--shadow-offset-4)' }}
            >
              <div className="w-10 h-10 rounded-lg bg-primary border-2 border-ink flex items-center justify-center mb-3 shrink-0">
                <Smartphone className="h-5 w-5 text-white" />
              </div>
              <h3 className="font-extrabold text-foreground mb-1.5 leading-snug" style={{ fontSize: '1.1rem' }}>
                Report with the GEODHA app
              </h3>
              <p className="text-sm text-foreground/70 leading-relaxed mb-4 flex-1">
                The fastest route: photo + GPS in under 30 seconds, straight onto
                the public map — with escalation guidance built in.
              </p>
              <StoreButtons placement="report_page" size="sm" />
            </div>

            {actionCards.map((card) => {
              const isExpanded = expandedCards.has(card.id);
              const Icon = card.icon;
              return (
                <div
                  key={card.id}
                  className="bg-paper rounded-2xl border-[3px] border-ink p-5 flex flex-col transition-transform hover:-translate-y-0.5"
                  style={{ boxShadow: 'var(--shadow-offset-4)' }}
                >
                  <div className={`w-10 h-10 rounded-lg ${card.iconBg} flex items-center justify-center mb-3 shrink-0`}>
                    <Icon className={`h-5 w-5 ${card.iconColor}`} />
                  </div>

                  <h3
                    className="font-bold text-foreground mb-1.5 leading-snug"
                    style={{ fontFamily: "'Archivo', sans-serif", fontSize: '1.1rem' }}
                  >
                    {card.title}
                  </h3>

                  <p className="text-sm text-muted-foreground leading-relaxed mb-4 flex-1">
                    {card.description}
                  </p>

                  {card.type === 'action' ? (
                    card.href?.startsWith('/') ? (
                      <Link
                        to={card.href}
                        className="inline-flex items-center gap-1.5 text-sm font-bold px-4 py-2 rounded-full border-2 border-ink bg-tint-green text-foreground hover:bg-primary hover:text-white transition-colors w-fit"
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {card.ctaText}
                      </Link>
                    ) : (
                      <a
                        href={card.href}
                        target={card.href?.startsWith('tel:') ? undefined : '_blank'}
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm font-bold px-4 py-2 rounded-full border-2 border-ink bg-tint-green text-foreground hover:bg-primary hover:text-white transition-colors w-fit"
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {card.ctaText}
                      </a>
                    )
                  ) : (
                    <button
                      onClick={() => toggleCard(card.id)}
                      className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary/80 transition-colors w-fit"
                    >
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      {isExpanded ? 'Show less' : card.ctaText}
                    </button>
                  )}

                  {isExpanded && card.type === 'expand' && (
                    <div className="mt-4 pt-4 border-t border-border space-y-3">
                      {card.contentIntro && (
                        <p className="text-xs font-semibold text-foreground">{card.contentIntro}</p>
                      )}
                      {card.contentItems && (
                        <ul className="space-y-2">
                          {card.contentItems.map((item, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground leading-relaxed">
                              <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      )}
                      {card.contentOutro && (
                        <p className="text-xs text-muted-foreground italic">{card.contentOutro}</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

    </div>
  );
};

export default ReportPage;
