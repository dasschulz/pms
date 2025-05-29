"use client";

import { useEffect, useState } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';

export default function AuthResetPage() {
  const { data: session, status } = useSession();
  const [isClearing, setIsClearing] = useState(false);
  const [resetSteps, setResetSteps] = useState<{[key: string]: boolean}>({});

  const isUserIdProblematic = session?.user?.id && (
    session.user.id === '1' || 
    /^\d+$/.test(session.user.id) || 
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(session.user.id)
  );

  const performFullAuthReset = async () => {
    setIsClearing(true);
    const steps: {[key: string]: boolean} = {};

    try {
      // Step 1: Clear localStorage
      setResetSteps({...steps, localStorage: false});
      if (typeof window !== 'undefined') {
        localStorage.clear();
        steps.localStorage = true;
        setResetSteps({...steps});
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Step 2: Clear sessionStorage
      setResetSteps({...steps, sessionStorage: false});
      if (typeof window !== 'undefined') {
        sessionStorage.clear();
        steps.sessionStorage = true;
        setResetSteps({...steps});
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Step 3: Clear cookies
      setResetSteps({...steps, cookies: false});
      if (typeof window !== 'undefined') {
        // Clear NextAuth cookies specifically
        const cookiesToClear = [
          'next-auth.session-token',
          'next-auth.csrf-token',
          'next-auth.callback-url',
          '__Secure-next-auth.session-token',
          '__Host-next-auth.csrf-token'
        ];

        // Clear specific NextAuth cookies
        cookiesToClear.forEach(cookieName => {
          document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
          document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${window.location.hostname}`;
          document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.${window.location.hostname}`;
        });

        // Clear all cookies as fallback
        document.cookie.split(";").forEach((c) => {
          const eqPos = c.indexOf("=");
          const name = eqPos > -1 ? c.substr(0, eqPos).trim() : c.trim();
          if (name) {
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${window.location.hostname}`;
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.${window.location.hostname}`;
          }
        });

        steps.cookies = true;
        setResetSteps({...steps});
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Step 4: Clear IndexedDB (if any)
      setResetSteps({...steps, indexedDB: false});
      if (typeof window !== 'undefined' && 'indexedDB' in window) {
        try {
          // This is a basic approach - real implementation might need to be more thorough
          const databases = await indexedDB.databases();
          await Promise.all(
            databases.map(db => {
              if (db.name) {
                return new Promise((resolve, reject) => {
                  const deleteReq = indexedDB.deleteDatabase(db.name!);
                  deleteReq.onsuccess = () => resolve(undefined);
                  deleteReq.onerror = () => reject(deleteReq.error);
                });
              }
            })
          );
        } catch (e) {
          console.log('IndexedDB clearing failed or not supported:', e);
        }
        steps.indexedDB = true;
        setResetSteps({...steps});
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Step 5: Sign out through NextAuth
      setResetSteps({...steps, signOut: false});
      await signOut({ 
        callbackUrl: '/anmelden?reset=true',
        redirect: true 
      });
      steps.signOut = true;
      setResetSteps({...steps});

    } catch (error) {
      console.error('Error during auth reset:', error);
      // Even if there's an error, try to sign out
      await signOut({ callbackUrl: '/anmelden?reset=true' });
    } finally {
      setIsClearing(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center">
          <RefreshCw className="animate-spin h-6 w-6 mr-2" />
          <span>Loading authentication status...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-6 w-6" />
            Authentication Reset Tool
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Problem Detection */}
          {session && (
            <div>
              <h3 className="font-semibold mb-3">Current Session Analysis</h3>
              
              {isUserIdProblematic ? (
                <Alert className="border-red-500 bg-red-50 dark:bg-red-950">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="font-semibold text-red-700 dark:text-red-300">
                        ⚠️ Authentication Problem Detected
                      </p>
                      <p className="text-red-600 dark:text-red-400">
                        Your session contains an invalid user ID: <code className="bg-red-100 dark:bg-red-900 px-1 rounded">{session.user.id}</code>
                      </p>
                      <p className="text-sm text-red-500 dark:text-red-400">
                        This is likely cached data from the old Airtable system. The new system requires UUID format.
                      </p>
                    </div>
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <p className="font-semibold text-green-700 dark:text-green-300">
                      ✅ Authentication Appears Normal
                    </p>
                    <p className="text-green-600 dark:text-green-400">
                      User ID format is valid: <code className="bg-green-100 dark:bg-green-900 px-1 rounded">{session.user.id}</code>
                    </p>
                  </AlertDescription>
                </Alert>
              )}

              <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded text-sm">
                <p><strong>User ID:</strong> {session.user.id}</p>
                <p><strong>Email:</strong> {session.user.email}</p>
                <p><strong>Name:</strong> {session.user.name}</p>
                <p><strong>UUID Format:</strong> {/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(session.user.id || '') ? '✅ Valid' : '❌ Invalid'}</p>
              </div>
            </div>
          )}

          {!session && (
            <Alert>
              <AlertDescription>
                <p>You are not currently logged in. If you were experiencing authentication issues, they may already be resolved.</p>
              </AlertDescription>
            </Alert>
          )}

          {/* Reset Process */}
          <div>
            <h3 className="font-semibold mb-3">Authentication Reset Process</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              This will clear all cached authentication data and force a fresh login. This is the recommended solution if you're experiencing authentication issues after the migration to Supabase.
            </p>

            {/* Reset Steps Progress */}
            {isClearing && (
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2">
                  {resetSteps.localStorage ? <CheckCircle className="h-4 w-4 text-green-500" /> : <RefreshCw className="h-4 w-4 animate-spin" />}
                  <span className={resetSteps.localStorage ? 'text-green-600' : ''}>Clear Local Storage</span>
                </div>
                <div className="flex items-center gap-2">
                  {resetSteps.sessionStorage ? <CheckCircle className="h-4 w-4 text-green-500" /> : <RefreshCw className="h-4 w-4 animate-spin opacity-50" />}
                  <span className={resetSteps.sessionStorage ? 'text-green-600' : ''}>Clear Session Storage</span>
                </div>
                <div className="flex items-center gap-2">
                  {resetSteps.cookies ? <CheckCircle className="h-4 w-4 text-green-500" /> : <RefreshCw className="h-4 w-4 animate-spin opacity-50" />}
                  <span className={resetSteps.cookies ? 'text-green-600' : ''}>Clear Cookies</span>
                </div>
                <div className="flex items-center gap-2">
                  {resetSteps.indexedDB ? <CheckCircle className="h-4 w-4 text-green-500" /> : <RefreshCw className="h-4 w-4 animate-spin opacity-50" />}
                  <span className={resetSteps.indexedDB ? 'text-green-600' : ''}>Clear IndexedDB</span>
                </div>
                <div className="flex items-center gap-2">
                  {resetSteps.signOut ? <CheckCircle className="h-4 w-4 text-green-500" /> : <RefreshCw className="h-4 w-4 animate-spin opacity-50" />}
                  <span className={resetSteps.signOut ? 'text-green-600' : ''}>Sign Out & Redirect</span>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button 
                onClick={performFullAuthReset}
                disabled={isClearing}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isClearing ? (
                  <>
                    <RefreshCw className="animate-spin h-4 w-4 mr-2" />
                    Resetting Authentication...
                  </>
                ) : (
                  'Perform Full Authentication Reset'
                )}
              </Button>

              {session && (
                <Button 
                  onClick={() => signOut({ callbackUrl: '/anmelden' })}
                  variant="outline"
                  disabled={isClearing}
                >
                  Simple Sign Out
                </Button>
              )}
            </div>
          </div>

          {/* Information */}
          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
            <h4 className="font-semibold">What this tool does:</h4>
            <ul className="list-disc list-inside space-y-1">
              <li>Clears all browser storage (localStorage, sessionStorage)</li>
              <li>Removes all authentication cookies</li>
              <li>Clears any IndexedDB data</li>
              <li>Signs you out of the current session</li>
              <li>Redirects you to the login page for a fresh start</li>
            </ul>
            <p className="mt-3">
              <strong>When to use:</strong> If you're seeing "invalid input syntax for type uuid" errors, 
              dashboard constantly reloading, or user ID "1" in your session after the Supabase migration.
            </p>
          </div>

        </CardContent>
      </Card>
    </div>
  );
} 