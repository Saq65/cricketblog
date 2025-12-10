import { useState, useEffect, useRef } from 'react';
import {
  Radio, Clock, TrendingUp, Calendar, MapPin,
  Wifi, RefreshCw, AlertCircle, MessageSquare,
  ChevronDown, ChevronUp, Timer,
} from 'lucide-react';

function Live() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [liveMatches, setLiveMatches] = useState([]);
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [openCommentary, setOpenCommentary] = useState({});
  const [commentary, setCommentary] = useState({});
  const [blockedUntil, setBlockedUntil] = useState(null);
  const [retryCountdown, setRetryCountdown] = useState(0);

  const commentaryIntervalRef = useRef({});
  const mainIntervalRef = useRef(null);
  const retryTimeoutRef = useRef(null);

  /* ---------------------- Clock ---------------------- */
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  /* ---------------------- Countdown Timer ---------------------- */
  useEffect(() => {
    if (!blockedUntil) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((blockedUntil - now) / 1000));
      setRetryCountdown(remaining);

      if (remaining === 0) {
        console.log('Block expired, clearing states and fetching...');
        clearInterval(interval);
        setBlockedUntil(null);
        setError(null);
        setRetryCountdown(0);
        
        // Force a fetch after a small delay to ensure state updates
        setTimeout(() => {
          fetchLiveMatches();
        }, 100);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [blockedUntil]);

  const getApiKey = () => {
    // Try CRA first (most common)
    if (process.env.REACT_APP_CRICKET_API_KEY) {
      console.log('Using CRA env var');
      return process.env.REACT_APP_CRICKET_API_KEY;
    }
    // Try Vite fallback
    if (import.meta?.env?.VITE_REACT_APP_CRICKET_API_KEY) {
      console.log('Using Vite env var');
      return import.meta.env.VITE_REACT_APP_CRICKET_API_KEY;
    }
    return null;
  };

  const fetchLiveMatches = async () => {
    // Don't fetch if blocked
    if (blockedUntil && Date.now() < blockedUntil) {
      console.log('Still blocked, skipping fetch');
      return;
    }

    try {
      setLoading(true);
      // Clear error before fetching
      if (!blockedUntil) {
        setError(null);
      }

      const API_KEY = getApiKey();

      if (!API_KEY) {
        setError(
          '🔑 Missing API Key!\n\n' +
          'Create .env file in project root:\n' +
          'REACT_APP_CRICKET_API_KEY=your-key-here\n\n' +
          'Then restart: npm start'
        );
        setLoading(false);
        return;
      }

      console.log('Fetching matches...');

      const response = await fetch(
        `https://api.cricapi.com/v1/currentMatches?apikey=${API_KEY}&offset=0`
      );

      const text = await response.text();
      let data;
      
      try { 
        data = JSON.parse(text); 
      } catch { 
        throw new Error(`Invalid JSON from API: ${text.substring(0, 100)}...`); 
      }

      console.log('Raw API Response:', data);

      // Check for blocking message
      if (data.status === 'fail' || data.status === 'failure') {
        const errorMsg = data.reason || data.message || 'Unknown error';
        
        // Detect "Blocked for X minutes" pattern
        const blockMatch = errorMsg.match(/blocked\s+for\s+(\d+)\s+minute/i);
        if (blockMatch) {
          const minutes = parseInt(blockMatch[1], 10);
          const unblockTime = Date.now() + (minutes * 60 * 1000);
          setBlockedUntil(unblockTime);
          
          // Stop all polling
          if (mainIntervalRef.current) {
            clearInterval(mainIntervalRef.current);
            mainIntervalRef.current = null;
          }
          Object.values(commentaryIntervalRef.current).forEach(clearInterval);
          commentaryIntervalRef.current = {};
          
          throw new Error(`⏱️ API Blocked for ${minutes} minutes!\n\nYou've exceeded the rate limit.\nAuto-retry in ${minutes}:00`);
        }
        
        throw new Error(`API Error: ${errorMsg}`);
      }

      // Check for rate limiting
      if (response.status === 429) {
        const unblockTime = Date.now() + (15 * 60 * 1000); // Default 15 min
        setBlockedUntil(unblockTime);
        
        if (mainIntervalRef.current) {
          clearInterval(mainIntervalRef.current);
          mainIntervalRef.current = null;
        }
        
        throw new Error('⏱️ Rate limit exceeded!\n\nAPI quota exhausted.\nAuto-retry in 15:00');
      }

      // Check for authentication errors
      if (response.status === 401 || response.status === 403) {
        throw new Error('🔒 Invalid API key! Please check your .env file and ensure the key is correct.');
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      if (!data.data || data.data.length === 0) {
        setLiveMatches([]);
        setUpcomingMatches([]);
        setLastUpdated(new Date());
        console.log('No matches available right now');
        return;
      }

      const now = new Date();
      const live = data.data.filter(m =>
        (m.matchStarted && !m.matchEnded) ||
        (m.status && /live|in progress|playing/i.test(m.status))
      );
      const upcoming = data.data.filter(m =>
        !m.matchStarted ||
        (m.status && /upcoming|scheduled|preview/i.test(m.status)) ||
        new Date(m.dateTimeGMT) > now
      ).filter(m => !live.find(l => l.id === m.id));

      console.log(`Found ${live.length} live matches, ${upcoming.length} upcoming`);

      setLiveMatches(live);
      setUpcomingMatches(upcoming);
      setLastUpdated(new Date());

      // Clean up commentary for matches that ended
      Object.keys(commentaryIntervalRef.current).forEach(id => {
        if (!live.find(m => m.id === id)) {
          clearInterval(commentaryIntervalRef.current[id]);
          delete commentaryIntervalRef.current[id];
          setCommentary(p => { const u = { ...p }; delete u[id]; return u; });
        }
      });

      // Restart main polling if it was stopped
      if (!mainIntervalRef.current) {
        mainIntervalRef.current = setInterval(fetchLiveMatches, 300000); // 5 minutes
      }

    } catch (err) {
      setError(err.message);
      console.error('API error:', err);
      
      // Don't retry if blocked or auth error
      if (!/blocked|Rate limit|Invalid API key/i.test(err.message)) {
        setTimeout(fetchLiveMatches, 10000); // Retry after 10 seconds for other errors
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchCommentary = async (matchId) => {
    if (blockedUntil && Date.now() < blockedUntil) return;

    try {
      const API_KEY = getApiKey();
      if (!API_KEY) return;

      const res = await fetch(
        `https://api.cricapi.com/v1/matchCommentary?apikey=${API_KEY}&id=${matchId}`
      );
      
      if (res.status === 429) {
        console.warn('Rate limited on commentary fetch');
        return;
      }
      
      if (!res.ok) return;
      
      const d = await res.json();
      if (d.data?.commentary) {
        setCommentary(p => ({ ...p, [matchId]: d.data.commentary.slice(0, 20) }));
      }
    } catch (e) {
      console.warn('Commentary error:', e);
    }
  };

  const startCommentaryPolling = (id) => {
    if (commentaryIntervalRef.current[id]) return;
    if (blockedUntil && Date.now() < blockedUntil) return;
    
    fetchCommentary(id);
    commentaryIntervalRef.current[id] = setInterval(() => fetchCommentary(id), 120000); // 2 minutes to reduce API calls
  };

  const stopCommentaryPolling = (id) => {
    clearInterval(commentaryIntervalRef.current[id]);
    delete commentaryIntervalRef.current[id];
  };

  const toggleCommentary = (id) => {
    if (blockedUntil && Date.now() < blockedUntil) {
      setError('⏱️ Cannot fetch commentary while blocked. Wait for countdown to finish.');
      return;
    }
    
    setOpenCommentary(p => {
      const open = !p[id];
      open ? startCommentaryPolling(id) : stopCommentaryPolling(id);
      if (!open) setCommentary(prev => { const u = { ...prev }; delete u[id]; return u; });
      return { ...p, [id]: open };
    });
  };

  useEffect(() => {
    fetchLiveMatches();
    mainIntervalRef.current = setInterval(fetchLiveMatches, 300000); // 5 minutes

    const intervals = commentaryIntervalRef.current;

    return () => {
      if (mainIntervalRef.current) clearInterval(mainIntervalRef.current);
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
      Object.values(intervals).forEach(clearInterval);
    };
  }, []); 

  const handleRefresh = () => {
    if (blockedUntil && Date.now() < blockedUntil) {
      const mins = Math.floor(retryCountdown / 60);
      const secs = retryCountdown % 60;
      setError(`⏱️ Still blocked! Wait ${mins}:${secs.toString().padStart(2, '0')} before retrying.`);
      return;
    }
    fetchLiveMatches();
  };

  const formatCountdown = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 py-8 px-4 shadow-2xl">
        <div className="max-w-7xl mx-auto flex justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 animate-ping bg-red-400 rounded-full opacity-75"></div>
              <Radio className="w-10 h-10 text-white relative z-10" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">Live Cricket Matches</h1>
              <p className="text-red-100 mt-1">Real-time scores + commentary</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
              <Clock className="w-5 h-5 text-white" />
              <span className="text-white font-semibold">
                {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
            <button 
              onClick={handleRefresh} 
              disabled={blockedUntil && Date.now() < blockedUntil}
              className={`backdrop-blur-sm p-3 rounded-lg ${
                blockedUntil && Date.now() < blockedUntil 
                  ? 'bg-gray-500/50 cursor-not-allowed' 
                  : 'bg-white/20 hover:bg-white/30'
              }`}
              title={blockedUntil && Date.now() < blockedUntil ? 'Blocked by API' : 'Refresh now'}
            >
              <RefreshCw className={`w-5 h-5 text-white ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Countdown Banner */}
        {blockedUntil && Date.now() < blockedUntil && (
          <div className="mb-6 bg-yellow-900/40 border-2 border-yellow-600 rounded-xl p-6 text-center">
            <div className="flex items-center justify-center gap-3 mb-2">
              <Timer className="w-8 h-8 text-yellow-400 animate-pulse" />
              <h3 className="text-2xl font-bold text-yellow-400">API Blocked - Auto-retry Active</h3>
            </div>
            <div className="text-5xl font-mono font-bold text-white mb-2">
              {formatCountdown(retryCountdown)}
            </div>
            <p className="text-yellow-300 text-sm">
              The API has rate-limited your requests. The app will automatically retry when the block expires.
            </p>
          </div>
        )}

        {lastUpdated && !(blockedUntil && Date.now() < blockedUntil) && (
          <div className="mb-6 text-center text-sm text-gray-400">
            Last updated: {lastUpdated.toLocaleTimeString()} • <span className="text-green-400">Auto-refresh: 5 min</span>
          </div>
        )}

        {error && (
          <div className="mb-8 bg-red-900/30 border border-red-600 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-red-500 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-red-400 font-bold text-lg mb-2">API Error</h3>
                <pre className="text-gray-300 mb-4 bg-gray-800 p-3 rounded text-sm overflow-auto whitespace-pre-wrap">{error}</pre>
                {!(blockedUntil && Date.now() < blockedUntil) && (
                  <button onClick={handleRefresh} className="bg-red-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-red-700">
                    <RefreshCw className="w-4 h-4" /> Try Again
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* DEBUG FAKE MATCH BUTTON */}
        <button
          onClick={() => {
            const fake = [{
              id: 'debug1',
              name: 'India vs Australia - 1st T20',
              matchType: 'T20',
              status: 'IND 45/1 (5.2 ov) - Kohli 25* (18), Rohit 18 (15)',
              matchStarted: true,
              matchEnded: false,
              dateTimeGMT: new Date().toISOString(),
              teams: ['India', 'Australia'],
              teamInfo: [{ name: 'India', shortname: 'IND' }, { name: 'Australia', shortname: 'AUS' }],
              score: [{ r: 45, w: 1, o: 5.2 }, { r: 0, w: 0, o: 0 }],
              venue: 'MCG, Melbourne',
              series: 'Border-Gavaskar Trophy 2025'
            }];
            setLiveMatches(fake);
            setError(null);
            setBlockedUntil(null);
            setRetryCountdown(0);
            console.log('Loaded fake match for testing');
          }}
          className="fixed bottom-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg z-50 font-bold shadow-lg hover:bg-green-700"
        >
          🏏 Load Test Match
        </button>

        {/* LOADING */}
        {loading && liveMatches.length === 0 && !error && (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-red-600 mx-auto mb-4"></div>
            <p className="text-white text-xl">Fetching live matches...</p>
          </div>
        )}

        {/* LIVE MATCHES */}
        {liveMatches.length > 0 && (
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <div className="flex items-center gap-2 bg-red-600 px-4 py-2 rounded-full">
                <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                <span className="text-white font-bold uppercase text-sm">Live Now</span>
              </div>
              <h2 className="text-3xl font-bold text-white">Active Matches ({liveMatches.length})</h2>
            </div>

            <div className="grid grid-cols-1 gap-8">
              {liveMatches.map(match => {
                const isOpen = openCommentary[match.id];
                const comments = commentary[match.id] || [];
                return (
                  <div key={match.id} className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl overflow-hidden shadow-2xl border border-gray-700 hover:border-red-600 transition-all">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-6 py-4 flex justify-between flex-wrap gap-4">
                      <div className="flex items-center gap-4">
                        <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center gap-2">
                          <Wifi className="w-4 h-4 animate-pulse" /> LIVE
                        </span>
                        <div>
                          <h3 className="text-white font-bold text-lg">{match.name}</h3>
                          <p className="text-gray-400 text-sm">{match.matchType} • {match.series || 'Tournament'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-gray-300">
                        <Calendar className="w-5 h-5" />
                        <span>{new Date(match.dateTimeGMT).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Scoreboard */}
                    <div className="p-6 grid md:grid-cols-2 gap-6">
                      {[0, 1].map(i => (
                        <div key={i} className="flex justify-between p-4 bg-gray-900/50 rounded-xl">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl ${
                              i === 0 ? 'bg-gradient-to-br from-blue-600 to-blue-700' : 'bg-gradient-to-br from-green-600 to-green-700'
                            }`}>
                              {match.teamInfo?.[i]?.shortname?.slice(0, 2) || match.teams?.[i]?.slice(0, 2) || 'T' + (i + 1)}
                            </div>
                            <div>
                              <h4 className="text-white font-bold text-xl">{match.teamInfo?.[i]?.name || match.teams?.[i] || 'Team ' + (i + 1)}</h4>
                              <p className="text-gray-400 text-sm">{match.teamInfo?.[i]?.shortname || 'T' + (i + 1)}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-3xl font-bold text-white">{match.score?.[i]?.r ?? '0'}/{match.score?.[i]?.w ?? '0'}</div>
                            <div className="text-gray-400 text-sm">({match.score?.[i]?.o ?? '0.0'} overs)</div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Status */}
                    {match.status && (
                      <div className="px-6 pb-4">
                        <div className="bg-gradient-to-r from-red-600/20 to-orange-600/20 border border-red-600/30 rounded-lg p-4 text-center">
                          <p className="text-red-400 font-semibold flex items-center justify-center gap-2">
                            <TrendingUp className="w-5 h-5" /> {match.status}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Commentary Toggle */}
                    <div className="px-6 pb-4">
                      <button
                        onClick={() => toggleCommentary(match.id)}
                        disabled={blockedUntil && Date.now() < blockedUntil}
                        className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                          blockedUntil && Date.now() < blockedUntil
                            ? 'bg-gray-600 cursor-not-allowed text-gray-400'
                            : 'bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800'
                        }`}
                      >
                        <MessageSquare className="w-5 h-5" />
                        {isOpen ? 'Hide' : 'Watch'} Live Commentary
                        {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </button>
                    </div>

                    {/* Commentary */}
                    {isOpen && (
                      <div className="border-t border-gray-700 bg-gray-900/50">
                        <div className="px-6 py-3 flex items-center justify-between text-white font-semibold">
                          <div className="flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-yellow-400" /> Live Commentary
                          </div>
                          {comments.length > 0 && <span className="text-xs text-green-400 animate-pulse">● Live</span>}
                        </div>
                        <div className="max-h-64 overflow-y-auto px-6 pb-4 space-y-2">
                          {comments.length > 0 ? comments.map((c, i) => (
                            <div key={i} className="text-sm bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                              <div className="flex items-start gap-2">
                                <div className="w-8 h-8 bg-yellow-600 rounded-full flex items-center justify-center text-xs font-bold text-black flex-shrink-0">{c.over || '?'}</div>
                                <div>
                                  <p className="font-medium text-white">{c.event || 'Ball'}</p>
                                  <p className="text-xs text-gray-400 mt-1">{c.commentary || ''}</p>
                                </div>
                              </div>
                            </div>
                          )) : (
                            <p className="text-center text-gray-500 py-6 text-sm">Loading commentary...</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* NO MATCHES */}
        {!loading && liveMatches.length === 0 && !error && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🏏</div>
            <h3 className="text-3xl font-bold text-white mb-2">No Live Matches</h3>
            <p className="text-gray-400">Check back during match hours!</p>
          </div>
        )}

        {/* UPCOMING */}
        {upcomingMatches.length > 0 && (
          <div>
            <div className="flex items-center gap-3 mb-8">
              <Calendar className="w-8 h-8 text-blue-500" />
              <h2 className="text-3xl font-bold text-white">Upcoming ({upcomingMatches.length})</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {upcomingMatches.slice(0, 6).map(m => (
                <div key={m.id} className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700 hover:border-blue-600 transition-all">
                  <div className="flex justify-between mb-4">
                    <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                      {new Date(m.dateTimeGMT).toLocaleDateString()}
                    </span>
                    <span className="text-gray-400 text-sm">{m.matchType}</span>
                  </div>
                  <h3 className="text-white font-bold text-lg mb-2">{m.name}</h3>
                  <p className="text-gray-400 text-sm mb-4">{m.series}</p>
                  <div className="flex justify-between text-white mb-4">
                    <span>{m.teams?.[0]}</span>
                    <span className="text-gray-500">VS</span>
                    <span>{m.teams?.[1]}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-400">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {new Date(m.dateTimeGMT).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    {m.venue && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span className="truncate max-w-[180px]">{m.venue}</span>
                      </div>
                    )}
                  </div>
                  <button className="w-full mt-4 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                    Set Reminder
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes ping { 75%, 100% { transform: scale(2); opacity: 0; } }
        .animate-ping { animation: ping 1s cubic-bezier(0,0,0.2,1) infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        .animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
      `}</style>
    </div>
  );
}

export default Live;