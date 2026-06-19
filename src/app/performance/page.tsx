'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Profile, Prediction, Match } from '@/types/database';
import SelfMetrics from '@/components/performance/SelfMetrics';
import GlobalComparison from '@/components/performance/GlobalComparison';
import HeadToHead from '@/components/performance/HeadToHead';

export default function PerformancePage() {
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'self' | 'global' | 'h2h'>('self');

    const [currentUser, setCurrentUser] = useState<Profile | null>(null);
    const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
    const [allPredictions, setAllPredictions] = useState<Prediction[]>([]);
    const [finishedMatches, setFinishedMatches] = useState<Match[]>([]);

    useEffect(() => {
        async function fetchPerformanceData() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setLoading(false);
                return;
            }

            // Fetch profiles
            const { data: profilesData } = await supabase
                .from('profiles')
                .select('*')
                .or('is_disabled.eq.false,is_disabled.is.null');

            if (profilesData) {
                setAllProfiles(profilesData);
                const current = profilesData.find(p => p.id === user.id);
                if (current) setCurrentUser(current);
            }

            // Fetch finished matches
            const { data: matchesData } = await supabase
                .from('matches')
                .select('*')
                .eq('status', 'finished');
            
            if (matchesData) {
                setFinishedMatches(matchesData);
            }

            // Fetch all predictions
            // Note: For a very large app, fetching all predictions might not be scalable.
            // But for a small group/app, this is fine and allows dynamic client-side stats.
            const { data: predictionsData } = await supabase
                .from('predictions')
                .select('*');
            
            if (predictionsData) {
                setAllPredictions(predictionsData);
            }

            setLoading(false);
        }

        fetchPerformanceData();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    if (!currentUser) {
        return (
            <div className="max-w-4xl mx-auto text-center py-20 px-4">
                <h2 className="text-2xl font-bold text-slate-800 mb-4">Please log in</h2>
                <p className="text-slate-500">You need to be logged in to view your performance.</p>
            </div>
        );
    }

    const currentUserPredictions = allPredictions.filter(p => p.user_id === currentUser.id);

    return (
        <div className="max-w-4xl mx-auto space-y-6 md:space-y-8 px-2 md:px-0 mb-20">
            <div className="text-center">
                <h1 className="text-3xl md:text-4xl font-bold gradient-text">Your Performance</h1>
                <p className="text-sm md:text-base text-slate-500 mt-2">Deep dive into your prediction stats and compare with others.</p>
            </div>

            {/* Tabs */}
            <div className="flex justify-center mb-8">
                <div className="inline-flex bg-slate-100 p-1 rounded-xl">
                    <button
                        onClick={() => setActiveTab('self')}
                        className={`px-4 py-2 md:px-6 md:py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'self' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        My Stats
                    </button>
                    <button
                        onClick={() => setActiveTab('global')}
                        className={`px-4 py-2 md:px-6 md:py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'global' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Global
                    </button>
                    <button
                        onClick={() => setActiveTab('h2h')}
                        className={`px-4 py-2 md:px-6 md:py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'h2h' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Head to Head
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="transition-all duration-300">
                {activeTab === 'self' && (
                    <SelfMetrics 
                        profile={currentUser}
                        predictions={currentUserPredictions}
                        finishedMatches={finishedMatches}
                    />
                )}
                {activeTab === 'global' && (
                    <GlobalComparison 
                        profile={currentUser}
                        predictions={currentUserPredictions}
                        allProfiles={allProfiles}
                        allPredictions={allPredictions}
                        finishedMatches={finishedMatches}
                    />
                )}
                {activeTab === 'h2h' && (
                    <HeadToHead 
                        profile={currentUser}
                        predictions={currentUserPredictions}
                        allProfiles={allProfiles}
                        allPredictions={allPredictions}
                        finishedMatches={finishedMatches}
                    />
                )}
            </div>
        </div>
    );
}
