import { useState, useEffect, FC, ReactNode } from 'react';
import cn from 'classnames';

interface UrlProps {
  url: string;
  children?: ReactNode;
  className?: string;
  target?: string;
  rel?: string;
  preferHttps?: boolean;
}

export const formatUrl = (url: string, preferHttps: boolean = true): string => {
  if (!url) return '';
  
  const trimmedUrl = url.trim();
  
  // Check if URL already has a protocol
  if (trimmedUrl.match(/^https?:\/\//i)) {
    return trimmedUrl;
  }
  
  // Check if URL starts with www. or appears to be a domain
  if (trimmedUrl.match(/^(www\.|[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.[a-zA-Z]{2,})/i)) {
    return preferHttps ? `https://${trimmedUrl}` : `http://${trimmedUrl}`;
  }
  
  // For other cases, use the preferred protocol
  return preferHttps ? `https://${trimmedUrl}` : `http://${trimmedUrl}`;
};

export const Url: FC<UrlProps> = ({ 
  url, 
  children, 
  className = "text-blue-600 hover:text-blue-800 underline",
  target = "_blank",
  rel = "noopener noreferrer",
  preferHttps = true
}) => {
  const [formattedUrl, setFormattedUrl] = useState<string>('');
  const [isHttpsFallback, setIsHttpsFallback] = useState(false);
  
  useEffect(() => {
    if (!url) return;
    
    const initialUrl = formatUrl(url, preferHttps);
    setFormattedUrl(initialUrl);
    
    // If we're using HTTPS by default, test if the URL is accessible
    if (preferHttps && !url.match(/^https?:\/\//i)) {
      // Create a simple test to see if HTTPS works
      const testHttps = async () => {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3000);
          
          await fetch(initialUrl, { 
            method: 'HEAD', 
            mode: 'no-cors',
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
        } catch (error) {
          // If HTTPS fails, fallback to HTTP
          const httpUrl = formatUrl(url, false);
          setFormattedUrl(httpUrl);
          setIsHttpsFallback(true);
        }
      };
      
      testHttps();
    }
  }, [url, preferHttps]);
  
  if (!url) return null;
  
  const displayText = children || url;
  
  return (
    <a 
      href={formattedUrl} 
      className={cn(
        '!ml-0',
        className
      )}
      target={target}
      rel={rel}
      title={isHttpsFallback ? "This site uses HTTP (not HTTPS)" : undefined}
    >
      {displayText}
    </a>
  );
};