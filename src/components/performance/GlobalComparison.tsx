'use client';

import { useMemo, useState } from 'react';
import { Profile, Prediction, Match } from '@/types/database';
import MatchPointboardModal from './MatchPointboardModal';

interface GlobalComparisonProps {
    profile: Profile;
    predictions: Prediction[]; // User's predictions
    allProfiles: Profile[];
    allPredictions: Prediction[];
    finishedMatches: Match[];
}

interface MatchStat {
    match: Match;
    userPoints: number;
    globalMean: number;
    diff: number;
}

export default function GlobalComparison({ profile, predictions, allProfiles, allPredictions, finishedMatches }: GlobalComparisonProps) {
    const [isTableOpen, setIsTableOpen] = useState(false);
    const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

    const stats = useMemo(() => {
        const totalFinishedMatches = finishedMatches.length;

        // --- User Stats ---
        const userFinishedPreds = predictions.filter(p => finishedMatches.some(m => m.id === p.match_id));
        const userCoverage = totalFinishedMatches > 0 ? (userFinishedPreds.length / totalFinishedMatches) * 100 : 0;
        const userPointsArray = userFinishedPreds.map(p => p.points || 0);
        const userMean = userPointsArray.length > 0 ? userPointsArray.reduce((a, b) => a + b, 0) / userPointsArray.length : 0;
        const userPerfectHits = userPointsArray.filter(p => p === 5).length; // assuming 5 is perfect

        // --- Global Stats ---
        const globalFinishedPreds = allPredictions.filter(p => finishedMatches.some(m => m.id === p.match_id));
        
        const globalCoverage = (totalFinishedMatches > 0 && allProfiles.length > 0) 
            ? (globalFinishedPreds.length / (totalFinishedMatches * allProfiles.length)) * 100 
            : 0;

        const globalPointsArray = globalFinishedPreds.map(p => p.points || 0);
        const globalMean = globalPointsArray.length > 0 ? globalPointsArray.reduce((a, b) => a + b, 0) / globalPointsArray.length : 0;
        
        const globalPerfectHits = allProfiles.length > 0 ? globalPointsArray.filter(p => p === 5).length / allProfiles.length : 0;

        // Percentile rank
        const sortedProfiles = [...allProfiles].sort((a, b) => b.total_points - a.total_points);
        const rank = sortedProfiles.findIndex(p => p.id === profile.id) + 1;
        const percentile = allProfiles.length > 1 ? ((allProfiles.length - rank) / (allProfiles.length - 1)) * 100 : 100;

        // --- Match-wise Stats ---
        const teamPoints: Record<string, number> = {};
        const scorelineCounts: Record<string, number> = {};
        let totalPredictedGoals = 0;
        let totalActualGoals = 0;
        let predictedDraws = 0;
        let heartbreaks = 0;
        
        let maxGoalsPredicted = -1;
        let wildestPred: Prediction | null = null;
        let wildestMatch: Match | null = null;
        
        let cleanSheetsPredicted = 0;
        let actualCleanSheets = 0;
        let zeroPointMatches = 0;
        let teamAWinsPredicted = 0;
        let teamBWinsPredicted = 0;

        const matchWiseStats: MatchStat[] = finishedMatches.map(match => {
            const userPred = userFinishedPreds.find(p => p.match_id === match.id);
            const userPoints = userPred?.points || 0;

            teamPoints[match.team_a] = (teamPoints[match.team_a] || 0) + userPoints;
            teamPoints[match.team_b] = (teamPoints[match.team_b] || 0) + userPoints;

            if (userPred) {
                const sl = `${userPred.pred_a}-${userPred.pred_b}`;
                scorelineCounts[sl] = (scorelineCounts[sl] || 0) + 1;
                const goals = userPred.pred_a + userPred.pred_b;
                totalPredictedGoals += goals;
                
                if (userPred.pred_a === userPred.pred_b) predictedDraws++;
                if (userPoints === 3) heartbreaks++;
                
                if (goals > maxGoalsPredicted) {
                    maxGoalsPredicted = goals;
                    wildestPred = userPred;
                    wildestMatch = match;
                }

                if (userPred.pred_a === 0 || userPred.pred_b === 0) cleanSheetsPredicted++;
                if (userPoints === 0) zeroPointMatches++;
                if (userPred.pred_a > userPred.pred_b) teamAWinsPredicted++;
                else if (userPred.pred_b > userPred.pred_a) teamBWinsPredicted++;
                
                if (match.score_a === 0 || match.score_b === 0) actualCleanSheets++;

                if (match.score_a !== null && match.score_b !== null) {
                    totalActualGoals += (match.score_a + match.score_b);
                }
            }

            const globalPredsForMatch = globalFinishedPreds.filter(p => p.match_id === match.id);
            const globalMeanForMatch = globalPredsForMatch.length > 0 
                ? globalPredsForMatch.reduce((acc, p) => acc + (p.points || 0), 0) / globalPredsForMatch.length 
                : 0;

            return {
                match,
                userPoints,
                globalMean: globalMeanForMatch,
                diff: userPoints - globalMeanForMatch
            };
        }).sort((a, b) => new Date(b.match.kickoff).getTime() - new Date(a.match.kickoff).getTime());

        // Find outliers
        let topPerformance = null;
        let worstPerformance = null;

        const maxTeamPoints = Object.keys(teamPoints).length > 0 ? Math.max(...Object.values(teamPoints)) : 0;
        const bestTeams = Object.keys(teamPoints).filter(t => teamPoints[t] === maxTeamPoints && maxTeamPoints > 0);

        const minTeamPoints = Object.keys(teamPoints).length > 0 ? Math.min(...Object.values(teamPoints)) : 0;
        const kryptoniteTeams = Object.keys(teamPoints).filter(t => teamPoints[t] === minTeamPoints);

        let favoriteScoreline: string | null = null;
        let maxScorelineCount = 0;
        Object.entries(scorelineCounts).forEach(([sl, count]) => {
            if (count > maxScorelineCount) {
                maxScorelineCount = count;
                favoriteScoreline = sl;
            }
        });

        const actualDraws = finishedMatches.filter(m => m.score_a !== null && m.score_b !== null && m.score_a === m.score_b).length;

        const totalZeros = globalFinishedPreds.filter(p => p.points === 0).length;
        const globalZeroAverage = allProfiles.length > 0 ? totalZeros / allProfiles.length : 0;

        if (matchWiseStats.length > 0) {
            // Sort by difference
            const sortedByDiff = [...matchWiseStats].sort((a, b) => b.diff - a.diff);
            if (sortedByDiff[0].diff > 0) {
                topPerformance = sortedByDiff[0];
            }
            if (sortedByDiff[sortedByDiff.length - 1].diff < 0) {
                worstPerformance = sortedByDiff[sortedByDiff.length - 1];
            }
        }

        return {
            userMean,
            globalMean,
            userCoverage,
            globalCoverage,
            userPerfectHits,
            globalPerfectHits,
            percentile,
            rank,
            totalUsers: allProfiles.length,
            matchWiseStats,
            topPerformance,
            worstPerformance,
            bestTeams,
            maxTeamPoints,
            kryptoniteTeams,
            minTeamPoints,
            favoriteScoreline,
            maxScorelineCount,
            totalPredictedGoals,
            totalActualGoals,
            heartbreaks,
            predictedDraws,
            actualDraws,
            wildestPred: wildestPred as Prediction | null,
            wildestMatch: wildestMatch as Match | null,
            maxGoalsPredicted,
            cleanSheetsPredicted,
            actualCleanSheets,
            zeroPointMatches,
            globalZeroAverage,
            teamAWinsPredicted,
            teamBWinsPredicted
        };
    }, [profile, predictions, allProfiles, allPredictions, finishedMatches]);

    return (
        <div className="space-y-6">
            <div className="glass-card p-6 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-200/50">
                <div className="text-center">
                    <h3 className="text-xl font-bold text-slate-800 mb-2">Global Standing</h3>
                    <div className="text-4xl md:text-5xl font-black text-indigo-600 my-4">
                        Top {Math.max(1, 100 - stats.percentile).toFixed(0)}%
                    </div>
                    <p className="text-slate-600 font-medium">
                        You are rank <span className="font-bold text-slate-800">#{stats.rank}</span> out of {stats.totalUsers} predictors.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="glass-card p-5">
                    <div className="text-sm text-slate-500 font-bold mb-4 text-center">MEAN SCORE</div>
                    <div className="flex justify-between items-end mb-2">
                        <div className="text-center w-1/2">
                            <div className="text-2xl font-black text-indigo-600">{stats.userMean.toFixed(2)}</div>
                            <div className="text-xs text-slate-400 mt-1">You</div>
                        </div>
                        <div className="text-center w-1/2">
                            <div className="text-2xl font-black text-slate-400">{stats.globalMean.toFixed(2)}</div>
                            <div className="text-xs text-slate-400 mt-1">Global Avg</div>
                        </div>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 mt-4 flex overflow-hidden">
                        <div className="bg-indigo-500 h-2" style={{ width: `${Math.min(100, (stats.userMean / (Math.max(stats.userMean, stats.globalMean) || 1)) * 100)}%` }}></div>
                        <div className="bg-slate-300 h-2" style={{ width: `${Math.min(100, (stats.globalMean / (Math.max(stats.userMean, stats.globalMean) || 1)) * 100)}%` }}></div>
                    </div>
                </div>

                <div className="glass-card p-5">
                    <div className="text-sm text-slate-500 font-bold mb-4 text-center">COVERAGE</div>
                    <div className="flex justify-between items-end mb-2">
                        <div className="text-center w-1/2">
                            <div className="text-2xl font-black text-purple-600">{stats.userCoverage.toFixed(0)}%</div>
                            <div className="text-xs text-slate-400 mt-1">You</div>
                        </div>
                        <div className="text-center w-1/2">
                            <div className="text-2xl font-black text-slate-400">{stats.globalCoverage.toFixed(0)}%</div>
                            <div className="text-xs text-slate-400 mt-1">Global Avg</div>
                        </div>
                    </div>
                </div>

                <div className="glass-card p-5">
                    <div className="text-sm text-slate-500 font-bold mb-4 text-center">PERFECT HITS (+5)</div>
                    <div className="flex justify-between items-end mb-2">
                        <div className="text-center w-1/2">
                            <div className="text-2xl font-black text-emerald-600">{stats.userPerfectHits}</div>
                            <div className="text-xs text-slate-400 mt-1">You</div>
                        </div>
                        <div className="text-center w-1/2">
                            <div className="text-2xl font-black text-slate-400">{stats.globalPerfectHits.toFixed(1)}</div>
                            <div className="text-xs text-slate-400 mt-1">Global Avg</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Catchy Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {stats.topPerformance && (
                    <div className="glass-card p-5 bg-emerald-50/50 border-emerald-100">
                        <div className="flex items-start gap-3">
                            <div className="text-3xl">🚀</div>
                            <div>
                                <h4 className="font-black text-emerald-700 text-lg uppercase tracking-wide">The Outperformer</h4>
                                <p className="text-sm text-slate-600 mt-1">
                                    You scored <span className="font-bold text-emerald-600">+{stats.topPerformance.userPoints}</span> when the global average was a measly <span className="font-bold text-slate-500">{stats.topPerformance.globalMean.toFixed(1)}</span>.
                                </p>
                                <div className="mt-2 inline-block px-3 py-1 bg-white rounded-full text-xs font-bold text-slate-700 shadow-sm border border-slate-100">
                                    {stats.topPerformance.match.team_a} vs {stats.topPerformance.match.team_b}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {stats.worstPerformance && (
                    <div className="glass-card p-5 bg-red-50/50 border-red-100">
                        <div className="flex items-start gap-3">
                            <div className="text-3xl">📉</div>
                            <div>
                                <h4 className="font-black text-red-700 text-lg uppercase tracking-wide">Missed The Boat</h4>
                                <p className="text-sm text-slate-600 mt-1">
                                    Everyone else scored an average of <span className="font-bold text-slate-500">{stats.worstPerformance.globalMean.toFixed(1)}</span> but you only got <span className="font-bold text-red-600">+{stats.worstPerformance.userPoints}</span>.
                                </p>
                                <div className="mt-2 inline-block px-3 py-1 bg-white rounded-full text-xs font-bold text-slate-700 shadow-sm border border-slate-100">
                                    {stats.worstPerformance.match.team_a} vs {stats.worstPerformance.match.team_b}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {stats.bestTeams && stats.bestTeams.length > 0 && (
                    <div className="glass-card p-5 bg-amber-50/50 border-amber-100">
                        <div className="flex items-start gap-3">
                            <div className="text-3xl">🏆</div>
                            <div>
                                <h4 className="font-black text-amber-700 text-lg uppercase tracking-wide">Lucky Charm</h4>
                                <p className="text-sm text-slate-600 mt-1">
                                    You scored a massive <span className="font-bold text-amber-600">+{stats.maxTeamPoints}</span> points in matches featuring <span className="font-bold text-slate-700">{stats.bestTeams.join(', ')}</span>.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
                {stats.kryptoniteTeams && stats.kryptoniteTeams.length > 0 && (
                    <div className="glass-card p-5 bg-purple-50/50 border-purple-100">
                        <div className="flex items-start gap-3">
                            <div className="text-3xl">👻</div>
                            <div>
                                <h4 className="font-black text-purple-700 text-lg uppercase tracking-wide">The Kryptonite</h4>
                                <p className="text-sm text-slate-600 mt-1">
                                    Matches with <span className="font-bold text-slate-700">{stats.kryptoniteTeams.join(', ')}</span> yielded your lowest total: <span className="font-bold text-purple-600">+{stats.minTeamPoints}</span> pts.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
                {stats.favoriteScoreline && (
                    <div className="glass-card p-5 bg-blue-50/50 border-blue-100">
                        <div className="flex items-start gap-3">
                            <div className="text-3xl">🎯</div>
                            <div>
                                <h4 className="font-black text-blue-700 text-lg uppercase tracking-wide">Mr. Predictable</h4>
                                <p className="text-sm text-slate-600 mt-1">
                                    Your favorite scoreline to predict is <span className="font-bold text-blue-600">{stats.favoriteScoreline}</span>. You've picked it <span className="font-bold text-slate-700">{stats.maxScorelineCount}</span> times.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
                {stats.totalPredictedGoals > 0 && (
                    <div className="glass-card p-5 bg-pink-50/50 border-pink-100">
                        <div className="flex items-start gap-3">
                            <div className="text-3xl">⚽</div>
                            <div>
                                <h4 className="font-black text-pink-700 text-lg uppercase tracking-wide">Goal Whisperer</h4>
                                <p className="text-sm text-slate-600 mt-1">
                                    You've predicted <span className="font-bold text-pink-600">{stats.totalPredictedGoals}</span> total goals so far. The actual matches had <span className="font-bold text-slate-700">{stats.totalActualGoals}</span> goals.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
                <div className="glass-card p-5 bg-orange-50/50 border-orange-100">
                    <div className="flex items-start gap-3">
                        <div className="text-3xl">💔</div>
                        <div>
                            <h4 className="font-black text-orange-700 text-lg uppercase tracking-wide">Heartbreaks</h4>
                            <p className="text-sm text-slate-600 mt-1">
                                You got the winner and goal difference right but missed the exact score by a whisker <span className="font-bold text-orange-600">{stats.heartbreaks}</span> times (3 pts).
                            </p>
                        </div>
                    </div>
                </div>
                <div className="glass-card p-5 bg-teal-50/50 border-teal-100">
                    <div className="flex items-start gap-3">
                        <div className="text-3xl">🤝</div>
                        <div>
                            <h4 className="font-black text-teal-700 text-lg uppercase tracking-wide">The Fence Sitter</h4>
                            <p className="text-sm text-slate-600 mt-1">
                                You predicted <span className="font-bold text-teal-600">{stats.predictedDraws}</span> draws, while there have been <span className="font-bold text-slate-700">{stats.actualDraws}</span> actual draws in finished games.
                            </p>
                        </div>
                    </div>
                </div>
                {stats.wildestMatch && stats.wildestPred && (
                    <div className="glass-card p-5 bg-rose-50/50 border-rose-100">
                        <div className="flex items-start gap-3">
                            <div className="text-3xl">🤯</div>
                            <div>
                                <h4 className="font-black text-rose-700 text-lg uppercase tracking-wide">Wildest Prediction</h4>
                                <p className="text-sm text-slate-600 mt-1">
                                    You predicted a massive <span className="font-bold text-rose-600">{stats.maxGoalsPredicted}</span> goals in <span className="font-bold text-slate-700">{stats.wildestMatch.team_a} vs {stats.wildestMatch.team_b}</span> with a score of <span className="font-bold text-rose-600">{stats.wildestPred.pred_a}-{stats.wildestPred.pred_b}</span>.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
                <div className="glass-card p-5 bg-slate-50/50 border-slate-200">
                    <div className="flex items-start gap-3">
                        <div className="text-3xl">🛡️</div>
                        <div>
                            <h4 className="font-black text-slate-700 text-lg uppercase tracking-wide">Clean Sheet Lover</h4>
                            <p className="text-sm text-slate-600 mt-1">
                                You predicted <span className="font-bold text-slate-800">{stats.cleanSheetsPredicted}</span> clean sheets, while there were actually <span className="font-bold text-slate-700">{stats.actualCleanSheets}</span> in the matches you predicted.
                            </p>
                        </div>
                    </div>
                </div>
                <div className="glass-card p-5 bg-stone-50/50 border-stone-200">
                    <div className="flex items-start gap-3">
                        <div className="text-3xl">🍩</div>
                        <div>
                            <h4 className="font-black text-stone-700 text-lg uppercase tracking-wide">The Zero Club</h4>
                            <p className="text-sm text-stone-600 mt-1">
                                You scored absolutely nothing in <span className="font-bold text-stone-800">{stats.zeroPointMatches}</span> matches. The global average is <span className="font-bold text-stone-500">{stats.globalZeroAverage.toFixed(1)}</span> goose eggs per person.
                            </p>
                        </div>
                    </div>
                </div>
                <div className="glass-card p-5 bg-lime-50/50 border-lime-100">
                    <div className="flex items-start gap-3">
                        <div className="text-3xl">🏠</div>
                        <div>
                            <h4 className="font-black text-lime-700 text-lg uppercase tracking-wide">Home Bias</h4>
                            <p className="text-sm text-slate-600 mt-1">
                                You backed "Team A" (Home) to win <span className="font-bold text-lime-600">{stats.teamAWinsPredicted}</span> times and "Team B" (Away) to win <span className="font-bold text-emerald-600">{stats.teamBWinsPredicted}</span> times.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Collapsible Match-wise Table */}
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
                                        <th className="px-2 md:px-4 py-2 md:py-3 font-bold text-slate-500 text-[10px] md:text-xs uppercase tracking-wider">Match</th>
                                        <th className="px-2 md:px-4 py-2 md:py-3 font-bold text-slate-500 text-[10px] md:text-xs uppercase tracking-wider text-center">Score</th>
                                        <th className="px-2 md:px-4 py-2 md:py-3 font-bold text-slate-500 text-[10px] md:text-xs uppercase tracking-wider text-center">Mean</th>
                                        <th className="px-2 md:px-4 py-2 md:py-3 font-bold text-slate-500 text-[10px] md:text-xs uppercase tracking-wider text-right">Diff</th>
                                        <th className="px-1 md:px-4 py-2 md:py-3"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats.matchWiseStats.map((stat, idx) => (
                                        <tr 
                                            key={stat.match.id} 
                                            className={`border-b border-slate-50 hover:bg-slate-100 transition-colors cursor-pointer group ${idx % 2 === 0 ? '' : 'bg-slate-50/30'}`}
                                            onClick={() => setSelectedMatch(stat.match)}
                                        >
                                            <td className="px-2 md:px-4 py-2 md:py-3">
                                                <div className="font-bold text-slate-700 text-[11px] md:text-sm whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px] sm:max-w-[200px] md:max-w-xs" title={`${stat.match.team_a} vs ${stat.match.team_b}`}>
                                                    {stat.match.team_a} <span className="text-slate-400 font-normal mx-0.5">vs</span> {stat.match.team_b}
                                                </div>
                                            </td>
                                            <td className="px-2 md:px-4 py-2 md:py-3 text-center">
                                                <span className={`font-black text-xs md:text-base ${stat.userPoints > 0 ? 'text-indigo-600' : 'text-slate-400'}`}>+{stat.userPoints}</span>
                                            </td>
                                            <td className="px-2 md:px-4 py-2 md:py-3 text-center">
                                                <span className="font-bold text-slate-500 text-[11px] md:text-sm">{stat.globalMean.toFixed(1)}</span>
                                            </td>
                                            <td className="px-2 md:px-4 py-2 md:py-3 text-right">
                                                <span className={`font-bold text-[11px] md:text-sm ${stat.diff > 0 ? 'text-emerald-600' : stat.diff < 0 ? 'text-red-500' : 'text-slate-400'}`}>
                                                    {stat.diff > 0 ? '+' : ''}{stat.diff.toFixed(1)}
                                                </span>
                                            </td>
                                            <td className="px-1 md:px-4 py-2 md:py-3 text-right">
                                                <svg className="w-4 h-4 md:w-5 md:h-5 text-slate-300 inline-block group-hover:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                                            </td>
                                        </tr>
                                    ))}
                                    {stats.matchWiseStats.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-4 py-8 text-center text-slate-500 text-sm">
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

            {selectedMatch && (
                <MatchPointboardModal
                    match={selectedMatch}
                    allProfiles={allProfiles}
                    allPredictions={allPredictions}
                    onClose={() => setSelectedMatch(null)}
                />
            )}
        </div>
    );
}

