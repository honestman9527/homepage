import { useEffect, useState } from 'react';

export function useLocalMinute() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    function update() {
      clearTimeout(timer);
      const current = new Date();
      setNow(current);
      timer = setTimeout(
        update,
        60_000 - (current.getSeconds() * 1000 + current.getMilliseconds()),
      );
    }
    update();
    window.addEventListener('focus', update);
    document.addEventListener('visibilitychange', update);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('focus', update);
      document.removeEventListener('visibilitychange', update);
    };
  }, []);
  return now;
}
