import { siteConfig } from './config';

export function App() {
  return <main className="foundation-intro">
    <span>H. / HonestOS</span>
    <h1>{siteConfig.profile.headline}</h1>
    <p>{siteConfig.profile.introduction}</p>
    <p>{siteConfig.profile.description}</p>
  </main>;
}
