import { useMemo } from 'react';
import { Profile, Prediction, Match } from '@/types/database';

interface MatchPointboardModalProps {
    match: Match;
    allProfiles: Profile[];
    allPredictions: Prediction[];
    onClose: () => void;
}

export default function MatchPointboardModal({ match, allProfiles, allPredictions, onClose }: MatchPointboardModalProps) {
    const ranklist = useMemo(() => {
        const matchPredictions = allPredictions.filter(p => p.match_id === match.id);
        
        const ranked = matchPredictions.map(pred => {
            const profile = allProfiles.find(p => p.id === pred.user_id);
            return {
                ...pred,
                display_name: profile?.display_name || 'Unknown User'
            };
        });

        // Sort descending by points
        ranked.sort((a, b) => b.points - a.points);
        return ranked;
    }, [match, allProfiles, allPredictions]);

    return (
        <div className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 pt-24">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="bg-slate-50 p-5 border-b border-slate-100 flex justify-between items-start relative">
                    <div className="text-center w-full">
                        <div className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">
                            {new Date(match.kickoff).toLocaleString(undefined, {
                                weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                            })}
                        </div>
                        <div className="flex justify-center items-center gap-4">
                            <div className="text-xl font-black text-slate-800">{match.team_a}</div>
                            <div className="bg-slate-200 text-slate-700 px-3 py-1 rounded-lg font-black text-2xl shadow-inner">
                                {match.score_a !== null ? match.score_a : '-'} : {match.score_b !== null ? match.score_b : '-'}
                            </div>
                            <div className="text-xl font-black text-slate-800">{match.team_b}</div>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors bg-white hover:bg-slate-100 rounded-full p-1"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Body */}
                <div className="overflow-y-auto p-5 bg-white">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Predictor Rankings</h3>
                    
                    {ranklist.length === 0 ? (
                        <div className="text-center text-slate-500 py-8">No predictions found for this match.</div>
                    ) : (
                        <div className="space-y-3">
                            {ranklist.map((item, index) => {
                                const isPerfect = item.points === 5;
                                const isZero = item.points === 0;
                                
                                return (
                                    <div 
                                        key={item.id} 
                                        className={`flex items-center justify-between p-3 rounded-xl border ${
                                            isPerfect ? 'border-emerald-200 bg-emerald-50/50' : 
                                            isZero ? 'border-red-100 bg-red-50/30' : 
                                            'border-slate-100 bg-slate-50'
                                        }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm ${
                                                index === 0 ? 'bg-amber-100 text-amber-700' :
                                                index === 1 ? 'bg-slate-200 text-slate-700' :
                                                index === 2 ? 'bg-orange-100 text-orange-800' :
                                                'bg-white text-slate-400 border border-slate-200'
                                            }`}>
                                                {index + 1}
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-700">{item.display_name}</div>
                                                <div className="text-xs font-medium text-slate-500 mt-0.5">
                                                    Predicted: <span className="font-bold text-slate-700">{item.pred_a} - {item.pred_b}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className={`text-xl font-black ${
                                                isPerfect ? 'text-emerald-600' : 
                                                isZero ? 'text-red-400' : 
                                                'text-indigo-600'
                                            }`}>
                                                +{item.points}
                                            </div>
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">PTS</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
