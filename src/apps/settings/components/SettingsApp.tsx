import { useRef, useState } from 'react';
import { wallpapers } from '../../../config/index.ts';
import { usePreferences } from '../../../preferences/index.ts';
import type { Appearance, DockSize } from '../../../preferences/index.ts';
import { Icon } from '../../../shared/components/Icon.tsx';

type Pane = 'appearance' | 'wallpaper' | 'dock';
const panes: { id: Pane; title: string; icon: 'user' | 'folder' | 'sliders' }[] = [
  { id: 'appearance', title: '外观', icon: 'user' },
  { id: 'wallpaper', title: '壁纸', icon: 'folder' },
  { id: 'dock', title: '程序坞与动效', icon: 'sliders' },
];
export function SettingsApp({ onArrange }: { onArrange: () => void }) {
  const settings = usePreferences();
  const {
    preferences,
    wallpaper,
    motionEnabled,
    reducedMotion,
    saveStatus,
    setWallpaper,
    setMotionEnabled,
    update,
  } = settings;
  const [pane, setPane] = useState<Pane>('appearance');
  const [uploadError, setUploadError] = useState('');
  const [uploading, setUploading] = useState(false);
  const upload = useRef<HTMLInputElement>(null);
  return (
    <section className="app-content settings-content">
      <aside className="settings-sidebar">
        <div className="settings-owner">
          <span className="settings-owner-icon">
            <Icon name="sliders" />
          </span>
          <div>
            <strong>HonestOS</strong>
            <small>桌面设置</small>
          </div>
        </div>
        <nav aria-label="设置分类">
          {panes.map((item) => (
            <button
              key={item.id}
              aria-current={pane === item.id ? 'page' : undefined}
              onClick={() => setPane(item.id)}
            >
              <Icon name={item.icon} />
              {item.title}
            </button>
          ))}
        </nav>
      </aside>
      <div className="settings-detail">
        <h2>{panes.find((item) => item.id === pane)!.title}</h2>
        <div hidden={pane !== 'appearance'}>
          <fieldset className="appearance-options">
            <legend>选择外观</legend>
            {(['system', 'light', 'dark'] as const).map((value) => (
              <label
                key={value}
                className={`appearance-choice ${preferences.appearance === value ? 'selected' : ''}`}
              >
                <span className={`appearance-preview preview-${value}`} aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </span>
                <span>
                  <input
                    type="radio"
                    name="appearance"
                    value={value}
                    checked={preferences.appearance === value}
                    onChange={() => update({ appearance: value as Appearance })}
                  />
                  {{ system: '跟随系统', light: '浅色', dark: '深色' }[value]}
                </span>
              </label>
            ))}
          </fieldset>
          <div className="settings-group">
            <label className="settings-slider" htmlFor="glass-opacity">
              <span>
                玻璃不透明度 <output>{preferences.glassOpacity}%</output>
              </span>
              <input
                id="glass-opacity"
                type="range"
                min="30"
                max="100"
                value={preferences.glassOpacity}
                onChange={(event) => update({ glassOpacity: Number(event.target.value) })}
              />
            </label>
            <p className="app-muted settings-hint">调高后，窗口和程序坞更清晰。</p>
          </div>
        </div>
        <div hidden={pane !== 'wallpaper'}>
          <fieldset className="wallpaper-options">
            <legend>内置壁纸</legend>
            {wallpapers.map((option) => (
              <label
                key={option.id}
                className={
                  !preferences.customWallpaper && wallpaper === option.id
                    ? 'wallpaper-choice selected'
                    : 'wallpaper-choice'
                }
              >
                <span
                  className={`wallpaper-swatch swatch-${option.id}`}
                  style={option.image ? { backgroundImage: `url(${option.image})` } : undefined}
                  aria-hidden="true"
                />
                <span className="wallpaper-label">
                  <input
                    type="radio"
                    name="honestos-wallpaper"
                    aria-label={option.name}
                    value={option.id}
                    checked={!preferences.customWallpaper && wallpaper === option.id}
                    onChange={() => setWallpaper(option.id)}
                  />
                  <span>{option.name}</span>
                </span>
              </label>
            ))}
          </fieldset>
          {settings.customImage ? (
            <label className="saved-wallpaper-choice">
              <input
                type="radio"
                name="honestos-wallpaper"
                checked={preferences.customWallpaper}
                onChange={() => update({ customWallpaper: true })}
              />
              使用自己的图片
            </label>
          ) : null}
          <div className="settings-group settings-upload">
            <div>
              <strong>自己的图片</strong>
              <p className="app-muted">
                仅保存在此浏览器，不会上传。支持 JPG、PNG、WebP、AVIF，最大 10 MB。
              </p>
            </div>
            {settings.customImage ? (
              <img
                className="custom-wallpaper-preview"
                src={settings.customImage}
                alt="当前自选壁纸"
              />
            ) : null}
            <input
              ref={upload}
              className="app-sr-only"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              aria-label="选择壁纸图片"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                event.target.value = '';
                if (!file) return;
                setUploadError('');
                setUploading(true);
                try {
                  await settings.uploadWallpaper(file);
                } catch (error) {
                  setUploadError(error instanceof Error ? error.message : '无法读取这张图片。');
                } finally {
                  setUploading(false);
                }
              }}
            />
            <button
              className="app-button"
              disabled={uploading}
              onClick={() => upload.current?.click()}
            >
              {uploading ? '正在读取…' : '选择图片…'}
            </button>
            {uploadError ? (
              <p className="settings-error" role="alert">
                {uploadError}
              </p>
            ) : null}
            {preferences.customWallpaper && settings.imageStatus === 'unavailable' ? (
              <p className="settings-error">
                图片无法保存或恢复；当前图片仅在本次访问有效。可重新选择图片。
              </p>
            ) : null}
          </div>
          <div className="settings-group">
            <label className="settings-slider" htmlFor="wallpaper-brightness">
              <span>
                背景亮度 <output>{preferences.brightness}%</output>
              </span>
              <input
                id="wallpaper-brightness"
                type="range"
                min="30"
                max="100"
                value={preferences.brightness}
                onChange={(event) => update({ brightness: Number(event.target.value) })}
              />
            </label>
          </div>
        </div>
        <div hidden={pane !== 'dock'}>
          <fieldset className="settings-group dock-size-options">
            <legend>程序坞图标大小</legend>
            {(['small', 'medium', 'large'] as const).map((value) => (
              <label key={value}>
                <input
                  type="radio"
                  name="dock-size"
                  checked={preferences.dockSize === value}
                  onChange={() => update({ dockSize: value as DockSize })}
                />
                {{ small: '小', medium: '中', large: '大' }[value]}
              </label>
            ))}
          </fieldset>
          <div className="settings-group">
            <div className="settings-row">
              <label htmlFor="dock-hide">自动隐藏程序坞</label>
              <input
                className="settings-switch"
                id="dock-hide"
                type="checkbox"
                checked={preferences.dockAutoHide}
                onChange={(event) => update({ dockAutoHide: event.target.checked })}
              />
            </div>
            <p className="app-muted settings-hint">
              移到屏幕底部或通过键盘聚焦时显示；触屏始终可见。
            </p>
          </div>
          <div className="settings-group">
            <div className="settings-row">
              <label htmlFor="honestos-motion">启用界面动效</label>
              <input
                className="settings-switch"
                id="honestos-motion"
                type="checkbox"
                checked={motionEnabled}
                onChange={(event) => setMotionEnabled(event.target.checked)}
              />
            </div>
            <p className="app-muted settings-hint">
              {reducedMotion
                ? motionEnabled
                  ? '系统已要求减弱动态效果，桌面将遵循系统设置。'
                  : '已关闭界面动效。'
                : '窗口开合与程序坞反馈。'}
            </p>
          </div>
        </div>
        <div className="settings-group settings-utilities">
          <button className="app-button" onClick={onArrange}>
            整理桌面
          </button>
          <button
            className="app-button"
            onClick={() => {
              settings.reset();
              setUploadError('');
            }}
          >
            恢复默认设置
          </button>
        </div>
        <p className="app-muted settings-storage-note" role="status">
          {saveStatus === 'unavailable'
            ? '浏览器暂时无法保存偏好，当前选择仅在本次访问有效。'
            : saveStatus === 'pending'
              ? '正在保存桌面偏好…'
              : '桌面偏好已保存在此浏览器。'}
        </p>
      </div>
    </section>
  );
}
