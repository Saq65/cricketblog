import { useState, useEffect } from 'react';
import {
  Calendar, Clock, MapPin, Trophy, CheckCircle, 
  AlertCircle, RefreshCw, Filter, Search, ChevronRight
} from 'lucide-react';

function Matches() {
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' or 'completed'
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all', 'T20', 'ODI', 'TEST'

  const getApiKey = () => {
    if (process.env.REACT_APP_CRICKET_API_KEY) {
      return process.env.REACT_APP_CRICKET_API_KEY;
    }
    if (import.meta?.env?.VITE_REACT_APP_CRICKET_API_KEY) {
      return import.meta.env.VITE_REACT_APP_CRICKET_API_KEY;
    }
    return null;
  };

  const fetchMatches = async () => {
    try {
      setLoading(true);
      setError(null);

      const API_KEY = getApiKey();

      if (!API_KEY) {
        setError('Missing API Key! Create .env file with REACT_APP_CRICKET_API_KEY=your-key-here');
        return;
      }

      const response = await fetch(
        `https://api.cricapi.com/v1/currentMatches?apikey=${API_KEY}&offset=0`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.status === 'failure') {
        throw new Error(data.reason || 'API request failed');
      }

      if (!data.data || data.data.length === 0) {
        setMatches([]);
        return;
      }

      setMatches(data.data);
    } catch (err) {
      setError(err.message);
      console.error('API error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, []);

  // Filter matches based on active tab
  const filteredMatches = matches.filter(match => {
    const isUpcoming = !match.matchStarted || 
      (match.status && /upcoming|scheduled|preview/i.test(match.status));
    const isCompleted = match.matchEnded || 
      (match.status && /completed|finished|ended/i.test(match.status));

    // Tab filter
    if (activeTab === 'upcoming' && !isUpcoming) return false;
    if (activeTab === 'completed' && !isCompleted) return false;

    // Match type filter
    if (filterType !== 'all' && match.matchType !== filterType) return false;

    // Search filter
    if (searchTerm && !match.name?.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    return true;
  });

  // Load fake data for testing
  const loadFakeData = () => {
    const fakeMatches = [
      {
        id: 'fake1',
        name: 'India vs Australia - 1st T20',
        matchType: 'T20',
        status: 'Match completed',
        matchStarted: true,
        matchEnded: true,
        dateTimeGMT: new Date(Date.now() - 86400000).toISOString(),
        teams: ['India', 'Australia'],
        teamInfo: [
          { name: 'India', shortname: 'IND' },
          { name: 'Australia', shortname: 'AUS' }
        ],
        score: [
          { r: 185, w: 7, o: 20 },
          { r: 178, w: 9, o: 20 }
        ],
        venue: 'Wankhede Stadium, Mumbai',
        series: 'Australia Tour of India 2025'
      },
      {
        id: 'fake2',
        name: 'England vs Pakistan - 2nd ODI',
        matchType: 'ODI',
        status: 'Scheduled',
        matchStarted: false,
        matchEnded: false,
        dateTimeGMT: new Date(Date.now() + 172800000).toISOString(),
        teams: ['England', 'Pakistan'],
        teamInfo: [
          { name: 'England', shortname: 'ENG' },
          { name: 'Pakistan', shortname: 'PAK' }
        ],
        venue: 'Lord\'s, London',
        series: 'England vs Pakistan ODI Series 2025'
      },
      {
        id: 'fake3',
        name: 'South Africa vs New Zealand - 1st Test',
        matchType: 'TEST',
        status: 'Match completed',
        matchStarted: true,
        matchEnded: true,
        dateTimeGMT: new Date(Date.now() - 259200000).toISOString(),
        teams: ['South Africa', 'New Zealand'],
        teamInfo: [
          { name: 'South Africa', shortname: 'SA' },
          { name: 'New Zealand', shortname: 'NZ' }
        ],
        score: [
          { r: 342, w: 10, o: 98.4 },
          { r: 289, w: 10, o: 87.2 }
        ],
        venue: 'Newlands, Cape Town',
        series: 'New Zealand Tour of South Africa 2025'
      },
      {
        id: 'fake4',
        name: 'West Indies vs Sri Lanka - 3rd T20',
        matchType: 'T20',
        status: 'Scheduled',
        matchStarted: false,
        matchEnded: false,
        dateTimeGMT: new Date(Date.now() + 345600000).toISOString(),
        teams: ['West Indies', 'Sri Lanka'],
        teamInfo: [
          { name: 'West Indies', shortname: 'WI' },
          { name: 'Sri Lanka', shortname: 'SL' }
        ],
        venue: 'Kensington Oval, Barbados',
        series: 'Sri Lanka Tour of West Indies 2025'
      }
    ];
    setMatches(fakeMatches);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0038a8] to-[#e5560c] py-8 px-4 shadow-2xl">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <Trophy className="w-10 h-10 text-white" />
              <div>
                <h1 className="text-4xl font-bold text-white">Cricket Matches</h1>
                <p className="text-white/90 mt-1">Upcoming & Completed Fixtures</p>
              </div>
            </div>
            <button
              onClick={fetchMatches}
              disabled={loading}
              className="bg-white/20 backdrop-blur-sm p-3 rounded-lg hover:bg-white/30 transition-all"
            >
              <RefreshCw className={`w-5 h-5 text-white ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${
              activeTab === 'upcoming'
                ? 'bg-gradient-to-r from-[#0038a8] to-[#0048c8] text-white shadow-lg'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Upcoming Matches
            </div>
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${
              activeTab === 'completed'
                ? 'bg-gradient-to-r from-[#e5560c] to-[#ff6a1c] text-white shadow-lg'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Completed Matches
            </div>
          </button>
        </div>

        {/* Filters */}
        <div className="bg-gray-800 rounded-xl p-4 mb-8 flex flex-wrap gap-4">
          <div className="flex-1 min-w-[250px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search matches..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-900 text-white pl-10 pr-4 py-2 rounded-lg border border-gray-700 focus:border-[#0038a8] focus:outline-none"
              />
            </div>
          </div>
          <div className="flex gap-2">
            {['all', 'T20', 'ODI', 'TEST'].map(type => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  filterType === type
                    ? 'bg-[#0038a8] text-white'
                    : 'bg-gray-900 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {type === 'all' ? 'All Types' : type}
              </button>
            ))}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-8 bg-[#e5560c]/10 border border-[#e5560c] rounded-xl p-6">
            <div className="flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-[#e5560c] mt-1" />
              <div>
                <h3 className="text-[#e5560c] font-bold text-lg mb-2">Error Loading Matches</h3>
                <p className="text-gray-300 mb-4">{error}</p>
                <div className="flex gap-4">
                  <button
                    onClick={fetchMatches}
                    className="bg-[#e5560c] text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-[#d64f0b]"
                  >
                    <RefreshCw className="w-4 h-4" /> Try Again
                  </button>
                  <button
                    onClick={loadFakeData}
                    className="bg-[#0038a8] text-white px-6 py-2 rounded-lg hover:bg-[#002f8f]"
                  >
                    Load Test Data
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#0038a8] mx-auto mb-4"></div>
            <p className="text-white text-xl">Loading matches...</p>
          </div>
        )}

        {/* Matches Grid */}
        {!loading && (
          <>
            {filteredMatches.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-6">
                {filteredMatches.map(match => (
                  <MatchCard key={match.id} match={match} type={activeTab} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">🏏</div>
                <h3 className="text-3xl font-bold text-white mb-2">
                  No {activeTab === 'upcoming' ? 'Upcoming' : 'Completed'} Matches
                </h3>
                <p className="text-gray-400 mb-6">
                  {searchTerm || filterType !== 'all' 
                    ? 'Try adjusting your filters' 
                    : 'Check back later for updates'}
                </p>
                {error && (
                  <button
                    onClick={loadFakeData}
                    className="bg-[#0038a8] text-white px-6 py-3 rounded-lg font-bold hover:bg-[#002f8f]"
                  >
                    Load Test Data
                  </button>
                )}
              </div>
            )}
          </>
        )}

        {/* Stats */}
        {!loading && matches.length > 0 && (
          <div className="mt-8 bg-gray-800 rounded-xl p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-3xl font-bold text-white">{matches.length}</p>
                <p className="text-gray-400 text-sm">Total Matches</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-[#0038a8]">
                  {matches.filter(m => !m.matchStarted).length}
                </p>
                <p className="text-gray-400 text-sm">Upcoming</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-[#e5560c]">
                  {matches.filter(m => m.matchEnded).length}
                </p>
                <p className="text-gray-400 text-sm">Completed</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-red-400">
                  {matches.filter(m => m.matchStarted && !m.matchEnded).length}
                </p>
                <p className="text-gray-400 text-sm">Live Now</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MatchCard({ match, type }) {
  const isCompleted = type === 'completed';

  return (
    <div className={`bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl overflow-hidden shadow-xl border-2 transition-all group ${
      isCompleted ? 'border-gray-700 hover:border-[#e5560c]' : 'border-gray-700 hover:border-[#0038a8]'
    }`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-6 py-4">
        <div className="flex justify-between items-start mb-2">
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
            isCompleted 
              ? 'bg-[#e5560c] text-white' 
              : 'bg-[#0038a8] text-white'
          }`}>
            {match.matchType}
          </span>
          <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
            isCompleted 
              ? 'bg-[#e5560c]/20 text-[#e5560c]' 
              : 'bg-[#0038a8]/20 text-[#0038a8]'
          }`}>
            {isCompleted ? (
              <>
                <CheckCircle className="w-3 h-3" /> Completed
              </>
            ) : (
              <>
                <Calendar className="w-3 h-3" /> Upcoming
              </>
            )}
          </span>
        </div>
        <h3 className={`text-white font-bold text-lg transition-colors ${
          isCompleted ? 'group-hover:text-[#e5560c]' : 'group-hover:text-[#0038a8]'
        }`}>
          {match.name}
        </h3>
        <p className="text-gray-400 text-sm mt-1">{match.series}</p>
      </div>

      {/* Teams */}
      <div className="p-6">
        <div className="space-y-4">
          {[0, 1].map(i => {
            const team = match.teamInfo?.[i] || { name: match.teams?.[i], shortname: match.teams?.[i]?.slice(0, 3) };
            const score = match.score?.[i];
            
            return (
              <div key={i} className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                    i === 0 ? 'bg-[#0038a8]' : 'bg-[#e5560c]'
                  }`}>
                    {team.shortname?.slice(0, 2) || 'T' + (i + 1)}
                  </div>
                  <div>
                    <p className="text-white font-semibold">{team.name || `Team ${i + 1}`}</p>
                    {score && (
                      <p className="text-gray-400 text-xs">{score.o} overs</p>
                    )}
                  </div>
                </div>
                {score ? (
                  <div className="text-right">
                    <p className="text-2xl font-bold text-white">{score.r}/{score.w}</p>
                  </div>
                ) : (
                  <div className="text-gray-500 text-sm">-</div>
                )}
              </div>
            );
          })}
        </div>

        {/* Match Status/Result */}
        {match.status && isCompleted && (
          <div className="mt-4 bg-[#e5560c]/10 border border-[#e5560c]/30 rounded-lg p-3 text-center">
            <p className="text-[#e5560c] font-semibold text-sm">{match.status}</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 pb-4 space-y-2">
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <Calendar className="w-4 h-4" />
          <span>{new Date(match.dateTimeGMT).toLocaleDateString('en-US', { 
            weekday: 'short', 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
          })}</span>
        </div>
        {!isCompleted && (
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <Clock className="w-4 h-4" />
            <span>{new Date(match.dateTimeGMT).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit'
            })}</span>
          </div>
        )}
        {match.venue && (
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <MapPin className="w-4 h-4" />
            <span className="truncate">{match.venue}</span>
          </div>
        )}
        <button className={`w-full mt-2 py-2 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
          isCompleted
            ? 'bg-[#e5560c] text-white hover:bg-[#d64f0b]'
            : 'bg-[#0038a8] text-white hover:bg-[#002f8f]'
        }`}>
          View Details
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default Matches;