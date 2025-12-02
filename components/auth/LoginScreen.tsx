
import React, { useState } from 'react';
import { authService } from '../../services/authService';
import { User } from '../../types';
import { TicketIcon } from '../icons/TicketIcon';
import Loader from '../Loader';

interface LoginScreenProps {
  onLoginSuccess: (user: User) => void;
}

type AuthView = 'login' | 'signup' | 'forgot-password' | 'reset-code' | 'new-password';

const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [view, setView] = useState<AuthView>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const user = await authService.login(email, password);
      onLoginSuccess(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בהתחברות');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const user = await authService.signup(name, email, password);
      onLoginSuccess(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בהרשמה');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const user = await authService.googleLogin();
      onLoginSuccess(user);
    } catch (err) {
      setError('שגיאה בהתחברות עם גוגל');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const code = await authService.requestPasswordReset(email);
      setGeneratedCode(code);
      // Simulate Email sending
      alert(`קוד האימות שלך הוא: ${code}`);
      setView('reset-code');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בשליחת קוד');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (resetCode === generatedCode) {
        setView('new-password');
        setError(null);
    } else {
        setError('קוד שגוי');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoading(true);
      try {
          await authService.resetPassword(email, password);
          alert('הסיסמא שונתה בהצלחה! כעת תוכל להתחבר.');
          setView('login');
          setPassword('');
      } catch (err) {
          setError('שגיאה באיפוס סיסמא');
      } finally {
          setIsLoading(false);
      }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center p-4 text-white">
      <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl w-full max-w-md border border-gray-700">
        
        <div className="text-center mb-8">
            <div className="inline-block p-3 bg-gray-700 rounded-full mb-4">
                 <TicketIcon className="h-10 w-10 text-purple-500" />
            </div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">
                ארנק כרטיסים
            </h1>
            <p className="text-gray-400 mt-2">
                {view === 'login' && 'התחבר לחשבון שלך'}
                {view === 'signup' && 'צור חשבון חדש'}
                {view === 'forgot-password' && 'שחזור סיסמא'}
                {view === 'reset-code' && 'אימות קוד'}
                {view === 'new-password' && 'קביעת סיסמא חדשה'}
            </p>
        </div>

        {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-200 p-3 rounded-lg mb-6 text-sm text-center">
                {error}
            </div>
        )}

        {/* LOGIN VIEW */}
        {view === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
                <div>
                    <label className="block text-sm text-gray-300 mb-1">אימייל</label>
                    <input 
                        type="email" 
                        required
                        dir="ltr"
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 outline-none transition-all placeholder-gray-500 text-right"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-sm text-gray-300 mb-1">סיסמא</label>
                    <input 
                        type="password" 
                        required
                        dir="ltr"
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 outline-none transition-all text-right"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <div className="text-left mt-1">
                        <button type="button" onClick={() => setView('forgot-password')} className="text-xs text-purple-400 hover:text-purple-300">
                            שכחתי סיסמא?
                        </button>
                    </div>
                </div>
                
                <button disabled={isLoading} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-lg transition-all flex justify-center items-center">
                    {isLoading ? <Loader /> : 'התחבר'}
                </button>

                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-600"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-gray-800 text-gray-400">או</span>
                    </div>
                </div>

                <button 
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={isLoading}
                    className="w-full bg-white text-gray-900 font-bold py-3 rounded-lg hover:bg-gray-100 transition-all flex justify-center items-center space-x-2 rtl:space-x-reverse"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    <span>התחבר עם Google</span>
                </button>

                <p className="text-center text-sm text-gray-400 mt-6">
                    אין לך חשבון?{' '}
                    <button type="button" onClick={() => setView('signup')} className="text-purple-400 hover:text-purple-300 font-semibold">
                        הירשם עכשיו
                    </button>
                </p>
            </form>
        )}

        {/* SIGNUP VIEW */}
        {view === 'signup' && (
             <form onSubmit={handleSignup} className="space-y-4">
                <div>
                    <label className="block text-sm text-gray-300 mb-1">שם מלא</label>
                    <input 
                        type="text" 
                        required
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 outline-none text-white"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-sm text-gray-300 mb-1">אימייל</label>
                    <input 
                        type="email" 
                        required
                        dir="ltr"
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 outline-none text-right"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-sm text-gray-300 mb-1">סיסמא</label>
                    <input 
                        type="password" 
                        required
                        dir="ltr"
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 outline-none text-right"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>
                
                <button disabled={isLoading} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-lg transition-all flex justify-center items-center">
                    {isLoading ? <Loader /> : 'צור חשבון'}
                </button>

                <p className="text-center text-sm text-gray-400 mt-4">
                    יש לך כבר חשבון?{' '}
                    <button type="button" onClick={() => setView('login')} className="text-purple-400 hover:text-purple-300 font-semibold">
                        התחבר
                    </button>
                </p>
            </form>
        )}

        {/* FORGOT PASSWORD VIEW */}
        {view === 'forgot-password' && (
             <form onSubmit={handleForgotPassword} className="space-y-4">
                <p className="text-sm text-gray-400 mb-4">הכנס את המייל שלך ונשלח לך קוד לאיפוס סיסמא.</p>
                <div>
                    <label className="block text-sm text-gray-300 mb-1">אימייל</label>
                    <input 
                        type="email" 
                        required
                        dir="ltr"
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 outline-none text-right"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>
                
                <button disabled={isLoading} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-lg transition-all flex justify-center items-center">
                    {isLoading ? <Loader /> : 'שלח קוד'}
                </button>

                <button type="button" onClick={() => setView('login')} className="w-full text-gray-400 hover:text-white mt-2">
                    חזרה להתחברות
                </button>
            </form>
        )}

        {/* RESET CODE VIEW */}
        {view === 'reset-code' && (
             <form onSubmit={handleVerifyCode} className="space-y-4">
                <p className="text-sm text-gray-400 mb-4">הכנס את הקוד בן 4 הספרות שקיבלת (בדוק בהודעה שקפצה).</p>
                <div>
                    <label className="block text-sm text-gray-300 mb-1">קוד אימות</label>
                    <input 
                        type="text" 
                        required
                        dir="ltr"
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 outline-none text-center text-2xl tracking-widest"
                        maxLength={4}
                        value={resetCode}
                        onChange={(e) => setResetCode(e.target.value)}
                    />
                </div>
                
                <button className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-lg transition-all">
                    אמת קוד
                </button>
                
                <button type="button" onClick={() => setView('login')} className="w-full text-gray-400 hover:text-white mt-2">
                    ביטול
                </button>
            </form>
        )}

        {/* NEW PASSWORD VIEW */}
        {view === 'new-password' && (
             <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                    <label className="block text-sm text-gray-300 mb-1">סיסמא חדשה</label>
                    <input 
                        type="password" 
                        required
                        dir="ltr"
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 outline-none text-right"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>
                
                <button disabled={isLoading} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition-all flex justify-center items-center">
                    {isLoading ? <Loader /> : 'עדכן סיסמא'}
                </button>
            </form>
        )}

      </div>
    </div>
  );
};

export default LoginScreen;
