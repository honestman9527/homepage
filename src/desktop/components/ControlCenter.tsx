import { useId } from 'react';
import { usePreferences } from '../../preferences/index.ts';
import { DesktopPopover } from './DesktopPopover.tsx';
import { Icon } from '../../shared/components/Icon.tsx';
import '../styles/status-controls.css';

export function ControlCenter({ onSettings }: { onSettings(): void }) {
  return (
    <DesktopPopover label="控制中心" trigger={<Icon name="sliders" />} className="status-controls">
      {(close) => (
        <ControlPreferences
          onSettings={() => {
            close();
            onSettings();
          }}
        />
      )}
    </DesktopPopover>
  );
}

function ControlPreferences({ onSettings }: { onSettings(): void }) {
  const id = useId();
  const { preferences, motionEnabled, reducedMotion, saveStatus, update, setMotionEnabled } =
    usePreferences();
  return (
    <div className="control-center">
      <h2>控制中心</h2>
      <fieldset className="control-appearance">
        <legend>外观</legend>
        {(['light', 'dark', 'system'] as const).map((appearance) => (
          <label key={appearance}>
            <input
              type="radio"
              name={`${id}-appearance`}
              checked={preferences.appearance === appearance}
              onChange={() => update({ appearance })}
            />
            {{ light: '浅色', dark: '深色', system: '跟随系统' }[appearance]}
          </label>
        ))}
      </fieldset>
      <label className="control-range" htmlFor={`${id}-brightness`}>
        <span>
          背景亮度 <output>{preferences.brightness}%</output>
        </span>
        <input
          id={`${id}-brightness`}
          type="range"
          min="30"
          max="100"
          value={preferences.brightness}
          onChange={(event) => update({ brightness: Number(event.target.value) })}
        />
      </label>
      <label className="control-range" htmlFor={`${id}-glass`}>
        <span>
          玻璃不透明度 <output>{preferences.glassOpacity}%</output>
        </span>
        <input
          id={`${id}-glass`}
          type="range"
          min="30"
          max="100"
          value={preferences.glassOpacity}
          onChange={(event) => update({ glassOpacity: Number(event.target.value) })}
        />
      </label>
      <label className="control-motion">
        启用界面动效
        <input
          type="checkbox"
          checked={motionEnabled}
          onChange={(event) => setMotionEnabled(event.target.checked)}
        />
      </label>
      {reducedMotion && (
        <p className="control-note">
          {motionEnabled ? '系统已要求减弱动态效果，桌面将遵循系统设置。' : '已关闭界面动效。'}
        </p>
      )}
      <button className="control-settings" onClick={onSettings}>
        打开桌面设置
      </button>
      <p className="control-note" role="status">
        {saveStatus === 'unavailable'
          ? '浏览器暂时无法保存偏好，当前选择仅在本次访问有效。'
          : saveStatus === 'pending'
            ? '正在保存桌面偏好…'
            : '桌面偏好已保存在此浏览器。'}
      </p>
    </div>
  );
}
