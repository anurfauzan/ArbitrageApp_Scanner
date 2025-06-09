import React, { useState, useEffect, useMemo } from 'react';
import { Search, Coins, ArrowRight, TrendingUp, AlertTriangle } from 'lucide-react';

const isDEX = (exchangeName) => {
    const dexKeywords = ['uniswap', 'pancakeswap', 'sushiswap', 'quickswap', 'trader joe', 'raydium', 'serum', 'curve'];
    const lowerCaseName = exchangeName.toLowerCase();
    return dexKeywords.some(keyword => lowerCaseName.includes(keyword));
};

const Spinner = () => (
    <div className="flex flex-col items-center justify-center space-y-2">
        <svg className="animate-spin h-8 w-8 text-cyan-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="text-cyan-300">Mencari data harga di berbagai bursa...</p>
    </div>
);

export default function App() {
    const [searchTerm, setSearchTerm] = useState('');
    const [tokenId, setTokenId] = useState('');
    const [tickers, setTickers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchTerm) {
            setError('Silakan masukkan nama atau simbol token.');
            return;
        }
        
        setLoading(true);
        setError(null);
        setTickers([]);
        setTokenId('');

        try {
            const searchResponse = await fetch(`https://api.coingecko.com/api/v3/search?query=${searchTerm}`);
            if (!searchResponse.ok) throw new Error('Gagal mencari token. Coba lagi.');
            const searchData = await searchResponse.json();

            if (!searchData.coins || searchData.coins.length === 0) {
                throw new Error(`Token "${searchTerm}" tidak ditemukan.`);
            }
            const foundTokenId = searchData.coins[0].id;
            setTokenId(searchData.coins[0].name);

            const tickersResponse = await fetch(`https://api.coingecko.com/api/v3/coins/${foundTokenId}/tickers?include_exchange_logo=true&depth=true`);
            if (!tickersResponse.ok) throw new Error('Gagal mengambil data harga dari bursa.');
            const tickersData = await tickersResponse.json();
            
            setTickers(tickersData.tickers || []);

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const arbitrageOpportunity = useMemo(() => {
        if (tickers.length < 2) return null;

        const validTickers = tickers.filter(t => t.converted_last && t.converted_last.usd > 0);
        if (validTickers.length < 2) return null;

        const lowest = validTickers.reduce((prev, curr) => (prev.converted_last.usd < curr.converted_last.usd ? prev : curr));
        const highest = validTickers.reduce((prev, curr) => (prev.converted_last.usd > curr.converted_last.usd ? prev : curr));
        
        if (lowest.market.name === highest.market.name && lowest.target === highest.target) return null;

        const lowPrice = lowest.converted_last.usd;
        const highPrice = highest.converted_last.usd;
        const percentage = ((highPrice - lowPrice) / lowPrice) * 100;

        if (percentage < 0.1) return null;

        return {
            buy: {
                exchange: lowest.market.name,
                logo: lowest.market.logo,
                pair: `${lowest.base}/${lowest.target}`,
                price: lowPrice
            },
            sell: {
                exchange: highest.market.name,
                logo: highest.market.logo,
                pair: `${highest.base}/${highest.target}`,
                price: highPrice
            },
            percentage: percentage.toFixed(2)
        };
    }, [tickers]);

    const formatPrice = (price) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 6
        }).format(price);
    };

    return (
        <div className="bg-gray-900 text-gray-200 min-h-screen font-sans p-4 sm:p-6 lg:p-8">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center gap-3 mb-2">
                        <Coins className="w-10 h-10 text-cyan-400" />
                        <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">Crypto Arbitrage Scanner</h1>
                    </div>
                    <p className="text-gray-400 text-md">Temukan perbedaan harga token di berbagai bursa CEX & DEX.</p>
                </div>

                <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2 mb-8">
                    <div className="relative flex-grow">
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Contoh: Bitcoin, ETH, atau UNI..."
                            className="w-full pl-10 pr-4 py-3 bg-gray-800 border-2 border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
                        />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    </div>
                    <button type="submit" disabled={loading} className="flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-6 rounded-lg transition-all disabled:bg-gray-600 disabled:cursor-not-allowed">
                        {loading ? 'Mencari...' : 'Cari Peluang'}
                    </button>
                </form>

                <div className="space-y-6">
                    {loading && <Spinner />}
                    
                    {error && (
                        <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg flex items-center gap-3">
                           <AlertTriangle className="w-6 h-6"/>
                           <span>{error}</span>
                        </div>
                    )}
                    
                    {arbitrageOpportunity && !loading && (
                        <div className="bg-gray-800 border border-cyan-500/50 rounded-xl shadow-lg shadow-cyan-900/20 p-6 animate-fade-in">
                            <div className="flex items-center gap-2 mb-4">
                               <TrendingUp className="w-6 h-6 text-green-400" />
                               <h2 className="text-2xl font-bold text-white">Peluang Arbitrase untuk {tokenId}</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4 text-center">
                                <div className="bg-gray-900 p-4 rounded-lg">
                                    <p className="text-sm font-semibold text-green-400 mb-2">BELI DI (HARGA TERENDAH)</p>
                                    <div className="flex items-center justify-center gap-2 mb-2">
                                        <img src={arbitrageOpportunity.buy.logo} alt={arbitrageOpportunity.buy.exchange} className="w-6 h-6 rounded-full bg-white" onError={(e) => { e.target.style.display = 'none' }} />
                                        <span className="font-bold text-lg">{arbitrageOpportunity.buy.exchange}</span>
                                    </div>
                                    <p className="text-xl font-mono font-bold text-white">{formatPrice(arbitrageOpportunity.buy.price)}</p>
                                    <p className="text-xs text-gray-400">{arbitrageOpportunity.buy.pair}</p>
                                </div>
                                
                                <ArrowRight className="w-8 h-8 text-cyan-400 mx-auto hidden md:block" />

                                <div className="bg-gray-900 p-4 rounded-lg">
                                    <p className="text-sm font-semibold text-red-400 mb-2">JUAL DI (HARGA TERTINGGI)</p>
                                    <div className="flex items-center justify-center gap-2 mb-2">
                                        <img src={arbitrageOpportunity.sell.logo} alt={arbitrageOpportunity.sell.exchange} className="w-6 h-6 rounded-full bg-white" onError={(e) => { e.target.style.display = 'none' }} />
                                        <span className="font-bold text-lg">{arbitrageOpportunity.sell.exchange}</span>
                                    </div>
                                    <p className="text-xl font-mono font-bold text-white">{formatPrice(arbitrageOpportunity.sell.price)}</p>
                                    <p className="text-xs text-gray-400">{arbitrageOpportunity.sell.pair}</p>
                                </div>
                            </div>
                            <div className="mt-6 text-center">
                                <p className="text-lg text-gray-300">Potensi Keuntungan</p>
                                <p className="text-3xl font-bold text-green-400">
                                    +{arbitrageOpportunity.percentage}%
                                </p>
                                <p className="text-xs text-gray-500 mt-1">(Belum termasuk biaya trading dan gas fee)</p>
                            </div>
                        </div>
                    )}

                    {tickers.length > 0 && !loading && (
                         <div className="bg-gray-800/50 rounded-lg p-1 sm:p-2">
                            <h3 className="text-xl font-bold text-white p-4">Daftar Harga Lengkap untuk {tokenId}</h3>
                             <div className="overflow-x-auto">
                                <table className="w-full min-w-max">
                                    <thead className="border-b border-gray-700">
                                        <tr>
                                            <th className="text-left p-3 font-semibold text-gray-400">Bursa</th>
                                            <th className="text-left p-3 font-semibold text-gray-400">Pair</th>
                                            <th className="text-right p-3 font-semibold text-gray-400">Harga (USD)</th>
                                            <th className="text-center p-3 font-semibold text-gray-400">Tipe</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {tickers.map((ticker, index) => {
                                            const isLowest = arbitrageOpportunity && ticker.market.name === arbitrageOpportunity.buy.exchange && ticker.converted_last.usd === arbitrageOpportunity.buy.price;
                                            const isHighest = arbitrageOpportunity && ticker.market.name === arbitrageOpportunity.sell.exchange && ticker.converted_last.usd === arbitrageOpportunity.sell.price;
                                            
                                            return (
                                                <tr key={index} className={`border-t border-gray-700/50 hover:bg-gray-700/50 transition-colors
                                                    ${isLowest ? 'bg-green-900/30' : ''}
                                                    ${isHighest ? 'bg-red-900/30' : ''}
                                                `}>
                                                    <td className="p-3 flex items-center gap-2">
                                                        <img src={ticker.market.logo} alt={ticker.market.name} className="w-5 h-5 rounded-full bg-white" onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/20x20/FFFFFF/000000?text=?'; }}/>
                                                        <span className="font-medium">{ticker.market.name}</span>
                                                    </td>
                                                    <td className="p-3 font-mono text-gray-400">{ticker.base}/{ticker.target}</td>
                                                    <td className={`p-3 text-right font-mono font-bold ${isLowest ? 'text-green-400' : isHighest ? 'text-red-400' : 'text-white'}`}>
                                                        {formatPrice(ticker.converted_last.usd)}
                                                    </td>
                                                    <td className="p-3 text-center">
                                                         <span className={`px-2 py-1 text-xs font-bold rounded-full ${isDEX(ticker.market.name) ? 'bg-blue-900 text-blue-300' : 'bg-yellow-900 text-yellow-300'}`}>
                                                            {isDEX(ticker.market.name) ? 'DEX' : 'CEX'}
                                                         </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                         </div>
                    )}
                </div>
                 <footer className="text-center mt-12 text-gray-600 text-sm">
                    <p>Data harga disediakan oleh CoinGecko. Selalu lakukan riset Anda sendiri (DYOR).</p>
                    <p>Peluang arbitrase tidak memperhitungkan biaya slip, gas fee, atau waktu transaksi.</p>
                </footer>
            </div>
            </div>
            );
        }

