import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { getApiBaseUrl } from '@/lib/config';

export default function FormPage() {
  const { formId } = useParams<{ formId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formName, setFormName] = useState<string>('Form');
  const [iframeHeight, setIframeHeight] = useState<string>('600px');
  const [processedEmbedCode, setProcessedEmbedCode] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!formId) {
      setError('No form ID provided');
      setLoading(false);
      return;
    }

    // Fetch form embed from API (secure server-side storage)
    const apiBaseUrl = getApiBaseUrl();
    fetch(`${apiBaseUrl}/forms/embeds/${formId}`)
      .then(res => {
        if (!res.ok) {
          throw new Error('Form not found');
        }
        return res.json();
      })
      .then(data => {
        const embedCode = data.embedCode;
        setFormName(data.name);
        
        // Extract data-height attribute from iframe if present
        const heightMatch = embedCode.match(/data-height=["'](\d+)["']/i);
        let height = '600';
        if (heightMatch && heightMatch[1]) {
          height = heightMatch[1];
          setIframeHeight(`${height}px`);
          console.log('📏 Extracted height from data-height:', height);
        }
        
        // Process the embed code to ensure iframe uses the correct height
        let processed = embedCode;
        
        // Add style attribute to iframe for guaranteed height and disable scrolling
        processed = processed.replace(/(<iframe[^>]*)(style=["'][^"']*["'])/i, `$1style="height: ${height}px; width: 100%; overflow: hidden;"`);
        
        // If no style attribute, add it
        if (!processed.match(/style=["'][^"']*["']/i)) {
          processed = processed.replace(/(<iframe[^>]*)(>)/i, `$1 style="height: ${height}px; width: 100%; overflow: hidden;" scrolling="no"$2`);
        } else {
          // Add scrolling="no" attribute
          if (!processed.match(/scrolling=/i)) {
            processed = processed.replace(/(<iframe[^>]*)(>)/i, `$1 scrolling="no"$2`);
          }
        }
        
        console.log('📝 Processed embed code:', processed.substring(0, 200));
        setProcessedEmbedCode(processed);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching form embed:', error);
        setError('The requested form could not be found.');
        setLoading(false);
      });
  }, [formId]);

  // Handle iframe message events (e.g., form submission)
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      // Only accept messages from GoHighLevel domains
      if (!event.origin.includes('leadconnectorhq.com')) return;

      // Handle form submission success
      if (event.data?.type === 'form-submitted') {
        toast({
          title: 'Success',
          description: 'Form submitted successfully!',
        });
      }
    }

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [toast]);

  if (loading) {
    return (
      <div className="container mx-auto py-16 px-4">
        <div className="flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-3 text-lg">Loading form...</span>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto py-16 px-4 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !processedEmbedCode) {
    return (
      <div className="container mx-auto py-16 px-4">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-red-600">Form Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              {error || 'The requested form could not be found.'}
            </p>
            <Button onClick={() => navigate('/')} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-0 sm:px-4">
      {/* Header with back button */}
      <div className="max-w-2xl mb-6 flex items-center gap-4 mx-auto">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{formName}</h1>
        </div>
      </div>

      {/* Form Container */}
      {/* <Card className="max-w-2xl mx-auto py-8" style={{ minHeight: iframeHeight }}>
        <CardContent className="p-0"> */}
          {/* Embedded Form - renders raw HTML with forced height */}
          <div 
            className="w-full overflow-hidden max-w-2xl mx-auto"
            style={{ minHeight: iframeHeight, overflow: 'hidden' }}
            dangerouslySetInnerHTML={{ __html: processedEmbedCode }}
          />
        {/* </CardContent>
      </Card> */}

      {/* Additional Info */}
      <div className="max-w-4xl mx-auto mt-4 text-center text-sm text-gray-500">
        Need help? <a href="/contact" className="text-primary hover:underline">Contact us</a>
      </div>
    </div>
  );
}
