import { useState } from 'react';
import { useBudgetStore } from '../store/budgetStore';
import { AlertIcon, CloseIcon } from './icons';

export function StorageWarningBanner() {
  const hasSeen = useBudgetStore((s) => s.settings.hasSeenStorageWarning);
  const markSeen = useBudgetStore((s) => s.markStorageWarningSeen);
  const [dismissedThisSession, setDismissedThisSession] = useState(false);

  if (hasSeen || dismissedThisSession) return null;

  return (
    <div className="mx-4 mt-3 flex items-start gap-2.5 rounded-xl border border-amber-800/60 bg-amber-950/40 p-3 text-amber-200">
      <AlertIcon width={18} height={18} className="mt-0.5 shrink-0" />
      <div className="flex-1 text-xs leading-relaxed">
        <p className="font-semibold text-amber-100">Vos données restent sur cet appareil</p>
        <p className="mt-0.5">
          Tout est stocké localement dans ce navigateur, sans compte ni serveur. Un nettoyage des données de
          navigation, un changement d'appareil ou une réinstallation effacera votre historique. Pensez à exporter
          régulièrement une sauvegarde depuis Réglages.
        </p>
      </div>
      <button
        type="button"
        onClick={() => {
          markSeen();
          setDismissedThisSession(true);
        }}
        aria-label="Compris, masquer ce message"
        className="shrink-0 rounded-full p-1 text-amber-300 hover:bg-amber-900/50"
      >
        <CloseIcon width={16} height={16} />
      </button>
    </div>
  );
}
