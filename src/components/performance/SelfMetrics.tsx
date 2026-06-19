'use client';

import { useMemo } from 'react';
import { Profile, Prediction, Match } from '@/types/database';

interface SelfMetricsProps {
    profile: Profile;
    predictions: Prediction[];
    finishedMatches: Match[];
}

export default function SelfMetrics({ profile, predictions, finishedMatches }: SelfMetricsProps) {
    const stats = useMemo(() => {
        // Only consider predictions for finished matches
        const finishedPredictions = predictions.filter(p => 
            finishedMatches.some(m => m.id === p.match_id)
        );

        const totalFinishedMatches = finishedMatches.length;
        const predictionsMade = finishedPredictions.length;
        const coverage = totalFinishedMatches > 0 ? (predictionsMade / totalFinishedMatches) * 100 : 0;

        const pointsArray = finishedPredictions.map(p => p.points || 0);
        const meanPoints = predictionsMade > 0 ? pointsArray.reduce((a, b) => a + b, 0) / predictionsMade : 0;
        
        // Calculate Standard Deviation
        let stdDev = 0;
        if (predictionsMade > 1) {
            const variance = pointsArray.reduce((acc, val) => acc + Math.pow(val - meanPoints, 2), 0) / (predictionsMade - 1);
            stdDev = Math.sqrt(variance);
        }

        // Accuracy breakdown: group by points
        const pointsBreakdown = pointsArray.reduce((acc, points) => {
            acc[points] = (acc[points] || 0) + 1;
            return acc;
        }, {} as Record<number, number>);

        // Form Guide: last 5 matches points
        // Sort finished predictions by match kickoff
        const sortedPredictions = [...finishedPredictions].sort((a, b) => {
            const matchA = finishedMatches.find(m => m.id === a.match_id);
            const matchB = finishedMatches.find(m => m.id === b.match_id);
            if (!matchA || !matchB) return 0;
            return new Date(matchB.kickoff).getTime() - new Date(matchA.kickoff).getTime(); // descending
        });

        const formGuide = sortedPredictions.slice(0, 5).map(p => p.points || 0).reverse(); // chronological
        const formGuideMean = formGuide.length > 0 ? formGuide.reduce((a, b) => a + b, 0) / formGuide.length : 0;

        return {
            coverage,
            meanPoints,
            stdDev,
            pointsBreakdown,
            formGuide,
            formGuideMean
        };
    }, [predictions, finishedMatches]);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="glass-card p-4 text-center">
                    <div className="text-sm text-slate-500 uppercase tracking-wider font-bold mb-1">Total Points</div>
                    <div className="text-3xl font-black text-indigo-600">{profile.total_points}</div>
                </div>
                <div className="glass-card p-4 text-center">
                    <div className="text-sm text-slate-500 uppercase tracking-wider font-bold mb-1">Mean Score</div>
                    <div className="text-3xl font-black text-emerald-600">{stats.meanPoints.toFixed(2)}</div>
                    <div className="text-xs text-slate-400 mt-1">per prediction</div>
                </div>
                <div className="glass-card p-4 text-center">
                    <div className="text-sm text-slate-500 uppercase tracking-wider font-bold mb-1">Consistency</div>
                    <div className="text-3xl font-black text-blue-600">±{stats.stdDev.toFixed(2)}</div>
                    <div className="text-xs text-slate-400 mt-1">std deviation</div>
                </div>
                <div className="glass-card p-4 text-center">
                    <div className="text-sm text-slate-500 uppercase tracking-wider font-bold mb-1">Coverage</div>
                    <div className="text-3xl font-black text-purple-600">{stats.coverage.toFixed(0)}%</div>
                    <div className="text-xs text-slate-400 mt-1">matches predicted</div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass-card p-6">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">Accuracy Breakdown</h3>
                    <div className="space-y-3">
                        {Object.entries(stats.pointsBreakdown)
                            .sort(([a], [b]) => Number(b) - Number(a)) // Sort points descending
                            .map(([points, count]) => (
                            <div key={points} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <span className={`w-3 h-3 rounded-full ${Number(points) === 5 ? 'bg-emerald-500' : Number(points) > 0 ? 'bg-blue-400' : 'bg-red-400'}`}></span>
                                    <span className="font-bold text-slate-700">+{points} Points</span>
                                </div>
                                <span className="font-black text-slate-800">{count} <span className="text-sm text-slate-500 font-normal">times</span></span>
                            </div>
                        ))}
                        {Object.keys(stats.pointsBreakdown).length === 0 && (
                            <div className="text-center text-slate-500 text-sm py-4">No finished predictions yet.</div>
                        )}
                    </div>
                </div>

                <div className="glass-card p-6 flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-slate-800">Recent Form (Last 5)</h3>
                            {stats.formGuide.length > 0 && (
                                <div className="text-sm font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                                    Mean: {stats.formGuideMean.toFixed(2)}
                                </div>
                            )}
                        </div>
                    </div>
                    {stats.formGuide.length > 0 ? (
                        <div className="flex items-end justify-between h-32 gap-2 mt-auto">
                            {stats.formGuide.map((points, index) => {
                                const isMostRecent = index === stats.formGuide.length - 1;
                                return (
                                    <div key={index} className="flex flex-col items-center flex-1 gap-2 relative group">
                                        {isMostRecent && (
                                            <div className="absolute -top-6 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">
                                                Recent
                                            </div>
                                        )}
                                        <div className="w-full relative flex justify-center items-end h-full bg-slate-50 rounded-t-lg">
                                            <div 
                                                className={`w-full rounded-t-lg transition-all ${points === 5 ? 'bg-emerald-500' : points > 0 ? 'bg-blue-400' : 'bg-red-400/50'}`}
                                                style={{ height: `${Math.max((points / 5) * 100, 5)}%` }}
                                            ></div>
                                        </div>
                                        <span className={`font-bold text-sm ${isMostRecent ? 'text-indigo-600' : 'text-slate-700'}`}>+{points}</span>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center text-slate-500 text-sm py-4 h-full flex items-center justify-center mt-auto">No recent form data.</div>
                    )}
                </div>
            </div>
        </div>
    );
}
