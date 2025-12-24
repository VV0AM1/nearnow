import { motion } from "framer-motion";

export const RankingCard = ({ neighborhood, rank, type }: { neighborhood: any, rank: number, type: 'safe' | 'danger' }) => {
    const isSafe = type === 'safe';
    const color = isSafe ? 'text-emerald-400' : 'text-red-400';
    const gradient = isSafe ? 'from-emerald-500/10 to-transparent' : 'from-red-500/10 to-transparent';
    const borderColor = isSafe ? 'border-emerald-500/20' : 'border-red-500/20';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: rank * 0.1 }}
            className={`relative p-6 rounded-2xl border ${borderColor} bg-gradient-to-b ${gradient} backdrop-blur-md overflow-hidden group hover:scale-[1.02] transition-transform duration-300`}
        >
            <div className={`absolute top-0 right-0 p-4 text-6xl font-black opacity-5 ${color}`}>
                #{rank}
            </div>

            <div className="relative z-10">
                <div className={`text-xs font-bold uppercase tracking-widest mb-2 ${color}`}>
                    {isSafe ? 'Safest Zone' : 'High Alert Zone'}
                </div>
                <h3 className="text-2xl font-bold text-white mb-1">{neighborhood.name}</h3>
                <div className="flex items-center gap-2 text-zinc-400 text-sm mb-4">
                    <span>{neighborhood.city?.name}</span>
                </div>

                <div className="flex items-center justify-between mt-4">
                    <div>
                        <div className="text-xs text-zinc-500 uppercase">{isSafe ? 'Safety Alerts' : 'Crime Alerts'}</div>
                        <div className={`text-2xl font-bold ${color}`}>{isSafe ? neighborhood.safetyCount : neighborhood.crimeCount}</div>
                    </div>
                    <div>
                        <div className="text-xs text-zinc-500 uppercase">Weekly Alerts</div>
                        <div className="text-2xl font-bold text-white">{neighborhood.alerts}</div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
