import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Volume1, Volume2, VolumeX, Loader2, AlertCircle } from 'lucide-react';
import YouTube from 'react-youtube';

// Fonction utilitaire pour formater le temps en mm:ss
const formatTime = (seconds: number): string => {
  if (!seconds || isNaN(seconds)) return '0:00';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

interface VideoPlayerProps {
  videoUrl: string;
  type: 'local' | 'youtube';
  autoplay?: boolean;
  poster?: string;
  onPlay?: () => void;
  onPause?: () => void;
  onComplete?: () => void;
  onEnd?: () => void;
  // Nouvelles props pour le contrôle de progression
  currentProgress?: number; // Progression actuelle en pourcentage (0-100)
  restrictSeek?: boolean; // Empêcher d'avancer au-delà de la progression
  onProgressUpdate?: (progress: number) => void; // Callback quand la progression change
  showRemainingTime?: boolean; // Afficher le temps restant basé sur la progression
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoUrl,
  type = 'local',
  autoplay = false,
  poster,
  onPlay,
  onPause,
  onComplete,
  onEnd,
  currentProgress = 0,
  restrictSeek = false,
  onProgressUpdate,
  showRemainingTime = false
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(autoplay);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isControlsVisible, setIsControlsVisible] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [youtubeId, setYoutubeId] = useState<string | null>(null);

  useEffect(() => {
    if (type === 'youtube' && videoUrl) {
      // Extraction de l'ID YouTube
      const id = extractYoutubeId(videoUrl);
      if (!id) {
        setError('ID YouTube invalide');
        return;
      }
      setYoutubeId(id);
    }
  }, [videoUrl, type]);

  const extractYoutubeId = (url: string): string | null => {
    // URL directe de YouTube
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    if (match) return match[1];
    
    // Si c'est déjà un ID
    if (url.length === 11) return url;
    
    return null;
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
      onPause?.();
    } else {
      video.play().catch((err) => {
        console.error('Error playing video:', err);
        setError('Impossible de démarrer la lecture');
      });
      setIsPlaying(true);
      onPlay?.();
    }
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;
    
    const currentVideoTime = video.currentTime;
    const videoDuration = video.duration;
    
    setCurrentTime(currentVideoTime);
    setDuration(videoDuration);
    
    // Calculer la progression actuelle basée sur le temps
    if (videoDuration > 0) {
      const watchedProgress = (currentVideoTime / videoDuration) * 100;
      
      // Mettre à jour la progression si elle a augmenté
      if (watchedProgress > currentProgress) {
        onProgressUpdate?.(Math.min(watchedProgress, 100));
      }
      
      // Empêcher d'avancer au-delà de la progression autorisée
      if (restrictSeek && watchedProgress > currentProgress + 1) {
        // Ramener la vidéo au point maximum autorisé
        const maxAllowedTime = (currentProgress / 100) * videoDuration;
        video.currentTime = maxAllowedTime;
        setCurrentTime(maxAllowedTime);
      }
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = newVolume;
    setVolume(newVolume);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleSeek = (newTime: number) => {
    const video = videoRef.current;
    if (!video || !duration) return;
    
    // Vérifier si on peut chercher à cette position
    const seekProgress = (newTime / duration) * 100;
    
    if (restrictSeek && seekProgress > currentProgress) {
      // Empêcher de chercher au-delà de la progression actuelle
      const maxAllowedTime = (currentProgress / 100) * duration;
      video.currentTime = maxAllowedTime;
      setCurrentTime(maxAllowedTime);
      
      // Optionnel: Afficher un message d'avertissement
      console.warn('Vous ne pouvez pas avancer au-delà de votre progression actuelle');
    } else {
      video.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', () => setIsPlaying(true));
    video.addEventListener('pause', () => setIsPlaying(false));
    video.addEventListener('ended', () => {
      setIsPlaying(false);
      onComplete?.();
      onEnd?.();
    });
    video.addEventListener('error', (e) => {
      setError(`Erreur de lecture : ${e.target}`);
    });

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', () => setIsPlaying(true));
      video.removeEventListener('pause', () => setIsPlaying(false));
      video.removeEventListener('ended', () => {
        setIsPlaying(false);
        onComplete?.();
        onEnd?.();
      });
      video.removeEventListener('error', (e) => {
        setError(`Erreur de lecture : ${e.target}`);
      });
    };
  }, [onComplete, onEnd]);

  if (type === 'youtube') {
    return (
      <div className="relative w-full h-full">
        {youtubeId && (
        <YouTube
          videoId={youtubeId}
          opts={{
            height: '100%',
            width: '100%',
            playerVars: {
              autoplay: autoplay ? 1 : 0,
              controls: 0,
              disablekb: 1,
              modestbranding: 1,
              rel: 0,
              showinfo: 0,
            },
          }}
          onReady={(event) => {
            console.log('YouTube player ready');
          }}
          onError={(event) => {
            console.error('YouTube player error:', event);
            setError('Erreur lors du chargement de la vidéo YouTube');
          }}
        />
      )}
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {/* Video element */}
      <video
        ref={videoRef}
        className={`w-full h-full object-cover ${isControlsVisible ? '' : 'hidden'}`}
        autoPlay={autoplay}
        poster={poster}
        controls={false}
      >
        <source src={videoUrl} type="video/mp4" />
        Votre navigateur ne supporte pas la vidéo.
      </video>

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <Loader2 className="h-8 w-8 text-white animate-spin" />
        </div>
      )}

      {/* Error overlay */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 text-white">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Controls overlay */}
      {isControlsVisible && (
        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 p-4">
          {/* Progress bar avec limite de progression */}
          <div className="mb-4">
            <div className="relative h-1 bg-gray-600 rounded-full">
              {/* Barre de progression actuelle */}
              <div
                className="h-1 bg-white rounded-full transition-all duration-200"
                style={{ width: `${(currentTime / duration) * 100}%` }}
              />
              {/* Limite de progression (si restrictSeek est activé) */}
              {restrictSeek && (
                <div
                  className="absolute top-0 h-1 bg-yellow-500 rounded-full opacity-60"
                  style={{ width: `${currentProgress}%` }}
                  title={`Progression autorisée: ${Math.round(currentProgress)}%`}
                />
              )}
            </div>
          </div>
          
          {/* Affichage du temps restant basé sur la progression */}
          {showRemainingTime && duration > 0 && (
            <div className="mb-2 text-center">
              <div className="text-white text-sm">
                {restrictSeek ? (
                  <span>
                    🔒 Temps restant à débloquer: {' '}
                    <span className="font-semibold text-yellow-400">
                      {formatTime(duration - (currentProgress / 100) * duration)}
                    </span>
                    {' '} sur {formatTime(duration)}
                  </span>
                ) : (
                  <span>
                    Temps restant: {' '}
                    <span className="font-semibold">
                      {formatTime(duration - currentTime)}
                    </span>
                    {' '} sur {formatTime(duration)}
                  </span>
                )}
              </div>
              <div className="text-gray-300 text-xs mt-1">
                Progression: {Math.round(currentProgress)}% • Visionné: {Math.round((currentTime / duration) * 100)}%
              </div>
            </div>
          )}

          {/* Control buttons */}
          <div className="flex items-center justify-between">
            <button
              onClick={togglePlay}
              className="p-2 rounded-full hover:bg-gray-700 transition-colors"
            >
              {isPlaying ? (
                <Pause className="h-6 w-6 text-white" />
              ) : (
                <Play className="h-6 w-6 text-white" />
              )}
            </button>

            <div className="flex items-center space-x-4">
              <button
                onClick={toggleMute}
                className="p-2 rounded-full hover:bg-gray-700 transition-colors"
              >
                {isMuted ? (
                  <VolumeX className="h-6 w-6 text-white" />
                ) : volume <= 0.3 ? (
                  <Volume1 className="h-6 w-6 text-white" />
                ) : volume <= 0.6 ? (
                  <Volume2 className="h-6 w-6 text-white" />
                ) : (
                  <Volume2 className="h-6 w-6 text-white" />
                )}
              </button>

              <div className="flex items-center">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  className="w-24"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
