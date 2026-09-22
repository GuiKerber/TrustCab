import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

const MINUTE = 60_000;

// Hora atual que se atualiza sozinha: a cada minuto ("minute") ou só na virada do dia ("day").
// Também atualiza quando o app volta do segundo plano, para "hoje" nunca ficar parado em ontem.
export function useNow(every: 'minute' | 'day' = 'day') {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const refresh = () =>
      setNow((current) => {
        const next = new Date();
        if (every === 'minute') return next;
        return next.toDateString() === current.toDateString() ? current : next;
      });
    const timer = setInterval(refresh, MINUTE);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => {
      clearInterval(timer);
      subscription.remove();
    };
  }, [every]);

  return now;
}
