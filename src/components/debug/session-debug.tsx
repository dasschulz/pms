"use client";

import { useSession, signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function SessionDebug() {
  const { data: session, status } = useSession();
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [isClearing, setIsClearing] = useState(false);

  useEffect(() => {
    const fetchDebugInfo = async () => {
      try {
        // Test the user details API
        const userDetailsResponse = await fetch('/api/user-details');
        const userDetailsData = userDetailsResponse.ok 
          ? await userDetailsResponse.json() 
          : { error: await userDetailsResponse.text() };

        // Test the user preferences API  
        const userPrefsResponse = await fetch('/api/user-preferences');
        const userPrefsData = userPrefsResponse.ok 
          ? await userPrefsResponse.json() 
          : { error: await userPrefsResponse.text() };

        // Test the train connections API
        const trainResponse = await fetch('/api/train-connections');
        const trainData = trainResponse.ok 
          ? await trainResponse.json() 
          : { error: await trainResponse.text() };

        setDebugInfo({
          userDetails: { status: userDetailsResponse.status, data: userDetailsData },
          userPrefs: { status: userPrefsResponse.status, data: userPrefsData },
          train: { status: trainResponse.status, data: trainData }
        });
      } catch (error) {
        setDebugInfo({ fetchError: error });
      }
    };

    if (session?.user?.id) {
      fetchDebugInfo();
    }
  }, [session]);

  const handleClearSession = async () => {
    setIsClearing(true);
    try {
      // Clear all possible cached data
      if (typeof window !== 'undefined') {
        // Clear any localStorage data
        localStorage.clear();
        
        // Clear any sessionStorage data
        sessionStorage.clear();
        
        // Clear all cookies by setting them to expire
        document.cookie.split(";").forEach((c) => {
          const eqPos = c.indexOf("=");
          const name = eqPos > -1 ? c.substr(0, eqPos) : c;
          document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
          document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=" + window.location.hostname;
        });
      }
      
      // Sign out and redirect to login
      await signOut({ callbackUrl: '/anmelden' });
    } catch (error) {
      console.error('Error clearing session:', error);
    } finally {
      setIsClearing(false);
    }
  };

  if (status === 'loading') {
    return <div>Loading session...</div>;
  }

  const isUserIdProblematic = session?.user?.id && (
    session.user.id === '1' || 
    /^\d+$/.test(session.user.id) || 
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(session.user.id)
  );

  return (
    <Card className="max-w-4xl mx-auto mt-4">
      <CardHeader>
        <CardTitle>Session Debug Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {isUserIdProblematic && (
          <Alert className="border-red-500 bg-red-50 dark:bg-red-950">
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-semibold text-red-700 dark:text-red-300">
                  ⚠️ Authentication Problem Detected
                </p>
                <p className="text-red-600 dark:text-red-400">
                  Your session contains an invalid user ID ({session?.user?.id}). This is likely cached data from the old Airtable system.
                </p>
                <div className="flex gap-2 flex-wrap">
                  <Button 
                    onClick={handleClearSession} 
                    disabled={isClearing}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    {isClearing ? 'Clearing...' : 'Quick Fix'}
                  </Button>
                  <Button 
                    onClick={() => window.location.href = '/auth-reset'}
                    variant="outline"
                    className="border-red-500 text-red-600 hover:bg-red-50"
                  >
                    Advanced Reset Tool
                  </Button>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div>
          <h3 className="font-semibold mb-2">Session Status: {status}</h3>
          <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-xs overflow-auto">
            {JSON.stringify(session, null, 2)}
          </pre>
        </div>

        {debugInfo && (
          <div>
            <h3 className="font-semibold mb-2">API Test Results</h3>
            <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-xs overflow-auto">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        )}

        {session?.user?.id && (
          <div>
            <h3 className="font-semibold mb-2">User ID Analysis</h3>
            <div className="space-y-2 text-sm">
              <p><strong>User ID:</strong> {session.user.id}</p>
              <p><strong>Type:</strong> {typeof session.user.id}</p>
              <p><strong>Length:</strong> {session.user.id.length}</p>
              <p><strong>Is UUID format?:</strong> <span className={/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(session.user.id) ? 'text-green-600' : 'text-red-600'}>
                {/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(session.user.id) ? 'Yes' : 'No'}
              </span></p>
              <p><strong>Is numeric?:</strong> <span className={/^\d+$/.test(session.user.id) ? 'text-red-600' : 'text-green-600'}>
                {/^\d+$/.test(session.user.id) ? 'Yes (PROBLEM!)' : 'No'}
              </span></p>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button 
            onClick={handleClearSession} 
            disabled={isClearing}
            variant="outline"
          >
            {isClearing ? 'Clearing...' : 'Force Clear Session'}
          </Button>
          <Button 
            onClick={() => window.location.reload()} 
            variant="outline"
          >
            Reload Page
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 