import { wallpapers, type WallpaperId } from '../config/index.ts';
import mountains from '../assets/mountains.svg';

export function Wallpaper({ wallpaper }: { wallpaper: WallpaperId }) {
  const colors = wallpapers.find(item => item.id === wallpaper)!.colors;
  return <div className={`wallpaper wallpaper-${wallpaper}`} style={{ backgroundImage: `linear-gradient(160deg,${colors[0]} 0%,${colors[1]} 52%,${colors[2]} 100%)` }} aria-hidden="true">
    <div className="sky-glow" /><div className="planet" /><div className="stars" />
    <img className="mountains" src={mountains} alt="" draggable="false" />
    <div className="wallpaper-signature">a little curious.<br />a little different.</div>
  </div>;
}
