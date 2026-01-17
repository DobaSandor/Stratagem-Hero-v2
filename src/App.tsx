import { useState, useEffect } from 'react';
import { db } from './services/db';
import MainMenu from './components/MainMenu';
import GamePage from './components/GamePage';
import AuthPage from './components/AuthPage';
import GameModeSelection from './components/GameModeSelection';
import CampaignPage from './components/CampaignPage';
import IntroVideo from './components/IntroVideo';
import TruthEnforcersGame from './games/truth-enforcers/TruthEnforcersGame';
import SecurityModal from './components/SecurityModal';

function App() {
  const [view, setView] = useState<'menu' | 'mode-select' | 'truth-enforcers-select' | 'game' | 'campaign'>('menu');
  const [user, setUser] = useState<string | null>(null);
  const [illuminateMode, setIlluminateMode] = useState<'endless' | 'campaign'>('campaign');
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  // const [truthEnforcersMode, setTruthEnforcersMode] = useState<'endless' | 'campaign'>('campaign');
  const [showIntro, setShowIntro] = useState(false);
  const [introVideoSrc, setIntroVideoSrc] = useState<string | undefined>(undefined);

  // Check for existing session (optional, for now we'll require login on refresh for security demo)
  // In a real app, you'd check a token in localStorage here.
  useEffect(() => {
    // Hybrid Session Management:
    // 1. Check sessionStorage (Tab Specific - survives refresh)
    // 2. If empty, check localStorage (Browser Specific - survives restart)
    const sessionUser = sessionStorage.getItem('stratagem_hero_session_user');
    const localUser = localStorage.getItem('stratagem_hero_session_user');

    if (sessionUser) {
      setUser(sessionUser);
      setShowIntro(false);
    } else if (localUser) {
      setUser(localUser);
      // Sync to session for this tab's future refreshes
      sessionStorage.setItem('stratagem_hero_session_user', localUser);
      setShowIntro(false);
    }
  }, []);

  // Heartbeat Logic
  useEffect(() => {
    if (user) {
      db.heartbeat(user); // Initial call
      const interval = setInterval(() => {
        db.heartbeat(user);
      }, 60000 * 2); // Every 2 minutes
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleLogin = async (username: string) => {
    sessionStorage.setItem('stratagem_hero_session_user', username);
    localStorage.setItem('stratagem_hero_session_user', username);
    setUser(username);

    // Check Settings
    const stats = await db.getUserStats(username);

    if (stats.skipIntro) {
      setShowIntro(false);
    } else {
      if (stats.useDarkIntro) {
        setIntroVideoSrc('/Ministry of Defense Intro DARK.mp4');
      } else {
        setIntroVideoSrc(undefined); // Default
      }
      setShowIntro(true);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('stratagem_hero_session_user');
    localStorage.removeItem('stratagem_hero_session_user');
    setUser(null);
    setView('menu');
    setShowIntro(false);
  };

  const handleIntroComplete = () => {
    setShowIntro(false);
    setView('menu');
  };

  const handleStartGame = (mode: 'hero' | 'illuminated' | 'truth_enforcers') => {
    if (mode === 'hero') {
      setView('game');
    } else if (mode === 'illuminated') {
      setView('mode-select');
    } else {
      setShowSecurityModal(true);
    }
  };

  const handleSecuritySuccess = () => {
    setShowSecurityModal(false);
    setView('truth-enforcers-select');
  };

  const handleIlluminateSelect = (mode: 'endless' | 'campaign') => {
    setIlluminateMode(mode);
    setView('campaign');
  };

  const handleTruthEnforcersSelect = (mode: 'endless' | 'campaign') => {
    // setTruthEnforcersMode(mode); // Unused for now
    console.log(`Truth Enforcers mode: ${mode}`); // Placeholder usage
    // For now, these are just alerts handled in the component, but we can switch view here later
    // setView('truth-enforcers-campaign'); 
  };

  if (!user) {
    return <AuthPage onLogin={handleLogin} />;
  }

  if (showIntro) {
    return <IntroVideo onComplete={handleIntroComplete} videoSrc={introVideoSrc} />;
  }

  return (
    <>
      {view === 'menu' && (
        <>
          <MainMenu username={user} onStart={handleStartGame} onLogout={handleLogout} />
          {showSecurityModal && (
            <SecurityModal
              onSuccess={handleSecuritySuccess}
              onClose={() => setShowSecurityModal(false)}
            />
          )}
        </>
      )}
      {view === 'game' && <GamePage username={user} onBack={() => setView('menu')} />}
      {view === 'mode-select' && (
        <GameModeSelection
          onSelectMode={handleIlluminateSelect}
          onBack={() => setView('menu')}
          username={user}
        />
      )}
      {view === 'truth-enforcers-select' && (
        <TruthEnforcersGame
          onSelectMode={handleTruthEnforcersSelect}
          onBack={() => setView('menu')}
        />
      )}
      {view === 'campaign' && (
        <CampaignPage
          username={user}
          mode={illuminateMode}
          onBack={() => setView('mode-select')}
          onMainMenu={() => setView('menu')}
        />
      )}
    </>
  );
}

export default App;
