import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, register, forgotPassword } from '../api/authApi';

export default function LoginRegisterPage() {
  const [mode, setMode] = useState<'login'|'register'|'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleRegister = async () => {
    if (password !== confirmPassword) {
      setMessage('Lösenorden matchar inte!');
      return;
    }
    try {
      await register(email, password);
      setMessage('Registrering lyckades! Kontrollera din e-post för verifiering.');
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Fel vid registrering');
    }
  };

  const handleLogin = async () => {
    try {
      await login(email, password);
      setMessage('Inloggning lyckades!');
      navigate('/dashboard'); // Ändra till rätt sida om du vill
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Fel vid inloggning');
    }
  };

  const handleForgot = async () => {
    try {
      await forgotPassword(email);
      setMessage('Återställningsmail skickat till ' + email);
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Fel vid återställning');
    }
  };

  return (
    <div className="login-page max-w-md mx-auto p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-4">{mode === 'login' ? 'Logga in' : mode === 'register' ? 'Registrera dig' : 'Glömt lösenord?'}</h2>
      <div className="mb-4 flex gap-4">
        <button className={mode==='login'?'btn btn-active':'btn'} onClick={()=>setMode('login')}>Logga in</button>
        <button className={mode==='register'?'btn btn-active':'btn'} onClick={()=>setMode('register')}>Registrera</button>
        <button className={mode==='forgot'?'btn btn-active':'btn'} onClick={()=>setMode('forgot')}>Glömt lösenord?</button>
      </div>
      <form onSubmit={e=>{e.preventDefault(); mode==='login'?handleLogin():mode==='register'?handleRegister():handleForgot();}}>
        <div className="mb-4">
          <label>E-post</label>
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
        </div>
        {(mode==='login'||mode==='register') && (
          <div className="mb-4">
            <label>Lösenord</label>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
          </div>
        )}
        {mode==='register' && (
          <div className="mb-4">
            <label>Bekräfta lösenord</label>
            <input type="password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} required />
          </div>
        )}
        <button className="btn btn-primary w-full" type="submit">
          {mode==='login'?'Logga in':mode==='register'?'Registrera':'Skicka återställningsmail'}
        </button>
      </form>
      {message && <div className="mt-4 text-blue-600">{message}</div>}
      <div className="mt-6 text-xs text-gray-500">Endast admins kan hantera användare. E-postverifiering och återställning sker via mail.</div>
    </div>
  );
}
