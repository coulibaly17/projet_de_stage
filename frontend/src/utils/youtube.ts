export const isYouTubeUrl = (url: string): boolean => {
  const youtubeRegex = /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]+)(?:\S+)?$/;
  return youtubeRegex.test(url);
};

export const getYouTubeVideoId = (url: string): string | null => {
  const youtubeRegex = /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]+)(?:\S+)?$/;
  const match = url.match(youtubeRegex);
  return match ? match[1] : null;
};
