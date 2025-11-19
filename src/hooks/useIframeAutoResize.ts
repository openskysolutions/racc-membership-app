import { useEffect } from 'react';

/**
 * Hook to automatically resize iframes to fit their content
 * Uses multiple techniques to handle both same-origin and cross-origin iframes
 */
export function useIframeAutoResize(containerRef: React.RefObject<HTMLElement>) {
  useEffect(() => {
    console.log('[Iframe Resize] Hook started');
    
    if (!containerRef.current) {
      console.log('[Iframe Resize] No container ref - will retry on next render');
      return;
    }
    
    console.log('[Iframe Resize] Container found:', containerRef.current);

    const handleIframe = (iframe: HTMLIFrameElement) => {
      const iframeSrc = iframe.src || iframe.getAttribute('src') || 'no-src';
      console.log('[Iframe Resize] Handling iframe:', iframeSrc);
      
      // Log ALL iframe attributes to see what GoHighLevel provides
      console.log('[Iframe Resize] All iframe attributes:', {
        'data-height': iframe.getAttribute('data-height'),
        'height': iframe.getAttribute('height'),
        'style.height': iframe.style.height,
        'scrolling': iframe.getAttribute('scrolling'),
        'all-attributes': Array.from(iframe.attributes).map(attr => `${attr.name}="${attr.value}"`).join(', ')
      });
      
      // Check if GoHighLevel set a data-height attribute
      const dataHeight = iframe.getAttribute('data-height');
      if (dataHeight) {
        const heightValue = dataHeight.replace('px', ''); // Remove 'px' if present
        console.log(`[Iframe Resize] ✅ Found data-height attribute: ${heightValue}px - using this!`);
        iframe.style.setProperty('height', `${heightValue}px`, 'important');
        iframe.style.setProperty('min-height', `${heightValue}px`, 'important');
        iframe.style.setProperty('max-height', 'none', 'important');
        return; // Skip other resize attempts - we have the exact height!
      }
      
      // Also check parent element wrapper
      const parentDataHeight = iframe.parentElement?.getAttribute('data-iframe-height');
      if (parentDataHeight) {
        console.log(`[Iframe Resize] ✅ Found parent data-iframe-height: ${parentDataHeight}px`);
        iframe.style.setProperty('height', `${parentDataHeight}px`, 'important');
        iframe.style.setProperty('min-height', `${parentDataHeight}px`, 'important');
        return;
      }
      
      console.log('[Iframe Resize] No data-height found, will use fallback');
      let hasResized = false;

      // Method 1: Try to access iframe content directly (same-origin only)
      const tryDirectResize = () => {
        try {
          const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
          if (iframeDoc && iframeDoc.body) {
            const body = iframeDoc.body;
            const html = iframeDoc.documentElement;
            
            // Get the actual content height
            const contentHeight = Math.max(
              body.scrollHeight,
              body.offsetHeight,
              html.scrollHeight,
              html.offsetHeight
            );
            
            console.log(`[Iframe Resize] Direct access - measured heights:`, {
              bodyScrollHeight: body.scrollHeight,
              bodyOffsetHeight: body.offsetHeight,
              htmlScrollHeight: html.scrollHeight,
              htmlOffsetHeight: html.offsetHeight,
              maxHeight: contentHeight
            });
            
            // Only accept heights that seem reasonable (more than the default min-height)
            if (contentHeight > 600) {
              iframe.style.setProperty('height', `${contentHeight}px`, 'important');
              iframe.style.setProperty('min-height', `${contentHeight}px`, 'important');
              hasResized = true;
              console.log(`[Iframe Resize] ✅ SUCCESS - Set height to ${contentHeight}px`);
              return true;
            } else {
              console.log(`[Iframe Resize] Height ${contentHeight}px seems too small, ignoring`);
            }
          }
        } catch (e) {
          console.log(`[Iframe Resize] Cross-origin blocked - iframe src: ${iframe.src}`);
        }
        return false;
      };

      // Method 2: Listen for resize messages from the iframe
      const messageHandler = (event: MessageEvent) => {
        // Log ALL messages to see what's being sent
        if (event.source === iframe.contentWindow) {
          console.log('[Iframe Resize] Received postMessage from iframe:', event.data);
          console.log('[Iframe Resize] Message type:', typeof event.data, 'Is array:', Array.isArray(event.data));
          
          // When iframe signals it's loaded, request its height
          if (Array.isArray(event.data) && event.data.includes('iframeLoaded')) {
            console.log('[Iframe Resize] GoHighLevel iframe loaded, requesting height...');
            // Try to request height from iframe - try multiple message formats
            try {
              iframe.contentWindow?.postMessage({ action: 'getHeight' }, '*');
              iframe.contentWindow?.postMessage({ type: 'getHeight' }, '*');
              iframe.contentWindow?.postMessage('getHeight', '*');
              iframe.contentWindow?.postMessage({ method: 'getFrameHeight' }, '*');
            } catch (e) {
              console.log('[Iframe Resize] Could not request height from iframe');
            }
          }
        } else {
          // Log messages from other sources too (might be useful)
          const origin = (event as any).origin || 'unknown';
          if (origin.includes('leadconnector') || origin.includes('gohighlevel')) {
            console.log('[Iframe Resize] Message from GoHighLevel (different window):', event.data);
          }
        }
        
        try {
          const data = event.data;
          
          // Handle various message formats (GoHighLevel and others)
          let height: number | null = null;
          
          if (typeof data === 'number') {
            height = data;
            console.log('[Iframe Resize] Message is a number (height):', height);
          } else if (data && typeof data === 'object' && !Array.isArray(data)) {
            console.log('[Iframe Resize] Message is an object, checking for height properties...');
            
            // GoHighLevel specific format
            if (data.type === 'hsFormCallback' && data.eventName === 'onFormReady') {
              console.log('[Iframe Resize] GoHighLevel form ready event');
            }
            
            // Check common height properties
            height = data.height || data.frameHeight || data.scrollHeight || data.clientHeight || data.contentHeight;
            
            // GoHighLevel sometimes sends height in nested objects
            if (!height && data.data && typeof data.data === 'object' && data.data.height) {
              height = data.data.height;
            }
            
            if (height) {
              console.log('[Iframe Resize] Found height in message:', height);
            } else {
              console.log('[Iframe Resize] No height found in message. Message keys:', Object.keys(data));
            }
          }
          
          if (height && typeof height === 'number' && height > 100) {
            iframe.style.setProperty('height', `${height}px`, 'important');
            iframe.style.setProperty('min-height', `${height}px`, 'important');
            hasResized = true;
            console.log(`[Iframe Resize] ✅ SUCCESS via postMessage - Set height to ${height}px`);
          }
        } catch (e) {
          console.log('[Iframe Resize] Error parsing message:', e);
        }
      };

      window.addEventListener('message', messageHandler);

      // Method 3: Observe the iframe for size changes
      let resizeObserver: ResizeObserver | null = null;
      try {
        resizeObserver = new ResizeObserver(() => {
          if (!hasResized) {
            tryDirectResize();
          }
        });
        resizeObserver.observe(iframe);
      } catch (e) {
        // ResizeObserver not supported
      }

      // Method 4: Set scrolling attribute and styling
      iframe.setAttribute('scrolling', 'no');
      iframe.style.setProperty('overflow', 'hidden', 'important');
      iframe.style.setProperty('border', 'none', 'important');

      // Try to resize on load
      const onLoad = () => {
        // Try immediate resize
        if (tryDirectResize()) return;

        // If that fails, try again after delays (for dynamic content)
        const delays = [100, 300, 500, 1000, 2000];
        delays.forEach(delay => {
          setTimeout(() => {
            if (!hasResized) {
              tryDirectResize();
            }
          }, delay);
        });

        // Check the actual rendered dimensions of the iframe after delay
        setTimeout(() => {
          if (!hasResized) {
            console.log('[Iframe Resize] Checking iframe rendered dimensions...');
            
            // Try to get dimensions from the iframe element itself
            const rect = iframe.getBoundingClientRect();
            const computedStyle = window.getComputedStyle(iframe);
            
            console.log('[Iframe Resize] Iframe dimensions:', {
              boundingHeight: rect.height,
              offsetHeight: iframe.offsetHeight,
              scrollHeight: iframe.scrollHeight,
              clientHeight: iframe.clientHeight,
              computedHeight: computedStyle.height,
              computedMinHeight: computedStyle.minHeight
            });
          }
        }, 1000);
        
        // If still not resized after 3 seconds, use a generous fallback
        // This happens because GoHighLevel iframes are cross-origin and don't allow height detection
        setTimeout(() => {
          if (!hasResized) {
            // Check if it's a GoHighLevel iframe
            const isGHL = iframe.src && (
              iframe.src.includes('gohighlevel') || 
              iframe.src.includes('msgsndr.com') ||
              iframe.src.includes('leadconnectorhq.com') ||
              iframe.src.includes('survey')
            );
            
            // Use reasonable height for GHL forms based on common form lengths
            // If forms are longer, this can be adjusted per-page or increased globally
            const fallbackHeight = isGHL ? '1300px' : '1800px';
            iframe.style.setProperty('height', fallbackHeight, 'important');
            iframe.style.setProperty('min-height', fallbackHeight, 'important');
            iframe.style.setProperty('max-height', 'none', 'important');
            console.log(`[Iframe Resize] Using fallback height (${fallbackHeight}) - ${isGHL ? 'GoHighLevel' : 'Generic'} iframe`);
            console.log('[Iframe Resize] ⚠️ Cross-origin iframes cannot report their height. For exact sizing, GoHighLevel must send postMessage with height data.');
            console.log('[Iframe Resize] Applied styles:', {
              height: iframe.style.height,
              minHeight: iframe.style.minHeight,
              computedHeight: window.getComputedStyle(iframe).height
            });
          }
        }, 3000);
      };

      if (iframe.contentDocument?.readyState === 'complete') {
        onLoad();
      } else {
        iframe.addEventListener('load', onLoad);
      }

      return () => {
        window.removeEventListener('message', messageHandler);
        if (resizeObserver) {
          resizeObserver.disconnect();
        }
        iframe.removeEventListener('load', onLoad);
      };
    };

    // Handle all iframes in the container
    const setupIframes = () => {
      const iframes = containerRef.current?.querySelectorAll('iframe');
      console.log('[Iframe Resize] Found iframes:', iframes?.length || 0);
      if (!iframes || iframes.length === 0) return;

      const cleanupFunctions: Array<() => void> = [];
      iframes.forEach((iframe) => {
        const cleanup = handleIframe(iframe);
        if (cleanup) cleanupFunctions.push(cleanup);
      });

      return () => {
        cleanupFunctions.forEach(cleanup => cleanup());
      };
    };

    // Use MutationObserver to detect dynamically added iframes
    const mutationObserver = new MutationObserver(() => {
      setupIframes();
    });

    mutationObserver.observe(containerRef.current, {
      childList: true,
      subtree: true,
    });

    // Initial setup
    const cleanupIframes = setupIframes();

    return () => {
      mutationObserver.disconnect();
      if (cleanupIframes) cleanupIframes();
    };
  }, [containerRef.current]); // Re-run when container becomes available
}
