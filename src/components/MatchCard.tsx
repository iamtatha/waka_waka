'use client';

import { Match, Prediction } from '@/types/database';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface MatchCardProps {
    match: Match;
    userId: string | null;
    existingPrediction: Prediction | null;
}

export default function MatchCard({ match, userId, existingPrediction }: MatchCardProps) {
    const [predA, setPredA] = useState<string>(existingPrediction?.pred_a?.toString() ?? '');
    const [predB, setPredB] = useState<string>(existingPrediction?.pred_b?.toString() ?? '');
    const [loading, setLoading] = useState(false);
    const [saved, setSaved] = useState(false);

    const kickoffDate = new Date(match.kickoff);
    const istTime = kickoffDate.toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
    const isExpired = kickoffDate < new Date();

    useEffect(() => {
        if (existingPrediction) {
            setPredA(existingPrediction.pred_a.toString());
            setPredB(existingPrediction.pred_b.toString());
        }
    }, [existingPrediction]);

    const handleSave = async () => {
        if (!userId || isExpired) return;

        const a = parseInt(predA);
        const b = parseInt(predB);

        if (isNaN(a) || isNaN(b)) {
            alert('Please enter valid scores for both teams.');
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase.from('predictions').upsert({
                user_id: userId,
                match_id: match.id,
                pred_a: a,
                pred_b: b,
                updated_at: new Date().toISOString(),
            }, {
                onConflict: 'user_id,match_id'
            });

            if (error) {
                console.error('Supabase Error:', error.message, error.details, error.hint);
                throw error;
            }
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (error: any) {
            console.error('Full Error Object:', JSON.stringify(error, null, 2));
            alert(`Failed to save: ${error.message || 'Unknown error'}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="glass-card p-4 md:p-6 flex flex-col gap-6">
            <div className="flex justify-between items-center text-[10px] md:text-xs text-slate-500 font-medium">
                <div className="flex gap-2 divide-x divide-slate-200 overflow-hidden">
                    <span className="whitespace-nowrap">{istTime} (IST)</span>
                    <span className="pl-2 uppercase tracking-wider truncate hidden sm:inline">{match.venue}</span>
                </div>
                <span className={`px-2 py-0.5 md:py-1 rounded capitalize text-[10px] md:text-xs ${match.status === 'live' ? 'bg-red-500/20 text-red-500' :
                    match.status === 'finished' ? 'bg-slate-500/20 text-slate-500' :
                        'bg-indigo-500/20 text-indigo-600'
                    }`}>
                    {match.status}
                </span>
            </div>

            <div className="flex justify-between items-center gap-2 md:gap-4">
                <div className="flex-1 text-right font-bold text-base md:text-xl line-clamp-2 leading-tight">{match.team_a}</div>

                <div className="flex gap-1.5 md:gap-2 items-center flex-shrink-0">
                    <input
                        type="number"
                        className="input-field w-10 md:w-12 h-9 md:h-11 p-0 text-center text-lg md:text-xl font-bold bg-white/5"
                        value={predA}
                        onChange={(e) => setPredA(e.target.value)}
                        disabled={isExpired || !userId}
                        placeholder="-"
                    />
                    <span className="text-slate-400 text-xl md:text-2xl font-light">:</span>
                    <input
                        type="number"
                        className="input-field w-10 md:w-12 h-9 md:h-11 p-0 text-center text-lg md:text-xl font-bold bg-white/5"
                        value={predB}
                        onChange={(e) => setPredB(e.target.value)}
                        disabled={isExpired || !userId}
                        placeholder="-"
                    />
                </div>

                <div className="flex-1 text-left font-bold text-base md:text-xl line-clamp-2 leading-tight">{match.team_b}</div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                <div className="text-[10px] md:text-sm">
                    {match.status === 'finished' ? (
                        <span className="text-slate-500 font-medium">Result: <b className="text-slate-900">{match.score_a} - {match.score_b}</b></span>
                    ) : isExpired ? (
                        <span className="text-orange-600/80 font-medium">Closed</span>
                    ) : userId ? (
                        <span className="text-emerald-600/80 font-medium tracking-tight">Open</span>
                    ) : (
                        <span className="text-slate-400 italic">Login required</span>
                    )}
                </div>

                {!isExpired && userId && (
                    <button
                        onClick={handleSave}
                        disabled={loading || !predA || !predB}
                        className={`px-3 md:px-6 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-bold transition-all ${saved ? 'bg-emerald-500 text-white' : 'premium-button'
                            }`}
                    >
                        {loading ? '...' : saved ? 'Saved!' : 'Save'}
                    </button>
                )}

                {match.status === 'finished' && existingPrediction && (
                    <div className="text-right">
                        <span className="text-[10px] md:text-sm text-slate-500 mr-1 md:mr-2">Points:</span>
                        <span className={`text-base md:text-lg font-bold ${existingPrediction.points > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                            +{existingPrediction.points}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
