import { useState, useEffect } from 'react';
import { Link2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { getApiBaseUrl } from '@/lib/config';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface FormSelectorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectForm?: (formId: string, formName: string, formUrl: string) => void;
  initialUrl?: string;
  initialText?: string;
}

export default function FormSelectorDialog({
  open,
  onOpenChange,
  onSelectForm,
  initialUrl,
  initialText,
}: FormSelectorDialogProps) {
  const [linkType, setLinkType] = useState<'embed' | 'url'>('embed');
  const [basicEmbedCode, setBasicEmbedCode] = useState('');
  const [enhancedEmbedCode, setEnhancedEmbedCode] = useState('');
  const [eliteEmbedCode, setEliteEmbedCode] = useState('');
  const [externalUrl, setExternalUrl] = useState('');
  const [formName, setFormName] = useState('');
  const { toast } = useToast();

  // Extract embed code and name from API when editing
  useEffect(() => {
    if (open) {
      if (initialUrl && initialText) {
        // Extract form ID from URL and fetch from API
        const formId = extractFormId(initialUrl);
        if (formId) {
          const apiBaseUrl = getApiBaseUrl();
          fetch(`${apiBaseUrl}/forms/embeds/${formId}`)
            .then(res => res.json())
            .then(data => {
              setFormName(data.name);
              // Check if it's a URL link or embed codes
              if (data.externalUrl) {
                setLinkType('url');
                setExternalUrl(data.externalUrl);
              } else {
                setLinkType('embed');
                setBasicEmbedCode(data.basicEmbedCode || '');
                setEnhancedEmbedCode(data.enhancedEmbedCode || '');
                setEliteEmbedCode(data.eliteEmbedCode || '');
              }
            })
            .catch(error => {
              console.error('Error fetching form embed:', error);
              if (initialText) {
                setFormName(initialText);
              }
            });
        } else if (initialText) {
          setFormName(initialText);
        }
      } else {
        // Reset when opening for new insertion
        setLinkType('embed');
        setBasicEmbedCode('');
        setEnhancedEmbedCode('');
        setEliteEmbedCode('');
        setExternalUrl('');
        setFormName('');
      }
    }
  }, [open, initialUrl, initialText]);

  async function handleInsertLink() {
    if (!formName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a form name',
        variant: 'destructive',
      });
      return;
    }

    if (linkType === 'embed') {
      // At least one embed code is required
      if (!basicEmbedCode.trim() && !enhancedEmbedCode.trim() && !eliteEmbedCode.trim()) {
        toast({
          title: 'Error',
          description: 'Please provide at least one embed code',
          variant: 'destructive',
        });
        return;
      }
    } else {
      // URL is required
      if (!externalUrl.trim()) {
        toast({
          title: 'Error',
          description: 'Please enter a URL',
          variant: 'destructive',
        });
        return;
      }
    }

    try {
      // Save embed code or URL to server or update existing
      const apiBaseUrl = getApiBaseUrl();
      const apiUrl = initialUrl 
        ? `${apiBaseUrl}/forms/embeds/${extractFormId(initialUrl)}`
        : `${apiBaseUrl}/forms/embeds`;
      
      const method = initialUrl ? 'PUT' : 'POST';
      
      // Always send all fields, setting unused ones to empty string to clear them
      const payload = linkType === 'embed' 
        ? { 
            name: formName, 
            basicEmbedCode, 
            enhancedEmbedCode, 
            eliteEmbedCode,
            externalUrl: '' // Clear external URL when using embed codes
          }
        : { 
            name: formName, 
            basicEmbedCode: '', // Clear embed codes when using external URL
            enhancedEmbedCode: '',
            eliteEmbedCode: '',
            externalUrl 
          };
      
      const response = await fetch(apiUrl, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to save form embed');
      }

      const savedEmbed = await response.json();
      // Store as relative path to work across all environments
      const formUrl = `/forms/${savedEmbed.id}`;
      
      if (onSelectForm) {
        onSelectForm(savedEmbed.id, formName, formUrl);
      }

      onOpenChange(false);
      setBasicEmbedCode('');
      setEnhancedEmbedCode('');
      setEliteEmbedCode('');
      setExternalUrl('');
      setFormName('');
    } catch (error) {
      console.error('Error saving form embed:', error);
      toast({
        title: 'Error',
        description: 'Failed to save form embed. Please try again.',
        variant: 'destructive',
      });
    }
  }

  function extractFormId(url: string): string {
    const match = url.match(/\/forms\/([^?]+)/);
    return match ? match[1] : '';
  }

  function handleCancel() {
    setLinkType('embed');
    setBasicEmbedCode('');
    setEnhancedEmbedCode('');
    setEliteEmbedCode('');
    setExternalUrl('');
    setFormName('');
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="w-5 h-5" />
            {initialUrl ? 'Edit Form Button' : 'Insert Form Button'}
          </DialogTitle>
          <DialogDescription>
            {initialUrl 
              ? 'Update the form name, embed codes, or URL for this form button.'
              : 'Create a button that links to a form. You can either provide embed codes for different membership tiers or link to an external URL.'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="form-name">Form Name</Label>
            <Input
              id="form-name"
              placeholder="e.g., Membership Application"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
            />
          </div>

          <Tabs value={linkType} onValueChange={(value) => setLinkType(value as 'embed' | 'url')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="embed">Embed Codes</TabsTrigger>
              <TabsTrigger value="url">External URL</TabsTrigger>
            </TabsList>
            
            <TabsContent value="embed" className="space-y-4 mt-4">
              <p className="text-sm text-muted-foreground">
                Provide embed codes for different membership tiers. At least one is required.
              </p>
              
              <div className="space-y-2">
                <Label htmlFor="basic-embed-code">Basic Embed Code</Label>
                <Textarea
                  id="basic-embed-code"
                  placeholder='Paste basic embed code here (e.g., <iframe src="..." ...></iframe>)'
                  value={basicEmbedCode}
                  onChange={(e) => setBasicEmbedCode(e.target.value)}
                  rows={4}
                  className="font-mono text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="enhanced-embed-code">Enhanced Embed Code</Label>
                <Textarea
                  id="enhanced-embed-code"
                  placeholder='Paste enhanced embed code here (e.g., <iframe src="..." ...></iframe>)'
                  value={enhancedEmbedCode}
                  onChange={(e) => setEnhancedEmbedCode(e.target.value)}
                  rows={4}
                  className="font-mono text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="elite-embed-code">Elite Embed Code</Label>
                <Textarea
                  id="elite-embed-code"
                  placeholder='Paste elite embed code here (e.g., <iframe src="..." ...></iframe>)'
                  value={eliteEmbedCode}
                  onChange={(e) => setEliteEmbedCode(e.target.value)}
                  rows={4}
                  className="font-mono text-sm"
                />
              </div>
              
              <p className="text-xs text-gray-500">
                These can be iframes, script tags, or any other embed code from your form provider.
              </p>
            </TabsContent>
            
            <TabsContent value="url" className="space-y-4 mt-4">
              <p className="text-sm text-muted-foreground">
                Provide a URL that users will be redirected to when they click the form button.
              </p>
              
              <div className="space-y-2">
                <Label htmlFor="external-url">External URL</Label>
                <Input
                  id="external-url"
                  type="url"
                  placeholder="https://example.com/your-form"
                  value={externalUrl}
                  onChange={(e) => setExternalUrl(e.target.value)}
                />
                <p className="text-xs text-gray-500">
                  Enter the complete URL including https://
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleInsertLink}>
            {initialUrl ? 'Update Form Button' : 'Insert Form Button'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
