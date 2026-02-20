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
import { getAppBaseUrl, getApiBaseUrl } from '@/lib/config';

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
  const [embedCode, setEmbedCode] = useState('');
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
              setEmbedCode(data.embedCode);
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
        setEmbedCode('');
        setFormName('');
      }
    }
  }, [open, initialUrl, initialText]);

  async function handleInsertLink() {
    if (!embedCode.trim()) {
      toast({
        title: 'Error',
        description: 'Please paste the embed code',
        variant: 'destructive',
      });
      return;
    }

    if (!formName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a form name',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Save embed code to server or update existing
      const appBaseUrl = getAppBaseUrl();
      const apiBaseUrl = getApiBaseUrl();
      const apiUrl = initialUrl 
        ? `${apiBaseUrl}/forms/embeds/${extractFormId(initialUrl)}`
        : `${apiBaseUrl}/forms/embeds`;
      
      const method = initialUrl ? 'PUT' : 'POST';
      
      const response = await fetch(apiUrl, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formName, embedCode }),
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
      setEmbedCode('');
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
    setEmbedCode('');
    setFormName('');
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="w-5 h-5" />
            {initialUrl ? 'Edit Form Button' : 'Insert Form Button'}
          </DialogTitle>
          <DialogDescription>
            {initialUrl 
              ? 'Update the form name or embed code for this form button.'
              : 'Paste the complete embed code from GoHighLevel (or any other form provider) and give it a name. This will create a button that links to a dedicated form page.'
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

          <div className="space-y-2">
            <Label htmlFor="embed-code">Embed Code</Label>
            <Textarea
              id="embed-code"
              placeholder='Paste the complete embed code here (e.g., <iframe src="..." ...></iframe>)'
              value={embedCode}
              onChange={(e) => setEmbedCode(e.target.value)}
              rows={8}
              className="font-mono text-sm"
            />
            <p className="text-xs text-gray-500">
              This can be an iframe, script tag, or any other embed code from your form provider.
            </p>
          </div>
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
