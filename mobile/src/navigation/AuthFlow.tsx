import React, { useState } from 'react';
import { ConsentScreen } from '../screens/auth/ConsentScreen';
import { LanguageSelectionScreen } from '../screens/auth/LanguageSelectionScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { RoleSelectionScreen } from '../screens/auth/RoleSelectionScreen';
import { SplashScreen } from '../screens/auth/SplashScreen';
import { AuthUser, Role, useAuthStore } from '../store/authStore';

type Step = 'splash' | 'language' | 'role' | 'login' | 'register' | 'consent';

interface PendingSession {
  token: string;
  user: AuthUser;
}

export function AuthFlow() {
  const setSession = useAuthStore((state) => state.setSession);
  const [step, setStep] = useState<Step>('splash');
  const [language, setLanguage] = useState('en');
  const [role, setRole] = useState<Role>('participant');
  const [pendingSession, setPendingSession] = useState<PendingSession | null>(null);

  switch (step) {
    case 'language':
      return (
        <LanguageSelectionScreen
          initialLanguage={language}
          onContinue={(nextLanguage) => {
            setLanguage(nextLanguage);
            setStep('role');
          }}
        />
      );
    case 'role':
      return (
        <RoleSelectionScreen
          onSelect={(nextRole) => {
            setRole(nextRole);
            setStep('register');
          }}
          onLogin={() => setStep('login')}
        />
      );
    case 'login':
      return (
        <LoginScreen
          onLoggedIn={(token, user) => setSession(token, user)}
          onSwitchToRegister={() => setStep('role')}
        />
      );
    case 'register':
      return (
        <RegisterScreen
          role={role}
          language={language}
          onRegistered={(token, user) => {
            setPendingSession({ token, user });
            setStep('consent');
          }}
          onSwitchToLogin={() => setStep('login')}
          onChangeRole={() => setStep('role')}
        />
      );
    case 'consent':
      return pendingSession ? (
        <ConsentScreen
          token={pendingSession.token}
          user={pendingSession.user}
          onDone={(updatedUser) => setSession(pendingSession.token, updatedUser)}
        />
      ) : (
        <RoleSelectionScreen onSelect={(nextRole) => { setRole(nextRole); setStep('register'); }} onLogin={() => setStep('login')} />
      );
    case 'splash':
    default:
      return <SplashScreen onContinue={() => setStep('language')} />;
  }
}
