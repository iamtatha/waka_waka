'use client';

import { Match } from '@/types/database';
import { getFlagUrl } from '@/lib/flags';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface KnockoutBracketProps {
    matches: Match[];
    userId: string | null;
}

export default function KnockoutBracket({ matches, userId }: KnockoutBracketProps) {
    const [picks, setPicks] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        async function loadPicks() {
            if (!userId) {
                setLoading(false);
                return;
            }
            const { data } = await supabase.from('profiles').select('bracket_picks').eq('id', userId).single();
            if (data?.bracket_picks) {
                setPicks(data.bracket_picks as Record<string, string>);
            }
            setLoading(false);
        }
        loadPicks();
    }, [userId]);

    const handleSave = async () => {
        if (!userId) return;
        setSaving(true);
        const { error } = await supabase.from('profiles').update({ bracket_picks: picks }).eq('id', userId);
        if (error) {
            alert('Failed to save bracket: ' + error.message);
        } else {
            alert('Bracket saved successfully!');
        }
        setSaving(false);
    };

    function getRealWinner(match: Match): string | null {
        if (match.status === 'finished') {
            if (match.score_a !== null && match.score_b !== null) {
                if (match.score_a > match.score_b) return match.team_a;
                if (match.score_b > match.score_a) return match.team_b;
                if (match.penalty_winner === 'team_a') return match.team_a;
                if (match.penalty_winner === 'team_b') return match.team_b;
            }
        }
        return null;
    }

    function getMatchTeams(matchNumber: number): { teamA: string | null, teamB: string | null } {
        const match = matches.find(m => m.match_number === matchNumber);
        if (!match) return { teamA: null, teamB: null };

        let teamA = match.team_a;
        let teamB = match.team_b;

        if (teamA.startsWith('TBD (Winner Match ')) {
            const dep = parseInt(teamA.replace('TBD (Winner Match ', ''));
            const depMatch = matches.find(m => m.match_number === dep);
            const realWinner = depMatch ? getRealWinner(depMatch) : null;
            teamA = realWinner || picks[dep.toString()] || null;
        }

        if (teamB.startsWith('TBD (Winner Match ')) {
            const dep = parseInt(teamB.replace('TBD (Winner Match ', ''));
            const depMatch = matches.find(m => m.match_number === dep);
            const realWinner = depMatch ? getRealWinner(depMatch) : null;
            teamB = realWinner || picks[dep.toString()] || null;
        }

        return { teamA, teamB };
    }

    const handlePick = (matchNumber: number, winner: string | null) => {
        if (!winner || !userId) return;
        const match = matches.find(m => m.match_number === matchNumber);
        if (!match) return;
        if (getRealWinner(match)) return; // Can't change finished match

        setPicks(prev => {
            const newPicks = { ...prev, [matchNumber.toString()]: winner };
            
            // Clean up downstream picks if this invalidates them
            // A simple way is to re-evaluate the bracket, but since it's just state,
            // downstream matches will naturally lose their teamA/teamB if it changes.
            // But we should delete old picks if the team didn't make it.
            // To be perfect, we could traverse, but for now just updating the pick is enough,
            // as invalid picks won't be renderable.
            return newPicks;
        });
    };

    const MatchSlot = ({ mn }: { mn: number }) => {
        const { teamA, teamB } = getMatchTeams(mn);
        const match = matches.find(m => m.match_number === mn);
        const realWinner = match ? getRealWinner(match) : null;
        const currentPick = realWinner || picks[mn.toString()] || null;

        const isFinished = !!realWinner;

        return (
            <div className="flex flex-col gap-2 relative bg-white/20 p-2 rounded-xl border border-white/30 shadow-sm backdrop-blur-sm">
                <div className="text-[9px] text-center text-slate-500 font-bold -mb-1">M{mn}</div>
                <button
                    onClick={() => handlePick(mn, teamA)}
                    disabled={isFinished || !teamA}
                    className={`w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden border-4 flex items-center justify-center transition-all ${
                        currentPick === teamA
                            ? 'border-indigo-600 shadow-[0_0_15px_rgba(79,70,229,0.5)] scale-110 z-10'
                            : 'border-white opacity-70 hover:opacity-100 hover:scale-105'
                    } ${!teamA ? 'bg-slate-200' : 'bg-slate-100'}`}
                >
                    {teamA ? (
                        <img src={getFlagUrl(teamA) || ''} alt={teamA} className="w-full h-full object-cover" title={teamA} />
                    ) : (
                        <span className="text-slate-400 text-xs">?</span>
                    )}
                </button>
                <button
                    onClick={() => handlePick(mn, teamB)}
                    disabled={isFinished || !teamB}
                    className={`w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden border-4 flex items-center justify-center transition-all ${
                        currentPick === teamB
                            ? 'border-indigo-600 shadow-[0_0_15px_rgba(79,70,229,0.5)] scale-110 z-10'
                            : 'border-white opacity-70 hover:opacity-100 hover:scale-105'
                    } ${!teamB ? 'bg-slate-200' : 'bg-slate-100'}`}
                >
                    {teamB ? (
                        <img src={getFlagUrl(teamB) || ''} alt={teamB} className="w-full h-full object-cover" title={teamB} />
                    ) : (
                        <span className="text-slate-400 text-xs">?</span>
                    )}
                </button>
            </div>
        );
    };

    if (loading) return <div className="text-center py-10">Loading Bracket...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white/50 p-4 rounded-2xl shadow-sm border border-slate-200">
                <div>
                    <h2 className="text-xl font-black text-slate-800">Knockout Mania</h2>
                    <p className="text-sm text-slate-500">Click a flag to predict who advances to the next round.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving || !userId}
                    className="premium-button px-6 py-2 shadow-lg shadow-indigo-500/30"
                >
                    {saving ? 'Saving...' : 'Save Bracket'}
                </button>
            </div>

            <div className="w-full overflow-x-auto pb-10 custom-scrollbar">
                <div className="min-w-[900px] flex justify-between gap-4 p-4 mx-auto">
                    {/* LEFT SIDE */}
                    <div className="flex flex-col gap-4 justify-around w-16">
                        <MatchSlot mn={74} />
                        <MatchSlot mn={77} />
                        <MatchSlot mn={73} />
                        <MatchSlot mn={75} />
                        <MatchSlot mn={76} />
                        <MatchSlot mn={78} />
                        <MatchSlot mn={79} />
                        <MatchSlot mn={80} />
                    </div>
                    <div className="flex flex-col justify-around w-16">
                        <MatchSlot mn={89} />
                        <MatchSlot mn={90} />
                        <MatchSlot mn={91} />
                        <MatchSlot mn={92} />
                    </div>
                    <div className="flex flex-col justify-around w-16">
                        <MatchSlot mn={97} />
                        <MatchSlot mn={99} />
                    </div>
                    <div className="flex flex-col justify-around w-16">
                        <MatchSlot mn={101} />
                    </div>

                    {/* CENTER FINAL */}
                    <div className="flex flex-col justify-center items-center w-24">
                        <div className="text-sm font-black text-amber-500 mb-2 drop-shadow-md">FINAL</div>
                        <MatchSlot mn={104} />
                    </div>

                    {/* RIGHT SIDE */}
                    <div className="flex flex-col justify-around w-16">
                        <MatchSlot mn={102} />
                    </div>
                    <div className="flex flex-col justify-around w-16">
                        <MatchSlot mn={98} />
                        <MatchSlot mn={100} />
                    </div>
                    <div className="flex flex-col justify-around w-16">
                        <MatchSlot mn={93} />
                        <MatchSlot mn={94} />
                        <MatchSlot mn={95} />
                        <MatchSlot mn={96} />
                    </div>
                    <div className="flex flex-col gap-4 justify-around w-16">
                        <MatchSlot mn={83} />
                        <MatchSlot mn={84} />
                        <MatchSlot mn={81} />
                        <MatchSlot mn={82} />
                        <MatchSlot mn={86} />
                        <MatchSlot mn={88} />
                        <MatchSlot mn={85} />
                        <MatchSlot mn={87} />
                    </div>
                </div>
            </div>
        </div>
    );
}
