import { profileLinks, publicUrl, type AppId, type Profile } from '../config/index.ts';
import { ContactIcon } from '../ui/contact-icon.tsx';

export function AboutApp({
  profile,
  onOpen,
}: {
  profile: Profile;
  onOpen: (appId: AppId, options?: { focusTerminal?: boolean }) => void;
}) {
  return (
    <section className="app-content about-content">
      <div className="about-story">
        <div className="about-identity" style={{ '--stagger-index': 0 } as React.CSSProperties}>
          <span className="profile-avatar-wrap">
            <img
              className="profile-avatar"
              src={profile.avatar ?? '/avatar.webp'}
              alt={`${profile.name} 的头像`}
            />
            <span className="profile-avatar-dot" aria-hidden="true" />
          </span>
          <div className="about-identity-copy">
            <div className="about-name-row">
              <strong>{profile.name}</strong>
              {profile.role ? <span className="about-role-pill">{profile.role}</span> : null}
            </div>
            <p className="app-muted">{profile.alias}</p>
          </div>
        </div>
        <h1 style={{ '--stagger-index': 1 } as React.CSSProperties}>{profile.headline}</h1>
        <p className="about-introduction" style={{ '--stagger-index': 2 } as React.CSSProperties}>
          {profile.introduction}
        </p>
        <p className="app-muted" style={{ '--stagger-index': 3 } as React.CSSProperties}>
          {profile.description}
        </p>
        <ul className="interest-list" style={{ '--stagger-index': 4 } as React.CSSProperties}>
          {profile.interests.map((interest) => (
            <li key={interest}>{interest}</li>
          ))}
        </ul>
        {profile.highlights?.length ? (
          <dl className="about-highlights" style={{ '--stagger-index': 5 } as React.CSSProperties}>
            {profile.highlights.map((item) => (
              <div className="about-highlight-card" key={item.label}>
                <dt>{item.label}</dt>
                <dd>{item.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
        <div className="about-actions" style={{ '--stagger-index': 6 } as React.CSSProperties}>
          <button className="app-button app-primary" onClick={() => onOpen('projects')}>
            看看我在折腾什么
          </button>
          <button
            className="app-button app-text-button"
            onClick={() => onOpen('terminal', { focusTerminal: true })}
          >
            或者，敲点命令
          </button>
        </div>
        {profile.links.length ? (
          <nav
            className="profile-links"
            aria-label="公开联系方式"
            style={{ '--stagger-index': 7 } as React.CSSProperties}
          >
            {profileLinks(profile.links).map((link) => {
              const url = publicUrl(link.url, link.kind);
              return url ? (
                <a
                  key={`${link.label}:${url}`}
                  href={url}
                  target={link.kind === 'email' ? undefined : '_blank'}
                  rel={link.kind === 'email' ? undefined : 'noopener noreferrer'}
                >
                  <ContactIcon name={link.icon} />
                  {link.label}
                  {link.kind === 'email' ? null : (
                    <span className="app-sr-only">（新标签打开）</span>
                  )}
                </a>
              ) : null;
            })}
          </nav>
        ) : null}
      </div>
      <footer className="about-footer">
        <span>
          <i aria-hidden="true" />
          {profile.status}
        </span>
        <span>honestman.me</span>
      </footer>
    </section>
  );
}
