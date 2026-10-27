import { useState } from 'react';
import { useLocalMinute } from '../hooks/useLocalMinute.ts';
import { DesktopPopover } from './DesktopPopover.tsx';
import '../styles/status-controls.css';

const dateLabel = (date: Date) =>
  `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;

export function StatusCalendar() {
  const now = useLocalMinute();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return (
    <DesktopPopover
      label={`日期与时间：${dateLabel(now)} ${hours}:${minutes}`}
      className="status-calendar"
      trigger={
        <time dateTime={now.toISOString()}>
          <span className="status-date">
            {now.getMonth() + 1}月{now.getDate()}日{' '}
          </span>
          {hours}:{minutes}
        </time>
      }
    >
      {() => <Calendar today={now} />}
    </DesktopPopover>
  );
}

function Calendar({ today }: { today: Date }) {
  const [month, setMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const monthLabel = `${year}年${monthIndex + 1}月`;
  const offset = (month.getDay() + 6) % 7;
  const days = new Date(year, monthIndex + 1, 0).getDate();
  const weeks = Math.ceil((offset + days) / 7);
  return (
    <div className="calendar-content">
      <div className="calendar-header">
        <h2 aria-live="polite">{monthLabel}</h2>
        <button aria-label="上个月" onClick={() => setMonth(new Date(year, monthIndex - 1, 1))}>
          ‹
        </button>
        <button aria-label="下个月" onClick={() => setMonth(new Date(year, monthIndex + 1, 1))}>
          ›
        </button>
      </div>
      <table aria-label={monthLabel}>
        <thead>
          <tr>
            {['一', '二', '三', '四', '五', '六', '日'].map((day) => (
              <th key={day} scope="col">
                {day}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: weeks }, (_, week) => (
            <tr key={week}>
              {Array.from({ length: 7 }, (_, weekday) => {
                const day = week * 7 + weekday - offset + 1;
                if (day < 1 || day > days) return <td key={weekday} />;
                const label = dateLabel(new Date(year, monthIndex, day));
                return (
                  <td
                    key={weekday}
                    aria-label={label}
                    aria-current={label === dateLabel(today) ? 'date' : undefined}
                  >
                    {day}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <button
        className="calendar-today"
        onClick={() => setMonth(new Date(today.getFullYear(), today.getMonth(), 1))}
      >
        回到今天
      </button>
    </div>
  );
}
