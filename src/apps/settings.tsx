import { wallpapers } from '../config/registry';
import { usePreferences } from '../preferences/provider';

export function SettingsApp({ onArrange }: { onArrange: () => void }) {
  const { wallpaper, motionEnabled, reducedMotion, saveStatus, setWallpaper, setMotionEnabled } = usePreferences();
  return <section className="app-content settings-content app-padded">
    <h2>桌面设置</h2>
    <p className="app-muted">给这张桌面，换一种心情。</p>
    <fieldset className="wallpaper-options"><legend>桌面壁纸</legend>{wallpapers.map(option => <label key={option.id} className={wallpaper === option.id ? 'wallpaper-choice selected' : 'wallpaper-choice'}>
      <span className={`wallpaper-swatch swatch-${option.id}`} aria-hidden="true" />
      <span className="wallpaper-label"><input type="radio" name="honestos-wallpaper" aria-label={option.name} value={option.id} checked={wallpaper === option.id} onChange={() => setWallpaper(option.id)} /><span>{option.name}</span></span>
    </label>)}</fieldset>
    <div className="settings-row"><div><label htmlFor="honestos-motion">启用界面动效</label><p id="honestos-motion-hint" className="app-muted">尊重系统的减弱动态效果设置。</p></div><input id="honestos-motion" type="checkbox" checked={motionEnabled} onChange={event => setMotionEnabled(event.target.checked)} aria-describedby="honestos-motion-hint" /></div>
    {reducedMotion ? <p className="app-muted">{motionEnabled ? '系统已要求减弱动态效果，桌面将遵循系统设置。' : '已关闭界面动效。'}</p> : null}
    <div className="settings-row settings-arrange"><div><strong>整理桌面</strong><p className="app-muted">恢复默认布局，保留已打开的内容。</p></div><button className="app-button" onClick={onArrange}>整理桌面</button></div>
    <p className="app-muted settings-storage-note" role="status">{saveStatus === 'unavailable' ? '浏览器暂时无法保存偏好，当前选择仅在本次访问有效。' : saveStatus === 'pending' ? '正在保存桌面偏好…' : '壁纸和动效偏好已保存在此浏览器。'}</p>
  </section>;
}
