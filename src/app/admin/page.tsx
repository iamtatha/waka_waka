'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Match } from '@/types/database';

export default function AdminPage() {
    const [matches, setMatches] = useState<Match[]>([]);
    const [loading, setLoading] = useState(true);
    const [teamA, setTeamA] = useState('');
    const [teamB, setTeamB] = useState('');
    const [kickoff, setKickoff] = useState('');
    const [venue, setVenue] = useState('');
    const [search, setSearch] = useState('');

    const filteredMatches = matches.filter(m =>
        m.team_a.toLowerCase().includes(search.toLowerCase()) ||
        m.team_b.toLowerCase().includes(search.toLowerCase()) ||
        m.venue.toLowerCase().includes(search.toLowerCase())
    );

    useEffect(() => {
        fetchMatches();
    }, []);

    async function fetchMatches() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            window.location.href = '/login';
            return;
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (!profile || (profile.role !== 'owner' && profile.role !== 'admin')) {
            alert('Access Denied: Admins only.');
            window.location.href = '/';
            return;
        }

        const { data } = await supabase.from('matches').select('*').order('kickoff', { ascending: true });
        setMatches(data || []);
        setLoading(false);
    }

    const handleAddMatch = async (e: React.FormEvent) => {
        e.preventDefault();
        const { error } = await supabase.from('matches').insert({
            team_a: teamA,
            team_b: teamB,
            kickoff: new Date(kickoff).toISOString(),
            venue: venue,
            status: 'upcoming'
        });
        if (!error) {
            setTeamA('');
            setTeamB('');
            setKickoff('');
            setVenue('');
            fetchMatches();
        }
    };

    const handleUpdateScore = async (matchId: string, scoreA: any, scoreB: any, status: string) => {
        console.log('Attempting update for ID:', matchId, 'Scores:', scoreA, scoreB, 'Status:', status);

        if (!matchId || matchId === 'undefined') {
            alert('Error: Match ID is missing. Please refresh the page.');
            return;
        }

        // Handle empty inputs or non-numbers
        const sA = scoreA === '' ? null : parseInt(scoreA);
        const sB = scoreB === '' ? null : parseInt(scoreB);

        // This single update will now trigger the entire leaderboard calculation
        // inside the database (once you've added the SQL Trigger)
        const { error: matchError } = await supabase.from('matches')
            .update({
                score_a: sA,
                score_b: sB,
                status: status
            })
            .eq('id', matchId);

        if (matchError) {
            console.error('Full Supabase Error:', matchError);
            alert(`Update Failed!\nMessage: ${matchError.message}\nCode: ${matchError.code}\n\nTIP: If this is a "WHERE clause" error, it usually means your RLS Policy is still blocking the update.`);
            return;
        }

        alert('Match updated! The leaderboard will recalculate automatically in the background.');
        fetchMatches();
    };

    return (
        <div className="space-y-10">
            <h1 className="text-3xl font-bold gradient-text">Admin Dashboard</h1>

            <section className="glass-card p-6">
                <h2 className="text-xl font-bold mb-4 text-slate-300">Add New Match</h2>
                <form onSubmit={handleAddMatch} className="flex flex-wrap gap-4">
                    <input className="input-field flex-1" placeholder="Team A" value={teamA} onChange={e => setTeamA(e.target.value)} required />
                    <input className="input-field flex-1" placeholder="Team B" value={teamB} onChange={e => setTeamB(e.target.value)} required />
                    <input className="input-field flex-1" placeholder="Venue" value={venue} onChange={e => setVenue(e.target.value)} required />
                    <input className="input-field flex-1" type="datetime-local" value={kickoff} onChange={e => setKickoff(e.target.value)} required />
                    <button type="submit" className="premium-button">Add Match</button>
                </form>
            </section>

            <section className="space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h2 className="text-xl font-bold text-slate-300">Manage Matches</h2>
                    <input
                        type="text"
                        placeholder="Search matches..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="input-field max-w-xs h-10 py-0 border-2 border-indigo-500/20 focus:border-indigo-600 font-bold"
                    />
                </div>

                <div className="grid gap-4">
                    {filteredMatches.map(m => (
                        <div key={m.id} className="glass-card p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                            <div className="flex-1">
                                <span className="font-bold text-slate-800">{m.team_a} vs {m.team_b}</span>
                                <div className="text-xs text-slate-500">{new Date(m.kickoff).toLocaleString()}</div>
                                <div className="text-[10px] text-slate-400 font-medium uppercase mt-1">{m.venue}</div>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        className="input-field w-12 h-9 p-1 text-center font-bold"
                                        defaultValue={m.score_a ?? ''}
                                        id={`a-${m.id}`}
                                        placeholder="A"
                                    />
                                    <input
                                        type="number"
                                        className="input-field w-12 h-9 p-1 text-center font-bold"
                                        defaultValue={m.score_b ?? ''}
                                        id={`b-${m.id}`}
                                        placeholder="B"
                                    />
                                </div>

                                <select
                                    className="input-field h-9 py-0 text-sm font-medium"
                                    defaultValue={m.status}
                                    id={`status-${m.id}`}
                                >
                                    <option value="upcoming">Upcoming</option>
                                    <option value="live">Live</option>
                                    <option value="finished">Finished</option>
                                </select>

                                <button
                                    onClick={() => {
                                        const aValue = (document.getElementById(`a-${m.id}`) as HTMLInputElement).value;
                                        const bValue = (document.getElementById(`b-${m.id}`) as HTMLInputElement).value;
                                        const s = (document.getElementById(`status-${m.id}`) as HTMLSelectElement).value;
                                        handleUpdateScore(m.id, aValue, bValue, s);
                                    }}
                                    className="flex-1 md:flex-none px-6 py-2 rounded-xl bg-indigo-600/10 hover:bg-indigo-600 text-indigo-600 hover:text-white text-sm font-bold border border-indigo-600/20 transition-all duration-300"
                                >
                                    Update
                                </button>
                            </div>
                        </div>
                    ))}

                    {filteredMatches.length === 0 && (
                        <div className="text-center py-10 glass-card">
                            <p className="text-slate-400">No matches found for "{search}"</p>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
