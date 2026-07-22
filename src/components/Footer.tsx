import { Link } from 'react-router-dom';
import { Mail, Linkedin, Instagram, MessageSquare } from 'lucide-react';
import reapBenefitLogo from '@/assets/reap-benefit-logo.png';
import StoreButtons from '@/components/StoreButtons';
import { useI18n } from '@/i18n';

// Street-poster footer: ink band, GEODHA 900 wordmark + mono site label.
const Footer = () => {
  const { t } = useI18n();

  const linkCls = 'hover:text-primary transition-colors';
  const headCls = 'font-mono text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground mb-4';

  return (
    <footer className="bg-paper text-foreground border-t-[3px] border-ink">
      <div className="container px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand */}
          <div className="space-y-4 lg:col-span-1">
            <Link to="/" className="inline-flex items-baseline gap-3 group">
              <span className="text-2xl font-black tracking-tight text-ink">GEODHA</span>
              <span className="font-mono text-xs text-muted-foreground">geodha.org</span>
            </Link>
            <p className="text-sm text-foreground/60 leading-relaxed">
              {t.footer.tagline}
            </p>
            <div className="flex gap-2">
              {[
                { href: 'mailto:contact@geodha.org', label: 'Email', Icon: Mail },
                { href: 'https://www.linkedin.com/company/geodha', label: 'LinkedIn', Icon: Linkedin },
                { href: 'https://www.instagram.com/geodha_org', label: 'Instagram', Icon: Instagram },
                { href: 'https://www.reddit.com/r/geodha', label: 'Reddit', Icon: MessageSquare },
              ].map(({ href, label, Icon }) => (
                <a
                  key={label}
                  href={href}
                  {...(href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  className="p-2 rounded-lg border-2 border-ink/25 text-foreground/60 hover:text-primary hover:border-primary transition-colors"
                  aria-label={label}
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Partners & Supporters */}
          <div>
            <h3 className={headCls}>{t.footer.partners}</h3>
            <a
              href="https://www.reapbenefit.org"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-paper border-2 border-ink/20 rounded-xl p-3 opacity-90 hover:opacity-100 transition-opacity"
              aria-label="Reap Benefit"
            >
              <img
                src={reapBenefitLogo}
                alt="Reap Benefit"
                className="h-8 w-auto object-contain"
                loading="lazy"
                decoding="async"
              />
            </a>
          </div>

          {/* Platform */}
          <div>
            <h3 className={headCls}>{t.footer.platform}</h3>
            <ul className="space-y-2.5 text-sm text-foreground/70">
              <li><Link to="/dashboard" className={linkCls}>{t.nav.dashboard}</Link></li>
              <li><Link to="/blog" className={linkCls}>{t.nav.blog}</Link></li>
              <li><Link to="/report" className={`${linkCls} font-bold`}>{t.common.reportProblem}</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className={headCls}>{t.footer.resources}</h3>
            <ul className="space-y-2.5 text-sm text-foreground/70">
              <li><Link to="/guide" className={linkCls}>{t.footer.wasteGuide}</Link></li>
              <li><Link to="/guide2" className={linkCls}>{t.footer.bwgGuide}</Link></li>
              <li><Link to="/volunteer" className={linkCls}>{t.footer.volunteer}</Link></li>
              <li><Link to="/waste-to-value" className={linkCls}>{t.footer.wasteToValue}</Link></li>
            </ul>
          </div>

          {/* About + app links */}
          <div>
            <h3 className={headCls}>{t.footer.about}</h3>
            <ul className="space-y-2.5 text-sm text-foreground/70">
              <li><Link to="/about" className={linkCls}>{t.footer.mission}</Link></li>
              <li><Link to="/privacy" className={linkCls}>{t.footer.privacy}</Link></li>
              <li><a href="mailto:contact@geodha.org" className={linkCls}>{t.footer.contact}</a></li>
            </ul>
            {/* App store buttons */}
            <div className="mt-5">
              <StoreButtons placement="footer" size="sm" />
            </div>
          </div>
        </div>

        {/* Bottom row */}
        <div className="mt-10 pt-6 border-t-2 border-ink/15 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <p className="font-mono text-xs text-muted-foreground">{t.footer.rights}</p>
          <Link
            to="/report"
            className="inline-block px-5 py-2.5 bg-secondary text-secondary-foreground text-sm font-extrabold rounded-full border-[2.5px] border-ink transition-transform active:translate-x-[2px] active:translate-y-[2px]"
            style={{ boxShadow: 'var(--shadow-offset-3)' }}
          >
            {t.common.submitReport} →
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
