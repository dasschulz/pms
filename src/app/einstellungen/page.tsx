"use client";

import { PageLayout } from "@/components/page-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CachedAvatar } from "@/components/ui/cached-avatar";
import { User, Upload, Eye, EyeOff, Lock, Shield, AlertTriangle } from "lucide-react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useTheme } from "next-themes";
import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { useProfilePicture } from "@/hooks/use-profile-picture";

interface UserData {
  name: string;
  email: string;
  wahlkreis: string;
  plz: string;
  landesverband: string;
  profilePictureUrl?: string;
}

interface PasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface PasswordValidation {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'fair' | 'good' | 'strong';
}

export default function EinstellungenPage() {
  const { theme, setTheme } = useTheme();
  const { data: session } = useSession();
  const { clearCache } = useProfilePicture();
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [mounted, setMounted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [userData, setUserData] = useState<UserData>({
    name: "",
    email: "",
    wahlkreis: "",
    plz: "",
    landesverband: "",
    profilePictureUrl: ""
  });

  const [passwordData, setPasswordData] = useState<PasswordData>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const [passwordValidation, setPasswordValidation] = useState<PasswordValidation>({
    isValid: false,
    errors: [],
    strength: 'weak'
  });

  // Fix hydration by ensuring client-side only rendering for theme
  useEffect(() => {
    setMounted(true);
  }, []);

  // Load user data from Airtable
  useEffect(() => {
    const loadUserData = async () => {
      if (!session?.user) return;
      
      try {
        const response = await fetch('/api/user-details');
        if (response.ok) {
          const data = await response.json();
          setUserData({
            name: data.name || "",
            email: data.email || "",
            wahlkreis: data.wahlkreis || "",
            plz: data.plz || "",
            landesverband: data.landesverband || "",
            profilePictureUrl: data.profilePictureUrl || ""
          });
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };

    loadUserData();
  }, [session]);

  // Password validation function
  const validatePassword = (password: string): PasswordValidation => {
    const errors: string[] = [];
    let score = 0;
    
    if (password.length < 8) {
      errors.push('Mindestens 8 Zeichen');
    } else {
      score += 1;
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Mindestens ein Kleinbuchstabe');
    } else {
      score += 1;
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Mindestens ein Großbuchstabe');
    } else {
      score += 1;
    }
    
    if (!/\d/.test(password)) {
      errors.push('Mindestens eine Zahl');
    } else {
      score += 1;
    }
    
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Mindestens ein Sonderzeichen');
    } else {
      score += 1;
    }
    
    // Check for common weak passwords
    const commonPasswords = [
      'password', 'passwort', '12345678', 'qwertyui', 'asdfghjk'
    ];
    
    if (commonPasswords.some(common => password.toLowerCase().includes(common))) {
      errors.push('Zu häufig verwendetes Passwort');
    }

    // Check for personal info
    if (userData.name && password.toLowerCase().includes(userData.name.toLowerCase())) {
      errors.push('Darf deinen Namen nicht enthalten');
    }

    if (userData.email && password.toLowerCase().includes(userData.email.split('@')[0].toLowerCase())) {
      errors.push('Darf deine E-Mail nicht enthalten');
    }
    
    let strength: 'weak' | 'fair' | 'good' | 'strong' = 'weak';
    if (score >= 5 && password.length >= 12) strength = 'strong';
    else if (score >= 4 && password.length >= 10) strength = 'good';
    else if (score >= 3 && password.length >= 8) strength = 'fair';
    
    return {
      isValid: errors.length === 0,
      errors,
      strength
    };
  };

  // Update password validation when new password changes
  useEffect(() => {
    if (passwordData.newPassword) {
      setPasswordValidation(validatePassword(passwordData.newPassword));
    } else {
      setPasswordValidation({ isValid: false, errors: [], strength: 'weak' });
    }
  }, [passwordData.newPassword, userData.name, userData.email]);

  // Get password strength color
  const getStrengthColor = (strength: string) => {
    switch (strength) {
      case 'strong': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'fair': return 'text-yellow-600';
      default: return 'text-red-600';
    }
  };

  // Get password strength label
  const getStrengthLabel = (strength: string) => {
    switch (strength) {
      case 'strong': return 'Sehr sicher';
      case 'good': return 'Sicher';
      case 'fair': return 'Mittelmäßig';
      default: return 'Schwach';
    }
  };

  // Handle profile picture upload
  const handleProfilePictureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Bitte wähle eine Bilddatei aus");
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Das Bild darf maximal 5MB groß sein");
      return;
    }

    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onload = async () => {
        const base64String = reader.result as string;
        const profilePictureUrl = base64String;
        
        // Clear old cached image before saving new one
        clearCache(userData.profilePictureUrl);
        
        // Save to Airtable
        await saveUserData({ profilePictureUrl });
        
        // Update local state
        setUserData(prev => ({ ...prev, profilePictureUrl }));
        toast.success("Profilbild erfolgreich aktualisiert");
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      toast.error("Fehler beim Hochladen des Profilbilds");
    }
  };

  // Save user data to Airtable
  const saveUserData = async (overrides: Partial<UserData> = {}) => {
    setIsLoading(true);
    try {
      const dataToSave = { ...userData, ...overrides };
      
      const response = await fetch('/api/user-details', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSave),
      });

      if (!response.ok) {
        throw new Error('Failed to save user data');
      }

      if (!overrides.profilePictureUrl) {
        toast.success("Änderungen erfolgreich gespeichert");
      }
    } catch (error) {
      console.error('Error saving user data:', error);
      toast.error("Fehler beim Speichern der Änderungen");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle password change
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!passwordData.currentPassword) {
      toast.error("Bitte gib dein aktuelles Passwort ein");
      return;
    }

    if (!passwordData.newPassword) {
      toast.error("Bitte gib ein neues Passwort ein");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Die Passwörter stimmen nicht überein");
      return;
    }

    if (!passwordValidation.isValid) {
      toast.error("Das neue Passwort erfüllt nicht die Sicherheitsanforderungen");
      return;
    }

    setIsPasswordLoading(true);
    try {
      const response = await fetch('/api/user-details', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.details && Array.isArray(data.details)) {
          toast.error(`${data.error}: ${data.details.join(', ')}`);
        } else {
          toast.error(data.error || 'Fehler beim Ändern des Passworts');
        }
        return;
      }

      // Clear password fields
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
      
      toast.success("Passwort erfolgreich geändert");
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error("Fehler beim Ändern des Passworts");
    } finally {
      setIsPasswordLoading(false);
    }
  };

  return (
    <PageLayout title="Einstellungen" description="Verwalte deine persönlichen Einstellungen und Kontoinformationen.">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Picture Section */}
        <Card>
          <CardHeader>
            <CardTitle>Profilbild</CardTitle>
            <CardDescription>Lade ein Profilbild hoch oder ändere dein aktuelles Bild.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
              <CachedAvatar 
                src={userData.profilePictureUrl}
                alt="Profilbild"
                fallbackText={userData.name}
                size="lg"
                className="w-20 h-20"
              />
              <div className="flex flex-col space-y-2">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  disabled={isLoading}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Neues Bild hochladen
                </Button>
                <p className="text-sm text-muted-foreground">
                  JPG, PNG oder GIF. Maximal 5MB.
                </p>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleProfilePictureUpload}
                accept="image/*"
                className="hidden"
              />
            </div>
          </CardContent>
        </Card>

        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle>Persönliche Informationen</CardTitle>
            <CardDescription>Aktualisiere deine persönlichen Daten.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={userData.name}
                onChange={(e) => setUserData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Dein vollständiger Name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-Mail</Label>
              <Input
                id="email"
                type="email"
                value={userData.email}
                onChange={(e) => setUserData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="deine@email.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wahlkreis">Wahlkreis</Label>
              <Input
                id="wahlkreis"
                value={userData.wahlkreis}
                onChange={(e) => setUserData(prev => ({ ...prev, wahlkreis: e.target.value }))}
                placeholder="Dein Wahlkreis"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plz">PLZ (Wahlkreis, für Wetteranzeige im Dashboard)</Label>
              <Input
                id="plz"
                value={userData.plz}
                onChange={(e) => setUserData(prev => ({ ...prev, plz: e.target.value }))}
                placeholder="Deine PLZ"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="landesverband">Landesverband</Label>
              <Select value={userData.landesverband} onValueChange={(value) => setUserData(prev => ({ ...prev, landesverband: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Wähle deinen Landesverband" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Baden-Württemberg">Baden-Württemberg</SelectItem>
                  <SelectItem value="Bayern">Bayern</SelectItem>
                  <SelectItem value="Berlin">Berlin</SelectItem>
                  <SelectItem value="Brandenburg">Brandenburg</SelectItem>
                  <SelectItem value="Bremen">Bremen</SelectItem>
                  <SelectItem value="Hamburg">Hamburg</SelectItem>
                  <SelectItem value="Hessen">Hessen</SelectItem>
                  <SelectItem value="Mecklenburg-Vorpommern">Mecklenburg-Vorpommern</SelectItem>
                  <SelectItem value="Niedersachsen">Niedersachsen</SelectItem>
                  <SelectItem value="Nordrhein-Westfalen">Nordrhein-Westfalen</SelectItem>
                  <SelectItem value="Rheinland-Pfalz">Rheinland-Pfalz</SelectItem>
                  <SelectItem value="Saarland">Saarland</SelectItem>
                  <SelectItem value="Sachsen">Sachsen</SelectItem>
                  <SelectItem value="Sachsen-Anhalt">Sachsen-Anhalt</SelectItem>
                  <SelectItem value="Schleswig-Holstein">Schleswig-Holstein</SelectItem>
                  <SelectItem value="Thüringen">Thüringen</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => saveUserData()} disabled={isLoading}>
              {isLoading ? "Speichere..." : "Änderungen speichern"}
            </Button>
          </CardContent>
        </Card>

        {/* Password Change Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Lock className="w-5 h-5 mr-2" />
              Passwort ändern
            </CardTitle>
            <CardDescription>Aktualisiere dein Passwort für mehr Sicherheit.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              {/* Current Password */}
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Aktuelles Passwort</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? "text" : "password"}
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                    placeholder="Gib dein aktuelles Passwort ein"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-2">
                <Label htmlFor="newPassword">Neues Passwort</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                    placeholder="Gib dein neues Passwort ein"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                
                {/* Password Strength Indicator */}
                {passwordData.newPassword && (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Shield className="w-4 h-4" />
                      <span className={`text-sm font-medium ${getStrengthColor(passwordValidation.strength)}`}>
                        Passwort-Stärke: {getStrengthLabel(passwordValidation.strength)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          passwordValidation.strength === 'strong' ? 'bg-green-500 w-full' :
                          passwordValidation.strength === 'good' ? 'bg-blue-500 w-3/4' :
                          passwordValidation.strength === 'fair' ? 'bg-yellow-500 w-1/2' :
                          'bg-red-500 w-1/4'
                        }`}
                      />
                    </div>
                  </div>
                )}

                {/* Password Requirements */}
                {passwordData.newPassword && passwordValidation.errors.length > 0 && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                    <div className="flex items-center mb-2">
                      <AlertTriangle className="w-4 h-4 text-red-600 mr-2" />
                      <span className="text-sm font-medium text-red-600">Passwort-Anforderungen:</span>
                    </div>
                    <ul className="text-sm text-red-600 space-y-1">
                      {passwordValidation.errors.map((error, index) => (
                        <li key={index} className="flex items-center">
                          <span className="w-1 h-1 bg-red-600 rounded-full mr-2" />
                          {error}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Neues Passwort bestätigen</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder="Bestätige dein neues Passwort"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
                  <p className="text-sm text-red-600">Die Passwörter stimmen nicht überein</p>
                )}
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                disabled={
                  isPasswordLoading || 
                  !passwordData.currentPassword || 
                  !passwordData.newPassword || 
                  !passwordData.confirmPassword ||
                  passwordData.newPassword !== passwordData.confirmPassword ||
                  !passwordValidation.isValid
                }
                className="w-full"
              >
                {isPasswordLoading ? "Passwort wird geändert..." : "Passwort ändern"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Theme Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Darstellung</CardTitle>
            <CardDescription>Passe das Erscheinungsbild der Anwendung an.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Design-Modus</Label>
              {mounted && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {theme === 'dark' ? 'Dunkler Modus' : 'Heller Modus'}
                  </span>
                  <label className="theme-switch">
                    <input 
                      type="checkbox" 
                      checked={theme === 'light'} 
                      onChange={(e) => setTheme(e.target.checked ? 'light' : 'dark')}
                    />
                    <span className="theme-slider">
                      <div className="theme-star theme-star_1"></div>
                      <div className="theme-star theme-star_2"></div>
                      <div className="theme-star theme-star_3"></div>
                      <svg className="theme-cloud" viewBox="0 0 24 24" fill="white">
                        <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z"/>
                      </svg>
                    </span>
                  </label>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>E-Mail-Benachrichtigungen</Label>
                <p className="text-sm text-muted-foreground">
                  Erhalte E-Mails zu wichtigen Updates
                </p>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Browser-Benachrichtigungen</Label>
                <p className="text-sm text-muted-foreground">
                  Erhalte Push-Benachrichtigungen in deinem Browser
                </p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}
