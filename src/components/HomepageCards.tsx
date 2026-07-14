import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { getFeaturedEventId } from '@/services/settingsService';
import EventCoverImage from '@/assets/explosive-event-cover.jpg';
import { getEventById, getUpcomingEvents } from '@/services/calendar';
import type { CalendarEvent } from '@/services/calendar';

const GHL_CALENDAR_ID = '9XpDcFHv3SmCUuHeuOOg';

export const HomepageCards: React.FC = () => {
  const navigate = useNavigate();
  const [featuredEvent, setFeaturedEvent] = useState<CalendarEvent | null>(null);

  useEffect(() => {
    getFeaturedEventId()
      .then(async id => {
        if (id) return getEventById(id);
        // Fall back to the next upcoming event
        const upcoming = await getUpcomingEvents(GHL_CALENDAR_ID);
        return upcoming[0] ?? null;
      })
      .then(event => setFeaturedEvent(event))
      .catch(() => setFeaturedEvent(null));
  }, []);

  const cards = [
    {
      key: 'join',
      eyebrow: 'Become a Member',
      title: 'Join the Chamber',
      subtitle: 'Join today',
      backgroundColor: 'bg-gradient-to-b from-highlight to-highlight-foreground',
      onClick: () => navigate('/join'),
    },
    {
      key: 'directory',
      eyebrow: 'Our Community',
      title: 'Member Directory',
      subtitle: 'Our members',
      backgroundColor: 'bg-gradient-to-b from-neutral-500 to-neutral-600',
      onClick: () => navigate('/members'),
    },
    {
      key: 'event',
      eyebrow: 'Upcoming Event',
      title: featuredEvent ? featuredEvent.title : 'Upcoming Events',
      subtitle: featuredEvent
        ? new Date(featuredEvent.startTime).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })
        : 'See what\'s happening',
      backgroundColor: 'bg-gradient-to-b from-neutral-500 to-neutral-600',
      bgImage: featuredEvent?.coverImageUrl || EventCoverImage,
      onClick: () =>
        featuredEvent
          ? navigate('/events/' + featuredEvent.id)
          : navigate('/calendar'),
    },
  ];

  return (
    <div className="relative z-10 -mt-10 md:-mt-16 px-4 sm:px-6 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {cards.map(card => (
          <button
            key={card.key}
            onClick={card.onClick}
            className={`group flex h-48 items-start gap-6 rounded-xl p-6 shadow-md hover:shadow-lg transition-all text-left overflow-hidden relative border border-transparent ${card.bgImage ? '' : card.backgroundColor}`}
            style={card.bgImage ? {
              backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.35), rgba(0,0,0,0.7)), url(${card.bgImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            } : undefined}
          >
            <div className="min-w-0 h-full flex flex-col">
              <p className="text-md font-medium uppercase tracking-wider mb-0.5 text-white">
                {card.eyebrow}
              </p>
              <h3 className="flex-1 text-3xl font-semibold leading-tight line-clamp-2 text-white">
                {card.title}
              </h3>
              <p className="text-md mt-1 line-clamp-1 text-white">
                {card.subtitle}
              </p>
            </div>
            <ChevronRight className="shrink-0 ml-auto h-8 w-8 transition-colors self-center text-white/70 group-hover:text-white" />
          </button>
        ))}
      </div>
    </div>
  );
};
