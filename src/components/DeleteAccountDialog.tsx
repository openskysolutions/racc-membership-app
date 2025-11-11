import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/services/apiClient';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const DeleteAccountDialog: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const { user, handleLogout } = useAuthStore();
  const navigate = useNavigate();

  const handleDelete = async () => {
    if (confirmText.toLowerCase() !== 'delete my account') {
      toast.error('Please type the confirmation text exactly as shown');
      return;
    }

    if (!user?.ghlContactId) {
      toast.error('User information not found');
      return;
    }

    setIsDeleting(true);

    try {
      const response = await api.delete(`/members/${user.ghlContactId}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete account');
      }

      toast.success('Your account has been successfully deleted');
      
      // Log out and redirect to home
      await handleLogout();
      navigate('/');
    } catch (error: any) {
      console.error('Failed to delete account:', error);
      toast.error(error.message || 'Failed to delete account');
    } finally {
      setIsDeleting(false);
      setOpen(false);
    }
  };

  const handleCancel = () => {
    setConfirmText('');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className='border-destructive text-destructive hover:bg-destructive/10 hover:border-destructive hover:text-destructive'
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete Account
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Delete Account
          </DialogTitle>
          <DialogDescription className="space-y-3 pt-2">
            <p className="font-semibold text-foreground">
              This action cannot be undone!
            </p>
            <p>
              Deleting your account will:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Remove your login credentials from the membership portal</li>
              <li>Delete all your active sessions</li>
              <li>Sign you out immediately</li>
            </ul>
            {/* <p className="text-sm bg-muted p-3 rounded-md">
              <strong>Note:</strong> Your profile information, contact details, and membership status 
              in our CRM system will remain unchanged. This only removes your portal access.
            </p> */}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="confirm">
              Type <span className="font-mono font-bold">delete my account</span> to confirm:
            </Label>
            <Input
              id="confirm"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="delete my account"
              disabled={isDeleting}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting || confirmText.toLowerCase() !== 'delete my account'}
          >
            {isDeleting ? 'Deleting...' : 'Delete My Account'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteAccountDialog;
