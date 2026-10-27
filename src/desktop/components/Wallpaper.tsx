import { useState } from 'react';
import { wallpapers } from '../../config/index.ts';
import { usePreferenceValues } from '../../preferences/index.ts';
import mountains from '../../assets/mountains.svg';

export function Wallpaper() {
  const { wallpaper, preferences, customImage } = usePreferenceValues();
  const option = wallpapers.find((item) => item.id === wallpaper)!;
  const image = preferences.customWallpaper && customImage ? customImage : option.image;
  const [failed, setFailed] = useState<string | null>(null);
  const colors = option.colors;
  return (
    <div
      className={`wallpaper wallpaper-${wallpaper}`}
      style={{
        backgroundImage: `linear-gradient(160deg,${colors[0]} 0%,${colors[1]} 52%,${colors[2]} 100%)`,
        filter: `brightness(${preferences.brightness}%)`,
      }}
      aria-hidden="true"
    >
      {image && image !== failed ? (
        <img
          className="wallpaper-image"
          src={image}
          alt=""
          draggable="false"
          onError={() => setFailed(image)}
        />
      ) : (
        <>
          <div className="sky-glow" />
          <div className="planet" />
          <div className="stars" />
          <img className="mountains" src={mountains} alt="" draggable="false" />
        </>
      )}
    </div>
  );
}
