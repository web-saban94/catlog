import React from 'react';
import {WifiOff} from 'lucide-react';
import {useOnlineStatus} from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-amber-500 text-slate-950 text-xs font-semibold px-4 py-1.5 text-center flex items-center justify-center gap-2"
    >
      <WifiOff className="w-3.5 h-3.5 shrink-0" />
      <span>מצב אופליין — מוצגים נתוני קטלוג שמורים במכשיר</span>
    </div>
  );
};
