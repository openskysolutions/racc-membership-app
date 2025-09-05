import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { getMembersList } from '@/services/members';

const NominationsPage: React.FC = () => {
  const [members, setMembers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMembersList()
      .then(list => setMembers(list))
      .catch(err => console.error('Failed to load members', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="py-10 px-4 mx-auto max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Member Nominations</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc list-inside space-y-1">
            {members.map((name, idx) => (
              <li key={idx}>{name}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default NominationsPage;
