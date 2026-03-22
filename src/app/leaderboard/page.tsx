'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Profile, Match } from '@/types/database';

export default function LeaderboardPage() {
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [lastMatch, setLastMatch] = useState<Match | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchLeaderboard() {
            // Get Profiles
            const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .or('is_disabled.eq.false,is_disabled.is.null')
                .order('total_points', { ascending: false });
            setProfiles(profileData || []);

            // Get Last Finished Match
            const { data: matchData } = await supabase
                .from('matches')
                .select('*')
                .eq('status', 'finished')
                .order('kickoff', { ascending: false })
                .limit(1)
                .maybeSingle();
            setLastMatch(matchData);

            setLoading(false);
        }

        fetchLeaderboard();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 md:space-y-8 px-2 md:px-0">
            <div className="text-center">
                <h1 className="text-3xl md:text-4xl font-bold gradient-text">Leaderboard</h1>
                <p className="text-sm md:text-base text-slate-500 mt-2">Top predictors competing for the crown</p>

                <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100/50">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                    </span>
                    <span className="text-[11px] md:text-xs font-bold text-indigo-700 uppercase tracking-wider">
                        {lastMatch ? (
                            <>Last Updated: {lastMatch.team_a} {lastMatch.score_a} - {lastMatch.score_b} {lastMatch.team_b}</>
                        ) : (
                            <>Leaderboard waiting for first match result</>
                        )}
                    </span>
                </div>
            </div>

            <div className="glass-card overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/50">
                            <th className="px-4 md:px-6 py-3 md:py-4 font-bold text-slate-600 text-xs md:text-sm uppercase tracking-wider">Rank</th>
                            <th className="px-4 md:px-6 py-3 md:py-4 font-bold text-slate-600 text-xs md:text-sm uppercase tracking-wider">Predictor</th>
                            <th className="px-4 md:px-6 py-3 md:py-4 font-bold text-slate-600 text-xs md:text-sm uppercase tracking-wider text-right">Points</th>
                        </tr>
                    </thead>
                    <tbody>
                        {profiles.map((profile, index) => (
                            <tr key={profile.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                <td className="px-4 md:px-6 py-3 md:py-4">
                                    <span className={`inline-flex items-center justify-center w-7 h-7 md:w-8 md:h-8 rounded-full font-bold text-xs md:text-sm ${index === 0 ? 'bg-yellow-100 text-yellow-700' :
                                        index === 1 ? 'bg-slate-100 text-slate-700' :
                                            index === 2 ? 'bg-orange-100 text-orange-700' :
                                                'text-slate-400'
                                        }`}>
                                        {index + 1}
                                    </span>
                                </td>
                                <td className="px-4 md:px-6 py-3 md:py-4 max-w-[120px] md:max-w-none">
                                    <div className="font-bold text-slate-800 text-sm md:text-base truncate" title={profile.display_name}>{profile.display_name}</div>
                                </td>
                                <td className="px-4 md:px-6 py-3 md:py-4 text-right">
                                    <span className="text-lg md:text-xl font-black text-indigo-600">{profile.total_points}</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {profiles.length === 0 && (
                    <div className="text-center py-10 text-slate-500">
                        No predictors yet. Be the first!
                    </div>
                )}
            </div>
        </div>
    );
}
