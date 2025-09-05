import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const ProfilePage: React.FC = () => {
  const user = useAuthStore(state => state.user);
  const [formData, setFormData] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) {
      // const initial: Record<string, string> = {};
      // Object.entries(user).forEach(([k, v]) => {
      //   // stringify nested objects
      //   initial[k] = typeof v === 'object' ? JSON.stringify(v) : String(v);
      // });
      console.log('user', user);
      const initialFormData = {
        firstName: user.fullName?.split(' ')[0] || '',
        lastName: user.fullName?.split(' ')[1] || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address ? JSON.stringify(user.address) : '',
        avatar: user.avatar || '',
        bio: user.bio || '',
        darkMode: user.darkMode ? 'true' : 'false'
      }
      setFormData(initialFormData);
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: call updateProfile service with formData
    console.log('Save profile', formData);
  };

  if (!user) {
    return <div className="flex items-center justify-center min-h-screen">Loading profile...</div>;
  }

  return (
    <div className="flex items-center justify-center py-10 px-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Your Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {Object.entries(formData).map(([key, value]) => (
              <div key={key}>
                <label htmlFor={key} className="block text-sm font-medium capitalize">
                  {key.replace(/([A-Z])/g, ' $1')}
                </label>
                <Input
                  id={key}
                  name={key}
                  value={value}
                  onChange={handleChange}
                />
              </div>
            ))}
            <Button type="submit" className="w-full bg-highlight-foreground">Save Changes</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePage;