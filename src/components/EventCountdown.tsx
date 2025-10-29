import React, { useState, useEffect } from 'react';
import cn from 'classnames';

interface EventCountdownProps {
  startTime: string;
  className?: string;
  scale?: 'xs' | 'sm' | 'md' | 'lg';
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
}

export const EventCountdown: React.FC<EventCountdownProps> = ({ 
  startTime, 
  className,
  scale = 'lg' 
}) => {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false
  });

  // Define scale-dependent styles
  const scaleStyles = {
    xs: {
      container: 'max-w-sm',
      padding: 'p-1',
      numberSize: 'text-lg md:text-xl',
      labelSize: 'text-xs'
    },
    sm: {
      container: 'max-w-md',
      padding: 'p-1.5',
      numberSize: 'text-xl md:text-2xl',
      labelSize: 'text-xs'
    },
    md: {
      container: 'max-w-xl',
      padding: 'p-2',
      numberSize: 'text-2xl md:text-3xl',
      labelSize: 'text-xs md:text-sm'
    },
    lg: {
      container: 'max-w-2xl',
      padding: 'p-2',
      numberSize: 'text-3xl md:text-4xl',
      labelSize: 'text-sm'
    }
  };

  const styles = scaleStyles[scale];

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date().getTime();
      const eventTime = new Date(startTime).getTime();
      const difference = eventTime - now;

      console.log('=== COUNTDOWN DEBUG ===');
      console.log('Current time:', new Date(now).toString());
      console.log('Event time:', new Date(eventTime).toString());
      console.log('Difference (ms):', difference);
      console.log('Difference (minutes):', difference / (1000 * 60));
      console.log('startTime prop:', startTime);

      if (difference <= 0) {
        setTimeRemaining({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          isExpired: true
        });
        return;
      }

      // Calculate time components more carefully
      const totalSeconds = Math.floor(difference / 1000);
      const totalMinutes = Math.floor(totalSeconds / 60);
      const totalHours = Math.floor(totalMinutes / 60);
      const days = Math.floor(totalHours / 24);
      
      const hours = totalHours % 24;
      const minutes = totalMinutes % 60;
      const seconds = totalSeconds % 60;

      console.log('Calculated:', { days, hours, minutes, seconds, totalMinutes, totalHours });

      setTimeRemaining({
        days,
        hours,
        minutes,
        seconds,
        isExpired: false
      });
    };

    // Calculate immediately
    calculateTimeRemaining();

    // Update every second
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  if (timeRemaining.isExpired) {
    return null;
  }

  return (
    <div className={cn("w-full px-4", styles.container, className)}>
      <div className="items-center rounded-lg flex bg-gradient-to-b from-amber-400 to-primary bg-opacity-20 backdrop-blur-md">
        <div className={cn("w-full flex flex-col items-center justify-center", styles.padding)}>
          <span className={cn("font-bold text-card", styles.numberSize)}>
            {String(timeRemaining.days).padStart(2, '0')}
          </span>
          <span className={cn("font-medium text-card", styles.labelSize)}>Days</span>
        </div>
        <div className={cn("flex items-start font-bold text-card -mt-5", styles.numberSize)}>:</div>
        <div className={cn("w-full flex flex-col items-center justify-center", styles.padding)}>
          <span className={cn("font-bold text-card", styles.numberSize)}>
            {String(timeRemaining.hours).padStart(2, '0')}
          </span>
          <span className={cn("font-medium text-card", styles.labelSize)}>Hours</span>
        </div>
        <div className={cn("flex items-start font-bold text-card -mt-5", styles.numberSize)}>:</div>
        <div className={cn("w-full flex flex-col items-center justify-center", styles.padding)}>
          <span className={cn("font-bold text-card", styles.numberSize)}>
            {String(timeRemaining.minutes).padStart(2, '0')}
          </span>
          <span className={cn("font-medium text-card", styles.labelSize)}>Minutes</span>
        </div>
        <div className={cn("flex items-start font-bold text-card -mt-5", styles.numberSize)}>:</div>
        <div className={cn("w-full flex flex-col items-center justify-center", styles.padding)}>
          <span className={cn("font-bold text-card", styles.numberSize)}>
            {String(timeRemaining.seconds).padStart(2, '0')}
          </span>
          <span className={cn("font-medium text-card", styles.labelSize)}>Seconds</span>
        </div>
      </div>
    </div>
  );
};
