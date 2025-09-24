import React from 'react';
import { useAuthStore } from '@/stores/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';

const AuthTestPage: React.FC = () => {
  const { user, isAuthenticated, isLoading, handleLogout } = useAuthStore();
  const navigate = useNavigate();

  const sessionData = sessionStorage.getItem('racc_auth_session');
  const session = sessionData ? JSON.parse(sessionData) : null;

  return (
    <section className="container py-20">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Authentication Status</h1>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Current Auth State</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <strong>Authenticated:</strong>
                  <Badge className={isAuthenticated ? 'bg-green-100 text-green-800 ml-2' : 'bg-red-100 text-red-800 ml-2'}>
                    {isAuthenticated ? 'Yes' : 'No'}
                  </Badge>
                </div>
                <div>
                  <strong>Loading:</strong>
                  <Badge className={isLoading ? 'bg-yellow-100 text-yellow-800 ml-2' : 'bg-gray-100 text-gray-800 ml-2'}>
                    {isLoading ? 'Yes' : 'No'}
                  </Badge>
                </div>
              </div>
              
              {user && (
                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-semibold mb-2">User Info:</h4>
                  <div className="text-sm space-y-1">
                    <div><strong>Name:</strong> {user.name}</div>
                    <div><strong>Email:</strong> {user.email}</div>
                    <div><strong>Role:</strong> {user.role}</div>
                    <div><strong>ID:</strong> {user.id}</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Session Storage</CardTitle>
            </CardHeader>
            <CardContent>
              {session ? (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold mb-2">Session Data:</h4>
                  <pre className="text-xs bg-white p-2 rounded border overflow-x-auto">
                    {JSON.stringify(session, null, 2)}
                  </pre>
                </div>
              ) : (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-600">No session data found</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Demo Credentials</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div><strong>Admin:</strong> admin@racc.com / admin123</div>
                <div><strong>Member:</strong> demo@racc.com / demo123</div>
                <div><strong>Moderator:</strong> moderator@racc.com / mod123</div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            {!isAuthenticated ? (
              <Button onClick={() => navigate('/auth')}>
                Go to Login
              </Button>
            ) : (
              <Button onClick={handleLogout} variant="outline">
                Logout
              </Button>
            )}
            <Button onClick={() => navigate('/')} variant="outline">
              Go to Home
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AuthTestPage;
