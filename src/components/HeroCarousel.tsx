import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import { openExternalUrl, membershipUrls } from '@/lib/externalBrowser';
import cn from "classnames";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { getCurrentYearEvents, getEventCustomFields, type CalendarEvent } from '@/services/calendar';
import { Calendar, MapPin } from 'lucide-react';
import Autoplay from "embla-carousel-autoplay";
import radioShowImg from '@/assets/radio-show.jpg';
import meetingImg from '@/assets/meeting-image.jpg';

const GHL_CALENDAR_ID = '9XpDcFHv3SmCUuHeuOOg';

interface MembershipSlide {
  type: 'membership';
  title: string;
  subtitle: string;
  description: string;
  bulletPoints: string[];
  bgImage: string;
  bgColor: string;
  ctaText: string;
  ctaLink: string;
}

interface EventSlide {
  type: 'event';
  event: CalendarEvent;
  coverImageUrl?: string;
}

interface MainSlide {
  type: 'main';
}

type SlideData = MainSlide | MembershipSlide | EventSlide;

const membershipSlides: MembershipSlide[] = [
  {
    type: 'membership',
    title: 'Basic Membership',
    subtitle: 'Perfect for Small Businesses',
    description: 'Get started with essential chamber benefits',
    bulletPoints: [
      'Chamber Directory Listing',
      'Chamber Newsletter Subscription',
      '$30 Fall Festival Booth',
      'Networking Opportunities',
      'Sponsorship Opportunities'
    ],
    bgImage: meetingImg,
    bgColor: 'bg-sky-800',
    ctaText: 'Join Basic',
    ctaLink: membershipUrls.basic
  },
  {
    type: 'membership',
    title: 'Enhanced Membership',
    subtitle: 'Great for Growing Businesses',
    description: 'Enhanced visibility and premium benefits',
    bulletPoints: [
      'All Basic Benefits',
      'Website Link in Directory',
      'Free Monthly Luncheon Ticket',
      'Annual Feature in Richfield Reaper',
      'Business Bio & Address Map'
    ],
    bgImage: '/richfieldutah_fall2024138-1-scaled.jpg',
    bgColor: 'bg-highlight-foreground',
    ctaText: 'Join Enhanced',
    ctaLink: membershipUrls.enhanced
  },
  {
    type: 'membership',
    title: 'Elite Membership',
    subtitle: 'For Established Enterprises',
    description: 'Maximum exposure and leadership opportunities',
    bulletPoints: [
      'All Enhanced Benefits',
      'Annual Radio Spotlight',
      'Free Luncheon Sponsorship',
      'Placemat Advertising',
      'Cover Image & Social Links'
    ],
    bgImage: '/20250213_084901-scaled-1.jpg',
    bgColor: 'bg-foreground',
    ctaText: 'Join Elite',
    ctaLink: membershipUrls.elite
  }
];

export const HeroCarousel = () => {
  const navigate = useNavigate();
  const [slides, setSlides] = useState<SlideData[]>([{ type: 'main' }]);
  const [loading, setLoading] = useState(true);

  const plugin = React.useRef(
    Autoplay({ delay: 5000, stopOnInteraction: true })
  );

  const handleMembershipClick = async (path: string) => {
    const handled = await openExternalUrl(path);
    if (!handled) {
      navigate(path);
    }
  };

  useEffect(() => {
    const fetchUpcomingEvents = async () => {
      try {
        const events = await getCurrentYearEvents(GHL_CALENDAR_ID);
        
        // Filter and sort upcoming events
        const now = new Date();
        
        const upcomingEvents = events
          .filter(event => {
            const eventDate = new Date(event.startTime);
            const isUpcoming = eventDate > now;
            return isUpcoming;
          })
          .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
          .slice(0, 3);

        // Fetch cover images for upcoming events
        const eventSlidesPromises = upcomingEvents.map(async (event) => {
          try {
            const customFields = await getEventCustomFields(event.id);
            return { 
              type: 'event' as const, 
              event,
              coverImageUrl: customFields.coverImageUrl 
            };
          } catch (error) {
            return { type: 'event' as const, event };
          }
        });

        const eventSlides = await Promise.all(eventSlidesPromises);

        // Build slides array
        const allSlides: SlideData[] = [
          { type: 'main' },
          ...eventSlides,
          ...membershipSlides
        ];
        setSlides(allSlides);
      } catch (error) {
        console.error('Error fetching events:', error);
        // Still show main and membership slides even if events fail
        setSlides([{ type: 'main' }, ...membershipSlides]);
      } finally {
        setLoading(false);
      }
    };

    fetchUpcomingEvents();
  }, []);

  const renderMainSlide = () => (
    <div className="flex flex-col lg:text-start px-4 md:px-32 gap-4">
      <main className="text-5xl md:text-5xl lg:text-5xl font-semibold">
        <h1 className="inline text-white">
          Why Join The{" "}
          <span className="inline bg-gradient-to-b from-highlight to-highlight text-transparent bg-clip-text text-nowrap">
            Chamber ?
          </span>
        </h1>
      </main>

      <p className="text-md text-left text-white font-extralight md:w-10/12 lg:mx-0 pt-0">
        Together, we can create a strong local economy,
        make connections, represent the interests of
        businesses with the government, and promote
        programs and events to improve our community.
      <br/>
      <span className='hidden md:inline'>
        Be assured that the Chamber is here
        to help as you reach your business, life,
        and professional goals because
      </span>
      </p>

      <h3 className="hidden sm:inline text-3xl bg-gradient-to-b from-highlight to-highlight text-transparent bg-clip-text py-0">
        Your Business is Our Business!
      </h3>

      <div className="space-y-4 md:space-y-0 md:space-x-4">
        <Button
          className="w-full md:w-1/3 bg-highlight font-semibold"
          onClick={() => navigate('/join')}
        >
          Join Now!
        </Button>
      </div>
    </div>
  );

  const renderEventSlide = (slide: EventSlide) => {
    const { event } = slide;
    const eventDate = new Date(event.startTime);

    return (
      <div className="lg:text-start space-y-6 mb-4 px-4 md:px-32">
        <div className="md:w-10/12 mx-auto lg:mx-0">
          <p className="text-sm text-highlight font-semibold mb-2">UPCOMING EVENT</p>
          
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
            {event.title}
          </h2>


          <div className="flex flex-col gap-4 text-white/90 mb-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-highlight" />
              <span>
                {eventDate.toLocaleDateString('en-US', { 
                  weekday: 'long',
                  month: 'long', 
                  day: 'numeric',
                  year: 'numeric'
                })}
              </span>
            </div>
            
            {event.description && (
              <p className="text-lg text-white/90 mb-4 line-clamp-3">
                {event.description}
              </p>
            )}
            
            {event.location && (
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-highlight" />
                <span>{event.location}</span>
              </div>
            )}
          </div>

          <div className="space-y-4 md:space-y-0 md:space-x-4">
            <Button
              className="w-full md:w-auto bg-highlight hover:bg-highlight/90 font-semibold"
              onClick={() => navigate('/events/' + event.id)}
            >
              View Event Details
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const renderMembershipSlide = (slide: MembershipSlide) => (
    <div className="lg:text-start mb-4 px-4 md:px-32">
      <main className="text-4xl md:text-5xl font-semibold">
        <h1 className="text-white mb-1">
          {slide.title}
        </h1>
        <p className="text-xl md:text-2xl text-white/90 mt-1 mb-2">
          {slide.subtitle}
        </p>
      </main>

      <p className="text-base text-white/90 font-light md:w-10/12 lg:mx-0">
        {slide.description}
      </p>

      <ul className="space-y-1 text-sm text-left text-white/90 md:w-10/12 lg:mx-0 mb-4">
        {slide.bulletPoints.map((point, idx) => (
          <li key={idx} className="flex items-start gap-2">
            <span className="text-highlight text-md">✓</span>
            <span>{point}</span>
          </li>
        ))}
      </ul>

      <div className="space-y-4 md:space-y-0 md:space-x-4">
        <Button
          className="w-full md:w-1/3 bg-highlight hover:bg-highlight/90 font-semibold"
          onClick={() => handleMembershipClick(slide.ctaLink)}
        >
          {slide.ctaText}
        </Button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <section className={cn(
        `bg-[url(@/assets/radio-show.jpg)] bg-cover bg-center bg-no-repeat bg-[#0f172a] bg-opacity-30 bg-blend-multiply`,
        'relative'
      )}>
        <div className={cn(
          "w-full h-full backdrop-blur-[0px] backdrop-brightness-50",
          "container grid place-items-center pt-14 py-10 md:py-16"
        )}>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-highlight"></div>
        </div>
      </section>
    );
  }

  return (
    <Carousel
      opts={{
        align: "start",
        loop: true,
      }}
      plugins={[plugin.current]}
      onMouseEnter={plugin.current.stop}
      onMouseLeave={plugin.current.reset}
      className="w-full"
    >
      <CarouselContent>
        {slides.map((slide, index) => {
          let bgStyle: React.CSSProperties = {};
          let bgColorClass = 'bg-[#0f172a]';

          if (slide.type === 'main') {
            bgStyle = { backgroundImage: `url(${radioShowImg})` };
          } else if (slide.type === 'membership') {
            bgStyle = { backgroundImage: `url(${slide.bgImage})` };
            bgColorClass = slide.bgColor;
          } else if (slide.type === 'event') {
            // Use event cover image if available, otherwise fall back to default
            const coverImage = slide.coverImageUrl || radioShowImg;
            bgStyle = { backgroundImage: `url(${coverImage})` };
          }

          return (
            <CarouselItem key={index}>
              <section 
                className={cn(
                  `bg-cover bg-center bg-no-repeat ${bgColorClass} bg-opacity-30 bg-blend-multiply`,
                  'relative h-[400px] md:h-[450px]'
                )}
                style={bgStyle}
              >
                <div className={cn(
                  "w-full h-full backdrop-blur-[0px] backdrop-brightness-50",
                  "container grid place-items-top py-12 md:py-12 gap-10 max-w-full overflow-hidden"
                )}>
                  {slide.type === 'main' && renderMainSlide()}
                  {slide.type === 'event' && renderEventSlide(slide)}
                  {slide.type === 'membership' && renderMembershipSlide(slide)}
                </div>
              </section>
            </CarouselItem>
          );
        })}
      </CarouselContent>
      
      <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 bg-transparent hover:bg-white/10 border-0 h-16" />
      <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 bg-transparent hover:bg-white/10 border-0 h-16" />
    </Carousel>
  );
};
