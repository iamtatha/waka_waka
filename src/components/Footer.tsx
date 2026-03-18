import { Instagram, Twitter, Linkedin, Globe } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="mt-20 py-12 px-6 border-t border-slate-100 bg-white">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-12 text-center md:text-left">
                <div className="space-y-4">
                    <h3 className="text-lg md:text-xl font-bold text-slate-800 font-outfit">Prediction Rules</h3>
                    <ul className="space-y-2 text-[13px] md:text-sm text-slate-600 inline-block text-left md:block">
                        <li className="flex gap-2">
                            <span className="font-bold text-indigo-600">5 pts:</span> Exact correct score prediction
                        </li>
                        <li className="flex gap-2">
                            <span className="font-bold text-indigo-600">3 pts:</span> Correct winner + GD
                        </li>
                        <li className="flex gap-2">
                            <span className="font-bold text-indigo-600">2 pts:</span> Correct winner only
                        </li>
                        <li className="flex gap-2">
                            <span className="font-bold text-indigo-600">1 pt:</span> Correct total goals
                        </li>
                        <li className="pt-2 text-[10px] md:text-xs italic text-slate-400 border-t border-slate-50">
                            * Predictions must be before kickoff. Latest submission counts.
                        </li>
                    </ul>
                </div>
                <div className="flex flex-col justify-between items-center md:items-end md:text-right gap-8">
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <h3 className="text-xl md:text-2xl font-black text-slate-900 font-outfit tracking-tighter">Waka Waka Predictor</h3>
                            <p className="text-xs md:text-sm text-slate-500 font-medium tracking-tight">FIFA World Cup 2026 Prediction Contest</p>
                        </div>
                        <div className="flex gap-4 justify-center md:justify-end text-slate-400">
                            <a href="https://www.instagram.com/epistemophilic_nerd" target='_blank' className="hover:text-indigo-600 transition-colors"><Instagram size={20} /></a>
                            <a href="https://twitter.com/i_am_tatha" target='_blank' className="hover:text-indigo-600 transition-colors"><Twitter size={20} /></a>
                            <a href="https://www.linkedin.com/in/tathagata-dey-580245172/" target='_blank' className="hover:text-indigo-600 transition-colors"><Linkedin size={20} /></a>
                            <a href="https://iamtatha.github.io/" target='_blank' className="hover:text-indigo-600 transition-colors"><Globe size={20} /></a>
                        </div>
                    </div>
                    <div className="text-[11px] md:text-sm text-slate-400 font-medium">
                        Designed & Built by <span className="font-bold text-slate-900 border-b-2 border-indigo-500/30">Tathagata</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
