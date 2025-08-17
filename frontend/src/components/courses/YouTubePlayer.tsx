import React, { useEffect, useRef, useState } from 'react';
import { Box, Skeleton } from '@mui/material';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface YouTubePlayerProps {
  videoId: string;
  onReady?: () => void;
  onPlay?: () => void;
  onPause?: () => void;
  onEnd?: () => void;
  autoplay?: boolean;
}

const YouTubePlayer: React.FC<YouTubePlayerProps> = ({
  videoId,
  onReady,
  onPlay,
  onPause,
  onEnd,
  autoplay = false,
}) => {
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlayerReady, setIsPlayerReady] = useState(false);

  useEffect(() => {
    // Vérifier si l'API YouTube est déjà chargée
    if (!window.YT) {
      // Charger l'API YouTube
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      // Fonction appelée quand l'API est prête
      window.onYouTubeIframeAPIReady = initializePlayer;
    } else {
      initializePlayer();
    }

    // Fonction pour initialiser le lecteur YouTube
    function initializePlayer() {
      if (!containerRef.current) return;

      // Si le lecteur existe déjà, le détruire d'abord
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (e) {
          console.error('Error destroying old YouTube player:', e);
        }
      }

      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId: extractYouTubeId(videoId) || videoId,
        playerVars: {
          autoplay: autoplay ? 1 : 0,
          controls: 1,
          rel: 0, // Ne pas afficher de vidéos suggérées à la fin
          modestbranding: 1, // Masquer le logo YouTube
          playsinline: 1, // Lecture en ligne sur iOS
          origin: window.location.origin,
        },
        events: {
          onReady: () => {
            console.log('YouTube Player ready');
            setIsPlayerReady(true);
            onReady?.();
          },
          onStateChange: (event: any) => {
            // Événements de lecture
            if (event.data === window.YT.PlayerState.PLAYING) {
              onPlay?.();
            } else if (event.data === window.YT.PlayerState.PAUSED) {
              onPause?.();
            } else if (event.data === window.YT.PlayerState.ENDED) {
              onEnd?.();
            }
          },
        },
      });
    }

    // Nettoyage
    return () => {
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (e) {
          console.error('Error destroying YouTube player:', e);
        }
      }
    };
  }, [videoId, autoplay]);

  // Fonction pour extraire l'ID d'une URL YouTube
  const extractYouTubeId = (url: string): string | null => {
    if (!url) return null;
    
    // Format standard : https://www.youtube.com/watch?v=ID
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    
    if (match && match[2].length === 11) {
      return match[2];
    }
    return null;
  };

  return (
    <Box
      sx={{
        position: 'relative',
        paddingBottom: '56.25%', // 16:9 aspect ratio
        height: 0,
        overflow: 'hidden',
        borderRadius: 2,
        backgroundColor: '#000',
      }}
    >
      {isPlayerReady ? (
        <div ref={containerRef} />
      ) : (
        <Skeleton variant="rectangular" height={315} />
      )}
    </Box>
  );
};

export default YouTubePlayer;
