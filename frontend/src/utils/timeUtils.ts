/**
 * Formate une durée en secondes sous forme de chaîne lisible (HH:MM:SS ou MM:SS)
 * @param seconds - Durée en secondes
 * @param showHours - Afficher les heures même si elles sont nulles
 * @returns Chaîne formatée (ex: "02:30" ou "1:05:30")
 */
export const formatTime = (seconds: number, showHours: boolean = false): string => {
  if (isNaN(seconds) || !isFinite(seconds) || seconds < 0) {
    return '--:--';
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  // Si showHours est vrai ou si la durée dépasse 1 heure
  if (showHours || hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Calcule le temps écoulé entre deux dates
 * @param startDate - Date de début
 * @param endDate - Date de fin (par défaut: maintenant)
 * @returns Objet avec les propriétés { days, hours, minutes, seconds, totalInSeconds }
 */
export const getTimeElapsed = (
  startDate: Date | string | number,
  endDate: Date | string | number = new Date()
) => {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const diffInSeconds = Math.floor(Math.max(0, end - start) / 1000);

  const days = Math.floor(diffInSeconds / (3600 * 24));
  const hours = Math.floor((diffInSeconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((diffInSeconds % 3600) / 60);
  const seconds = diffInSeconds % 60;

  return {
    days,
    hours,
    minutes,
    seconds,
    totalInSeconds: diffInSeconds,
  };
};

/**
 * Formate une date en chaîne lisible
 * @param date - Date à formater
 * @param options - Options de formatage (voir Intl.DateTimeFormatOptions)
 * @returns Chaîne formatée (ex: "3 juillet 2023, 14:30")
 */
export const formatDate = (
  date: Date | string | number,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }
): string => {
  try {
    return new Date(date).toLocaleDateString('fr-FR', options);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Date invalide';
  }
};

/**
 * Calcule le temps restant jusqu'à une date future
 * @param targetDate - Date cible
 * @param currentDate - Date actuelle (par défaut: maintenant)
 * @returns Objet avec les propriétés { days, hours, minutes, seconds, totalInSeconds, isExpired }
 */
export const getTimeRemaining = (
  targetDate: Date | string | number,
  currentDate: Date | string | number = new Date()
) => {
  const target = new Date(targetDate).getTime();
  const current = new Date(currentDate).getTime();
  const diffInSeconds = Math.max(0, Math.floor((target - current) / 1000));

  const days = Math.floor(diffInSeconds / (3600 * 24));
  const hours = Math.floor((diffInSeconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((diffInSeconds % 3600) / 60);
  const seconds = diffInSeconds % 60;

  return {
    days,
    hours,
    minutes,
    seconds,
    totalInSeconds: diffInSeconds,
    isExpired: diffInSeconds <= 0,
  };
};

/**
 * Convertit une durée en secondes en une chaîne lisible
 * @param seconds - Durée en secondes
 * @param options - Options de formatage
 * @returns Chaîne formatée (ex: "2h 30min 15s" ou "1j 5h")
 */
export const formatDuration = (
  seconds: number,
  options: {
    includeSeconds?: boolean;
    compact?: boolean;
    maxParts?: number;
  } = {}
): string => {
  const { includeSeconds = true, compact = false, maxParts = 3 } = options;
  
  if (isNaN(seconds) || !isFinite(seconds) || seconds < 0) {
    return compact ? '--' : '--:--';
  }

  const days = Math.floor(seconds / (3600 * 24));
  const hours = Math.floor((seconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts = [];
  
  if (days > 0) {
    parts.push(compact ? `${days}j` : `${days} jour${days > 1 ? 's' : ''}`);
  }
  
  if (hours > 0 || days > 0) {
    if (compact) {
      parts.push(`${hours}h`);
    } else {
      parts.push(`${hours} heure${hours > 1 ? 's' : ''}`);
    }
  }
  
  if (minutes > 0 || hours > 0 || days > 0) {
    if (compact) {
      parts.push(`${minutes}min`);
    } else {
      parts.push(`${minutes} minute${minutes > 1 ? 's' : ''}`);
    }
  }
  
  if (includeSeconds && (secs > 0 || parts.length === 0)) {
    if (compact) {
      parts.push(`${secs}s`);
    } else {
      parts.push(`${secs} seconde${secs > 1 ? 's' : ''}`);
    }
  }

  // Limiter le nombre de parties à afficher
  const limitedParts = parts.slice(0, maxParts);
  
  return limitedParts.join(compact ? ' ' : ' ');
};
