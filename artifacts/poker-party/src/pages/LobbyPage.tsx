import React, { useState, useEffect } from 'react';
import { getTransport } from '@/ui/hooks/useTableSocket';
import { useTableStore } from '@/store/tableStore';
import { Link, useLocation } from 'wouter';
import { Users, Copy, Check, Play, UserPlus } from 'lucide-react';

const EMOJIS = ['🐶','🐱','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🐵','🦄','🦇','🦉'];

export default function LobbyPage() {
  const [, setLocation] = useLocation();
  const [pseudo, setPseudo] = useState('');
  const [avatar, setAvatar] = useState(EMOJIS[0]);
  const [joinCode, setJoinCode] = useState('');
  
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [startingClothing, setStartingClothing] = useState(6);
  
  const [openTables, setOpenTables] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Poll for open tables
    const fetchTables = () => {
      getTransport().listOpenTables()
        .then(setOpenTables)
        .catch(console.error);
    };
    fetchTables();
    const interval = setInterval(fetchTables, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pseudo.trim()) return;
    setIsLoading(true);
    try {
      const code = await getTransport().createTable({
        pseudo,
        avatar,
        maxPlayers,
        startingClothing
      });
      setLocation(`/table/${code}`);
    } catch (err) {
      console.error(err);
      setIsLoading(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pseudo.trim() || !joinCode.trim()) return;
    setIsLoading(true);
    try {
      await getTransport().joinTable({
        code: joinCode.toUpperCase(),
        pseudo,
        avatar
      });
      setLocation(`/table/${joinCode.toUpperCase()}`);
    } catch (err) {
      console.error(err);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] w-full flex flex-col items-center py-12 px-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-300/20 blur-3xl" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-yellow-200/20 blur-3xl" />
      
      <div className="text-center mb-10 z-10">
        <h1 className="font-title text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight mb-3">
          Poker<span className="text-teal-500">Party</span>
        </h1>
        <p className="text-gray-600 max-w-sm mx-auto font-medium">
          Le jeu de cartes entre amis où chaque vêtement compte.
        </p>
      </div>

      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8 z-10">
        {/* Left Column: Identity & Create */}
        <div className="space-y-6">
          {/* Profile Card */}
          <div className="bg-table-panel text-white rounded-panel p-6 shadow-xl border border-table-border">
            <h2 className="font-title text-xl font-semibold mb-6 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-felt-accent" />
              Votre profil
            </h2>
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Pseudo</label>
                <input 
                  type="text"
                  value={pseudo}
                  onChange={(e) => setPseudo(e.target.value)}
                  placeholder="Comment vous appelez-vous ?"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-felt-accent transition-all"
                  maxLength={15}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Avatar</label>
                <div className="flex flex-wrap gap-2">
                  {EMOJIS.map(em => (
                    <button
                      key={em}
                      onClick={() => setAvatar(em)}
                      className={`text-2xl w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                        avatar === em 
                          ? 'bg-felt-accent shadow-[0_0_10px_rgba(61,217,196,0.4)] scale-110' 
                          : 'bg-black/30 hover:bg-black/50 hover:scale-105'
                      }`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Create Table Card */}
          <div className="bg-white/80 backdrop-blur-md rounded-panel p-6 shadow-xl border border-white/50 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-400/10 rounded-full blur-2xl -mr-10 -mt-10 transition-transform group-hover:scale-150" />
            
            <h2 className="font-title text-xl font-semibold text-gray-900 mb-6">Créer une table</h2>
            
            <form onSubmit={handleCreate} className="space-y-5 relative z-10">
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-600 mb-2">Joueurs max</label>
                  <select 
                    value={maxPlayers}
                    onChange={(e) => setMaxPlayers(Number(e.target.value))}
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-400"
                  >
                    {[2, 3, 4].map(n => <option key={n} value={n}>{n} joueurs</option>)}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-600 mb-2">Vêtements</label>
                  <select 
                    value={startingClothing}
                    onChange={(e) => setStartingClothing(Number(e.target.value))}
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-400"
                  >
                    {[3, 4, 5, 6, 7, 8].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              </div>
              
              <button 
                type="submit"
                disabled={!pseudo.trim() || isLoading}
                className="w-full bg-teal-500 text-white font-title font-semibold rounded-full py-3.5 shadow-md shadow-teal-500/20 hover:bg-teal-400 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Play className="w-5 h-5" />
                Créer la partie
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Join & List */}
        <div className="space-y-6 flex flex-col">
          {/* Join with Code */}
          <div className="bg-white/80 backdrop-blur-md rounded-panel p-6 shadow-xl border border-white/50">
            <h2 className="font-title text-xl font-semibold text-gray-900 mb-6">Rejoindre via un code</h2>
            
            <form onSubmit={handleJoin} className="flex gap-3">
              <input 
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="Ex: ABCDEF"
                className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 font-mono text-center tracking-widest placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400 uppercase"
                maxLength={6}
              />
              <button 
                type="submit"
                disabled={!pseudo.trim() || joinCode.length < 3 || isLoading}
                className="bg-gray-900 text-white font-title font-semibold rounded-xl px-6 hover:bg-gray-800 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Rejoindre
              </button>
            </form>
          </div>

          {/* Open Tables List */}
          <div className="bg-white/60 backdrop-blur-md rounded-panel p-6 shadow-lg border border-white/40 flex-1 flex flex-col">
            <h2 className="font-title text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-gray-500" />
              Tables en attente
            </h2>
            
            <div className="flex-1 overflow-y-auto min-h-[200px] space-y-3 pr-2 scrollbar-hide">
              {openTables.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2">
                  <div className="w-12 h-12 rounded-full bg-black/5 flex items-center justify-center mb-2">
                    <Users className="w-6 h-6 opacity-50" />
                  </div>
                  <p className="text-sm">Aucune table ouverte.</p>
                  <p className="text-xs">Créez la vôtre !</p>
                </div>
              ) : (
                openTables.map(t => (
                  <div key={t.code} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between hover:border-teal-300 transition-colors group">
                    <div>
                      <div className="font-mono font-bold text-gray-900 tracking-wider bg-gray-100 px-2 py-1 rounded inline-block text-sm mb-1 group-hover:bg-teal-50 group-hover:text-teal-700 transition-colors">
                        {t.code}
                      </div>
                      <div className="text-xs text-gray-500 font-medium flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${t.playersConnected === t.playersExpected ? 'bg-orange-400' : 'bg-green-400'}`}></span>
                        {t.playersConnected} / {t.playersExpected} joueurs
                      </div>
                    </div>
                    
                    <button
                      onClick={() => {
                        setJoinCode(t.code);
                        if (pseudo) {
                          getTransport().joinTable({ code: t.code, pseudo, avatar })
                            .then(() => setLocation(`/table/${t.code}`))
                            .catch(console.error);
                        }
                      }}
                      disabled={t.playersConnected >= t.playersExpected || !pseudo.trim()}
                      className="text-sm font-semibold text-teal-600 bg-teal-50 hover:bg-teal-100 px-4 py-2 rounded-full transition-colors disabled:opacity-50 disabled:bg-gray-100 disabled:text-gray-400"
                    >
                      {t.playersConnected >= t.playersExpected ? 'Pleine' : 'Rejoindre'}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
