'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Match, Prediction } from '@/types/database';
import MatchCard from '@/components/MatchCard';
import { User } from '@supabase/supabase-js';

export default function Home() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(12);
  const [search, setSearch] = useState('');
  const [showOldMatches, setShowOldMatches] = useState(false);
  const [activeTab, setActiveTab] = useState<'groups' | 'knockouts'>('groups');

  const filteredByTab = matches.filter(m => 
    activeTab === 'groups' ? (!m.stage || m.stage === 'group-stage') : (m.stage && m.stage !== 'group-stage')
  );

  const finishedMatches = filteredByTab.filter(m => m.status === 'finished');
  const upcomingMatches = filteredByTab.filter(m => m.status !== 'finished');
  const displayedFinished = showOldMatches ? finishedMatches : finishedMatches.slice(-3);
  const combinedMatches = [...displayedFinished, ...upcomingMatches];

  const filteredMatches = combinedMatches.filter(match =>
    match.team_a.toLowerCase().includes(search.toLowerCase()) ||
    match.team_b.toLowerCase().includes(search.toLowerCase()) ||
    match.venue.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    async function fetchData() {
      // Get User
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      // Get Matches
      const { data: matchesData } = await supabase
        .from('matches')
        .select('*')
        .order('kickoff', { ascending: true });

      setMatches(matchesData || []);

      // Get User's Predictions
      if (currentUser) {
        const { data: predData } = await supabase
          .from('predictions')
          .select('*')
          .eq('user_id', currentUser.id);

        setPredictions(predData || []);
      }

      setLoading(false);
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 md:space-y-12 px-2 md:px-0">
      <section className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12 max-w-6xl mx-auto">
        <div className="w-[90%] md:w-1/2 flex justify-center md:justify-end">
          <img
            src="/brand_2.png"
            alt="Waka Waka Brand"
            className="w-full h-auto object-contain drop-shadow-xl"
          />
        </div>
        <div className="w-full md:w-1/2 space-y-3 md:space-y-4 text-center md:text-left flex flex-col items-center md:items-start">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold gradient-text tracking-tight">World Cup 2026</h1>
          <p className="text-sm md:text-xl text-slate-500 max-w-md px-4 md:px-0 leading-relaxed">
            Predict the scores, climb the leaderboard, and claim your glory.
            The ultimate prediction contest is here.
          </p>
        </div>
      </section>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-4 text-center border-indigo-500/20">
          <div className="text-2xl font-bold text-indigo-600">5 Pts</div>
          <div className="text-xs text-slate-500">Exact Score</div>
        </div>
        <div className="glass-card p-4 text-center border-indigo-500/20">
          <div className="text-2xl font-bold text-indigo-600">3 Pts</div>
          <div className="text-xs text-slate-500">Winner + GD</div>
        </div>
        <div className="glass-card p-4 text-center border-indigo-500/20">
          <div className="text-2xl font-bold text-indigo-600">2 Pts</div>
          <div className="text-xs text-slate-500">Winner Only</div>
        </div>
        <div className="glass-card p-4 text-center border-indigo-500/20">
          <div className="text-2xl font-bold text-indigo-600">1 Pt</div>
          <div className="text-xs text-slate-500">Total Goals</div>
        </div>
      </section>

      <section className="max-w-xl mx-auto w-full px-2">
        <div className="relative group mt-4">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg className="w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search teams or venues..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/70 backdrop-blur-md border-2 border-indigo-500/20 rounded-2xl py-4 pl-12 pr-4 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-xl shadow-indigo-500/10 text-sm md:text-base font-bold"
          />
        </div>
      </section>

      {/* Tabs */}
      <div className="flex justify-center mt-6">
        <div className="inline-flex bg-slate-100 p-1 rounded-xl shadow-inner">
          <button
            onClick={() => setActiveTab('groups')}
            className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'groups' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Group Stage
          </button>
          <button
            onClick={() => setActiveTab('knockouts')}
            className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'knockouts' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Knockouts
          </button>
        </div>
      </div>

      {finishedMatches.length > 3 && !search && (
        <div className="relative flex items-center py-4">
          <div className="flex-grow border-t border-slate-200/60"></div>
          <button
            onClick={() => setShowOldMatches(!showOldMatches)}
            className="flex items-center gap-2 px-6 py-2.5 mx-4 rounded-full bg-white/80 backdrop-blur-sm text-indigo-600 font-bold text-sm hover:bg-indigo-50 hover:text-indigo-700 transition-all shadow-sm border border-indigo-100/50 hover:border-indigo-200 hover:shadow-md group"
          >
            {showOldMatches ? 'Hide Old Matches' : `Show All ${finishedMatches.length} Old Matches`}
            <svg 
              className={`w-4 h-4 text-indigo-500 transition-transform duration-300 ${showOldMatches ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <div className="flex-grow border-t border-slate-200/60"></div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMatches.slice(0, visibleCount).map((match) => (
          <MatchCard
            key={match.id}
            match={match}
            userId={user?.id ?? null}
            existingPrediction={predictions.find(p => p.match_id === match.id) ?? null}
          />
        ))}
      </div>

      {visibleCount < filteredMatches.length && (
        <div className="flex justify-center pb-10">
          <button
            onClick={() => setVisibleCount(prev => prev + 12)}
            className="premium-button px-10 py-3 text-lg"
          >
            Show More Matches
          </button>
        </div>
      )}

      {filteredMatches.length === 0 && (
        <div className="text-center py-20 glass-card">
          <p className="text-slate-400 font-medium">No matches found for "{search}".</p>
          <button
            onClick={() => setSearch('')}
            className="text-indigo-600 font-bold mt-2 hover:underline"
          >
            Clear Search
          </button>
        </div>
      )}
    </div>
  );
}
