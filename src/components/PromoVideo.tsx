import { useEffect, useRef, useState } from 'react';
import { Play } from 'lucide-react';

// Hosted on DigitalOcean Spaces (CDN-enabled), bucket "rac".
const VIDEO_URL = 'https://rac.sfo3.cdn.digitaloceanspaces.com/promo-web-720-crf28.mp4';
const POSTER_URL = 'https://rac.sfo3.cdn.digitaloceanspaces.com/promo-poster.jpg';

/**
 * Homepage promo video. Stays mounted as just a poster image + play button
 * until clicked, and the <video> (with its network request) is only
 * created at that point - and separately, the section itself isn't
 * rendered into the DOM with a real <video> src until scrolled near
 * view, via IntersectionObserver, so it costs nothing on initial load.
 */
export default function PromoVideo() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isNearView, setIsNearView] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsNearView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="my-8 mx-auto max-w-6xl px-3 md:px-6" ref={containerRef}>
      <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black">
        {isNearView && isPlaying ? (
          <video
            className="h-full w-full"
            src={VIDEO_URL}
            poster={POSTER_URL}
            controls
            autoPlay
            playsInline
            preload="none"
          />
        ) : (
          <button
            type="button"
            onClick={() => setIsPlaying(true)}
            aria-label="Play chamber promotional video"
            className="group absolute inset-0 h-full w-full"
          >
            {isNearView && (
              <img
                src={POSTER_URL}
                alt="Richfield Area Chamber of Commerce promotional video"
                loading="lazy"
                className="h-full w-full object-cover"
              />
            )}
            <span className="absolute inset-0 flex items-center justify-center bg-black/20 transition-colors group-hover:bg-black/30">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 shadow-lg transition-transform group-hover:scale-110">
                <Play className="h-7 w-7 translate-x-0.5 text-black" fill="currentColor" />
              </span>
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
