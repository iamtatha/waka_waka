'use client';

import { useState, useMemo } from 'react';
import { Profile, Prediction, Match } from '@/types/database';

interface HeadToHeadProps {
    profile: Profile;
    predictions: Prediction[]; // User's predictions
    allProfiles: Profile[];
    allPredictions: Prediction[];
    finishedMatches: Match[];
}

interface H2HMatchStat {
    match: Match;
    userPoints: number;
    oppPoints: number;
    diff: number;
}

export default function HeadToHead({ profile, predictions, allProfiles, allPredictions, finishedMatches }: HeadToHeadProps) {
    const opponents = allProfiles.filter(p => p.id !== profile.id);
    const [selectedOpponentId, setSelectedOpponentId] = useState<string>(opponents.length > 0 ? opponents[0].id : '');
    const [isTableOpen, setIsTableOpen] = useState(false);

    const stats = useMemo(() => {
        if (!selectedOpponentId) return null;

        const opponent = allProfiles.find(p => p.id === selectedOpponentId);
        if (!opponent) return null;

        const opponentPredictions = allPredictions.filter(p => p.user_id === selectedOpponentId);

        let userPoints = 0;
        let oppPoints = 0;
        let overlap = 0;
        let commonMatches = 0;
        let userGainedOppZero = 0;
        let oppGainedUserZero = 0;

        const userPointsArray: number[] = [];
        const oppPointsArray: number[] = [];

        let userPerfect = 0;
        let oppPerfect = 0;
        let userZero = 0;
        let oppZero = 0;

        const matchWiseStats: H2HMatchStat[] = [];

        finishedMatches.forEach(match => {
            const userPred = predictions.find(p => p.match_id === match.id);
            const oppPred = opponentPredictions.find(p => p.match_id === match.id);

            const uPts = userPred?.points || 0;
            const oPts = oppPred?.points || 0;

            matchWiseStats.push({
                match,
                userPoints: uPts,
                oppPoints: oPts,
                diff: uPts - oPts
            });

            if (userPred) {
                userPoints += uPts;
                userPointsArray.push(uPts);
                if (uPts === 5) userPerfect++;
                if (uPts === 0) userZero++;
            }
            if (oppPred) {
                oppPoints += oPts;
                oppPointsArray.push(oPts);
                if (oPts === 5) oppPerfect++;
                if (oPts === 0) oppZero++;
            }

            if (userPred && oppPred) {
                commonMatches++;
                if (userPred.pred_a === oppPred.pred_a && userPred.pred_b === oppPred.pred_b) {
                    overlap++;
                }

                if (uPts > 0 && oPts === 0) {
                    userGainedOppZero++;
                } else if (oPts > 0 && uPts === 0) {
                    oppGainedUserZero++;
                }
            }
        });

        matchWiseStats.sort((a, b) => new Date(b.match.kickoff).getTime() - new Date(a.match.kickoff).getTime());

        const overlapRate = commonMatches > 0 ? (overlap / commonMatches) * 100 : 0;

        // Mean
        const userMean = userPointsArray.length > 0 ? userPointsArray.reduce((a, b) => a + b, 0) / userPointsArray.length : 0;
        const oppMean = oppPointsArray.length > 0 ? oppPointsArray.reduce((a, b) => a + b, 0) / oppPointsArray.length : 0;

        // Std Dev
        let userStdDev = 0;
        let oppStdDev = 0;
        if (userPointsArray.length > 1) {
            const variance = userPointsArray.reduce((acc, val) => acc + Math.pow(val - userMean, 2), 0) / (userPointsArray.length - 1);
            userStdDev = Math.sqrt(variance);
        }
        if (oppPointsArray.length > 1) {
            const variance = oppPointsArray.reduce((acc, val) => acc + Math.pow(val - oppMean, 2), 0) / (oppPointsArray.length - 1);
            oppStdDev = Math.sqrt(variance);
        }

        return {
            opponent,
            userTotalPoints: userPoints,
            oppTotalPoints: oppPoints,
            userMean,
            oppMean,
            userStdDev,
            oppStdDev,
            userPerfect,
            oppPerfect,
            userZero,
            oppZero,
            overlapRate,
            commonMatches,
            userGainedOppZero,
            oppGainedUserZero,
            userCoverage: finishedMatches.length > 0 ? (predictions.filter(p => finishedMatches.some(m => m.id === p.match_id)).length / finishedMatches.length) * 100 : 0,
            oppCoverage: finishedMatches.length > 0 ? (opponentPredictions.filter(p => finishedMatches.some(m => m.id === p.match_id)).length / finishedMatches.length) * 100 : 0,
            matchWiseStats
        };
    }, [selectedOpponentId, profile, predictions, allProfiles, allPredictions, finishedMatches]);

    if (opponents.length === 0) {
        return (
            <div className="glass-card p-6 text-center text-slate-500">
                Not enough predictors to compare against. Invite some friends!
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 glass-card p-4">
                <div className="font-bold text-slate-700">Select Opponent:</div>
                <select 
                    className="w-full md:w-64 p-2 rounded-lg border border-slate-200 bg-white text-slate-700 font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={selectedOpponentId}
                    onChange={(e) => setSelectedOpponentId(e.target.value)}
                >
                    {opponents.map(opp => (
                        <option key={opp.id} value={opp.id}>{opp.display_name}</option>
                    ))}
                </select>
            </div>

            {stats && (
                <div className="glass-card p-6 border-t-4 border-t-indigo-500">
                    <div className="flex justify-between items-center mb-8">
                        <div className="text-center w-5/12">
                            <div className="text-xl md:text-2xl font-black text-slate-800 truncate" title={profile.display_name}>{profile.display_name}</div>
                            <div className="text-sm text-indigo-500 font-bold">YOU</div>
                        </div>
                        <div className="w-2/12 text-center text-xl font-black text-slate-300">VS</div>
                        <div className="text-center w-5/12">
                            <div className="text-xl md:text-2xl font-black text-slate-800 truncate" title={stats.opponent.display_name}>{stats.opponent.display_name}</div>
                            <div className="text-sm text-purple-500 font-bold">THEM</div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {/* Total Points */}
                        <div className="flex items-center justify-between py-3 border-b border-slate-100 bg-slate-50/50 rounded-lg px-2">
                            <div className={`w-1/3 text-center text-2xl font-black ${stats.userTotalPoints > stats.oppTotalPoints ? 'text-indigo-600' : 'text-slate-600'}`}>{stats.userTotalPoints}</div>
                            <div className="w-1/3 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">Total Points</div>
                            <div className={`w-1/3 text-center text-2xl font-black ${stats.oppTotalPoints > stats.userTotalPoints ? 'text-purple-600' : 'text-slate-600'}`}>{stats.oppTotalPoints}</div>
                        </div>

                        {/* Mean */}
                        <div className="flex items-center justify-between py-3 border-b border-slate-100 px-2">
                            <div className={`w-1/3 text-center text-xl font-bold ${stats.userMean > stats.oppMean ? 'text-indigo-600' : 'text-slate-600'}`}>{stats.userMean.toFixed(2)}</div>
                            <div className="w-1/3 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">Mean Score</div>
                            <div className={`w-1/3 text-center text-xl font-bold ${stats.oppMean > stats.userMean ? 'text-purple-600' : 'text-slate-600'}`}>{stats.oppMean.toFixed(2)}</div>
                        </div>

                        {/* Std Dev */}
                        <div className="flex items-center justify-between py-3 border-b border-slate-100 bg-slate-50/50 rounded-lg px-2">
                            <div className={`w-1/3 text-center text-lg font-bold ${stats.userStdDev < stats.oppStdDev ? 'text-indigo-600' : 'text-slate-600'}`}>±{stats.userStdDev.toFixed(2)}</div>
                            <div className="w-1/3 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">Consistency (Std Dev)</div>
                            <div className={`w-1/3 text-center text-lg font-bold ${stats.oppStdDev < stats.userStdDev ? 'text-purple-600' : 'text-slate-600'}`}>±{stats.oppStdDev.toFixed(2)}</div>
                        </div>

                        {/* Coverage */}
                        <div className="flex items-center justify-between py-3 border-b border-slate-100 px-2">
                            <div className="w-1/3 text-center text-lg font-bold text-slate-600">{stats.userCoverage.toFixed(0)}%</div>
                            <div className="w-1/3 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">Coverage</div>
                            <div className="w-1/3 text-center text-lg font-bold text-slate-600">{stats.oppCoverage.toFixed(0)}%</div>
                        </div>

                        {/* Perfect Scores */}
                        <div className="flex items-center justify-between py-3 border-b border-slate-100 bg-slate-50/50 rounded-lg px-2">
                            <div className={`w-1/3 text-center text-xl font-bold ${stats.userPerfect > stats.oppPerfect ? 'text-emerald-600' : 'text-slate-600'}`}>{stats.userPerfect}</div>
                            <div className="w-1/3 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">Perfect Hits (+5)</div>
                            <div className={`w-1/3 text-center text-xl font-bold ${stats.oppPerfect > stats.userPerfect ? 'text-emerald-600' : 'text-slate-600'}`}>{stats.oppPerfect}</div>
                        </div>

                        {/* Zero Scores */}
                        <div className="flex items-center justify-between py-3 border-b border-slate-100 px-2">
                            <div className={`w-1/3 text-center text-xl font-bold ${stats.userZero < stats.oppZero ? 'text-red-500' : 'text-slate-600'}`}>{stats.userZero}</div>
                            <div className="w-1/3 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">Complete Misses (0)</div>
                            <div className={`w-1/3 text-center text-xl font-bold ${stats.oppZero < stats.userZero ? 'text-red-500' : 'text-slate-600'}`}>{stats.oppZero}</div>
                        </div>

                        {/* Overlap */}
                        <div className="bg-slate-50 rounded-lg p-4 mt-6">
                            <div className="text-center text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Prediction Overlap</div>
                            <div className="flex items-center justify-center gap-4">
                                <div className="text-3xl font-black text-slate-700">{stats.overlapRate.toFixed(0)}%</div>
                            </div>
                            <div className="text-center text-xs text-slate-400 mt-1">You predicted the exact same score {stats.commonMatches > 0 ? (stats.overlapRate * stats.commonMatches / 100).toFixed(0) : 0} times.</div>
                        </div>

                        {/* Divergence */}
                        <div className="grid grid-cols-2 gap-4 mt-4">
                            <div className="bg-indigo-50/50 rounded-lg p-4 text-center border border-indigo-100">
                                <div className="text-2xl font-black text-indigo-600 mb-1">{stats.userGainedOppZero}</div>
                                <div className="text-xs font-medium text-slate-500">Matches where you scored and they got 0</div>
                            </div>
                            <div className="bg-purple-50/50 rounded-lg p-4 text-center border border-purple-100">
                                <div className="text-2xl font-black text-purple-600 mb-1">{stats.oppGainedUserZero}</div>
                                <div className="text-xs font-medium text-slate-500">Matches where they scored and you got 0</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {stats && (
                <div className="glass-card overflow-hidden">
                    <button 
                        onClick={() => setIsTableOpen(!isTableOpen)}
                        className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors"
                    >
                        <span className="font-bold text-slate-800 text-lg">Match-wise Comparison</span>
                        <span className="text-slate-400">
                            {isTableOpen ? (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" /></svg>
                            ) : (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                            )}
                        </span>
                    </button>

                    {isTableOpen && (
                        <div className="border-t border-slate-100">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-slate-50/50">
                                            <th className="px-4 py-3 font-bold text-slate-500 text-xs uppercase tracking-wider">Match</th>
                                            <th className="px-4 py-3 font-bold text-slate-500 text-xs uppercase tracking-wider text-center">Your Score</th>
                                            <th className="px-4 py-3 font-bold text-slate-500 text-xs uppercase tracking-wider text-center">Their Score</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {stats.matchWiseStats.map((stat, idx) => (
                                            <tr key={stat.match.id} className={`border-b border-slate-50 hover:bg-slate-50 transition-colors ${idx % 2 === 0 ? '' : 'bg-slate-50/30'}`}>
                                                <td className="px-4 py-3">
                                                    <div className="font-bold text-slate-700 text-sm">{stat.match.team_a} vs {stat.match.team_b}</div>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className={`font-black ${stat.userPoints > 0 ? 'text-indigo-600' : 'text-slate-400'}`}>+{stat.userPoints}</span>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className={`font-black ${stat.oppPoints > 0 ? 'text-purple-600' : 'text-slate-400'}`}>+{stat.oppPoints}</span>
                                                </td>
                                            </tr>
                                        ))}
                                        {stats.matchWiseStats.length === 0 && (
                                            <tr>
                                                <td colSpan={3} className="px-4 py-8 text-center text-slate-500 text-sm">
                                                    No finished matches yet.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

