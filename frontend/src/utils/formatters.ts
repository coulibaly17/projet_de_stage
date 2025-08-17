/**
 * Formate une durée en secondes en format lisible (mm:ss ou hh:mm:ss)
 * @param seconds Durée en secondes
 * @returns Chaîne formatée
 */
export function formatDuration(seconds: number): string {
  if (!seconds && seconds !== 0) return '--:--';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  // Format avec zéro devant si nécessaire
  const formattedMinutes = minutes.toString().padStart(2, '0');
  const formattedSeconds = remainingSeconds.toString().padStart(2, '0');
  
  // Inclure les heures seulement si nécessaire
  if (hours > 0) {
    const formattedHours = hours.toString().padStart(2, '0');
    return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
  }
  
  return `${formattedMinutes}:${formattedSeconds}`;
}

/**
 * Formate un pourcentage avec 1 décimale
 * @param value Valeur à formater
 * @returns Chaîne formatée avec %
 */
export function formatPercentage(value: number): string {
  if (value === undefined || value === null) return '0%';
  return `${Math.round(value * 10) / 10}%`;
}

/**
 * Formate une date en format lisible
 * @param dateString Chaîne de date ISO
 * @returns Date formatée
 */
export function formatDate(dateString: string): string {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  } catch (error) {
    console.error('Erreur de formatage de date:', error);
    return dateString;
  }
}
