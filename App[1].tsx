import React, { useState, useEffect, useMemo } from 'react';
import { MapPin, Calendar, Clock, BookOpen, Star, Trash2, Download, Cloud, BrainCircuit, Wind, Thermometer, Droplets, Info, LocateFixed, Bell, Crosshair, Palette, BarChart3, TrendingUp, FileText } from 'lucide-react';
import { THRACE_CITIES, CLARITY_SCALE, COMMON_DEEP_SKY_OBJECTS, SKY_THEMES } from './constants';
import { Observation, CelestialBody, WeatherData, MoonData, ConstellationState, City } from './types';
import SkyMap from './components/SkyMap';
import { getSkyAnalysis, analyzeObservationNotes } from './services/geminiService';
import { calculateCelestialBodies, getMoonPhaseData, calculateConstellations, checkSkyEvents } from './services/astronomyService';
import { getRealWeather } from './services/weatherService';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } from "docx";
import saveAs from "file-saver";

const App: React.FC = () => {
  // --- State ---
  const [activeTab, setActiveTab] = useState<'map' | 'log' | 'history' | 'stats' | 'help'>('map');
  const [currentDate, setCurrentDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [currentTime, setCurrentTime] = useState<string>(new Date().toTimeString().slice(0, 5));
  
  // Location State
  const [availableCities, setAvailableCities] = useState<City[]>(THRACE_CITIES);
  const [selectedCityIndex, setSelectedCityIndex] = useState<number>(0);
  const [isLocating, setIsLocating] = useState(false);
  
  // Real Data State
  const [celestialBodies, setCelestialBodies] = useState<CelestialBody[]>([]);
  const [constellations, setConstellations] = useState<ConstellationState[]>([]);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [moonData, setMoonData] = useState<MoonData | null>(null);
  const [skyEvents, setSkyEvents] = useState<string[]>([]);

  // Tracking State
  const [trackedBodyName, setTrackedBodyName] = useState<string | null>(null);
  
  // Theme State
  const [currentThemeId, setCurrentThemeId] = useState<string>('dark');

  // Observation Form State
  const [obsForm, setObsForm] = useState<Partial<Observation>>({
    date: new Date().toISOString().slice(0, 10),
    time: new Date().toTimeString().slice(0, 5),
    weather: 'Açık',
    skyClarity: '3',
    objects: '',
    notes: ''
  });

  const [observations, setObservations] = useState<Observation[]>(() => {
    const saved = localStorage.getItem('thrace_observations');
    return saved ? JSON.parse(saved) : [];
  });

  const [aiLoading, setAiLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);

  // --- Effects ---
  useEffect(() => {
    localStorage.setItem('thrace_observations', JSON.stringify(observations));
  }, [observations]);

  // Main Calculation Effect with 5-minute Auto-Refresh
  useEffect(() => {
    const fetchSkyData = async () => {
      const city = availableCities[selectedCityIndex] || availableCities[0];
      const dt = new Date(`${currentDate}T${currentTime}`);

      // 1. Astronomy Calculations
      const bodies = calculateCelestialBodies(dt, city.latitude, city.longitude);
      setCelestialBodies(bodies);

      const consts = calculateConstellations(dt, city.latitude, city.longitude);
      setConstellations(consts);

      const mData = getMoonPhaseData(dt);
      setMoonData(mData);
      
      const events = checkSkyEvents(dt, city.latitude, city.longitude);
      setSkyEvents(events);

      // 2. Weather API
      // Fetches fresh data based on the selected location and time
      const wData = await getRealWeather(city.latitude, city.longitude, currentDate, currentTime);
      setWeatherData(wData);
    };

    // Initial fetch immediately when dependencies change
    fetchSkyData();

    // Set up a 5-minute (300,000ms) interval to refresh data
    const intervalId = setInterval(fetchSkyData, 300000);

    return () => clearInterval(intervalId);

  }, [currentDate, currentTime, selectedCityIndex, availableCities]);

  // Update form weather when API data changes
  useEffect(() => {
    if (weatherData) {
      setObsForm(prev => ({
        ...prev,
        weather: weatherData.conditionText
      }));
    }
  }, [weatherData]);

  // --- Helpers ---
  const currentCity = availableCities[selectedCityIndex] || availableCities[0];
  const trackedBody = trackedBodyName ? celestialBodies.find(b => b.name === trackedBodyName) || null : null;
  const currentTheme = SKY_THEMES[currentThemeId];
  
  // Combine all possible celestial objects for autocomplete
  const suggestionOptions = useMemo(() => {
    const dynamicBodies = celestialBodies.map(b => b.name);
    const dynamicConstellations = constellations.map(c => c.name);
    // Use Set to remove duplicates
    return Array.from(new Set([
      ...dynamicBodies,
      ...dynamicConstellations,
      ...COMMON_DEEP_SKY_OBJECTS
    ])).sort();
  }, [celestialBodies, constellations]);

  // Statistics Calculation
  const stats = useMemo(() => {
    if (observations.length === 0) return null;

    const totalObs = observations.length;
    
    // Average Clarity
    const totalClarity = observations.reduce((acc, curr) => acc + (Number(curr.skyClarity) || 0), 0);
    const avgClarity = (totalClarity / totalObs).toFixed(1);

    // Most Frequent Object
    const counts: Record<string, number> = {};
    observations.forEach(obs => {
      // Split comma separated values and count individual objects
      const items = obs.objects.split(/[,\n]/).map(s => s.trim()).filter(Boolean);
      items.forEach(item => {
        const key = item.toLowerCase();
        counts[key] = (counts[key] || 0) + 1;
      });
    });

    let mostFrequent = '-';
    let maxCount = 0;
    
    Object.entries(counts).forEach(([key, count]) => {
        if (count > maxCount) {
            maxCount = count;
            // Capitalize first letter for display
            mostFrequent = key.charAt(0).toUpperCase() + key.slice(1);
        }
    });

    return {
        totalObs,
        avgClarity,
        mostFrequent,
        freqCount: maxCount
    };
  }, [observations]);

  const handleGeolocation = () => {
    if (!navigator.geolocation) {
      alert("Tarayıcınız konum servisini desteklemiyor.");
      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newCity: City = {
          name: `Konumum (${position.coords.latitude.toFixed(2)}, ${position.coords.longitude.toFixed(2)})`,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };

        // Check if we already added a "My Location" (simplistic check by name prefix)
        setAvailableCities(prev => {
           // Filter out previous dynamic locations to keep list clean or append
           // For this implementation, we just append.
           return [...prev, newCity];
        });

        // Select the newly added city (it will be at the end of the array)
        setSelectedCityIndex(availableCities.length); 
        setIsLocating(false);
      },
      (error) => {
        console.error("Geolocation Error:", error);
        alert("Konum alınamadı. Lütfen tarayıcı izinlerini kontrol edin.");
        setIsLocating(false);
      }
    );
  };

  const handleAIAnalysis = async () => {
    if (!process.env.API_KEY) {
        alert("API Key is missing.");
        return;
    }
    setAiLoading(true);
    setAiAnalysis(null);
    const result = await getSkyAnalysis(currentCity, currentDate, currentTime);
    setAiAnalysis(result);
    setAiLoading(false);
  };

  const handleSaveObservation = async (e: React.FormEvent) => {
    e.preventDefault();
    let finalNotes = obsForm.notes || "";
    
    if (process.env.API_KEY && obsForm.notes && obsForm.objects) {
        setAiLoading(true);
        const aiComment = await analyzeObservationNotes(obsForm.notes, obsForm.objects);
        finalNotes += `\n\n[AI Asistanı]: ${aiComment}`;
        setAiLoading(false);
    }

    const newObs: Observation = {
      id: Date.now(),
      date: obsForm.date!,
      time: obsForm.time!,
      location: currentCity,
      weather: obsForm.weather!,
      objects: obsForm.objects!,
      skyClarity: obsForm.skyClarity!,
      notes: finalNotes,
      timestamp: new Date().toISOString()
    };

    setObservations(prev => [newObs, ...prev]);
    alert('Gözlem kaydedildi!');
    setObsForm(prev => ({ ...prev, objects: '', notes: '' }));
    setActiveTab('history');
  };

  const deleteObservation = (id: number) => {
    if (confirm('Silmek istediğinize emin misiniz?')) {
      setObservations(prev => prev.filter(o => o.id !== id));
    }
  };

  const exportJSON = () => {
    const dataStr = JSON.stringify(observations, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `trakya_gozlem_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportWord = async () => {
    if (observations.length === 0) {
      alert("İndirilecek kayıt bulunamadı.");
      return;
    }

    const children = [
      new Paragraph({
        text: "Trakya SkyObserver - Gözlem Raporu",
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
      }),
      new Paragraph({
        text: `Rapor Tarihi: ${new Date().toLocaleDateString('tr-TR')}`,
        alignment: AlignmentType.CENTER,
        spacing: { after: 500 },
      }),
    ];

    observations.forEach((obs) => {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `📅 Tarih/Saat: ${obs.date} - ${obs.time}`,
              bold: true,
              size: 28,
            }),
          ],
          border: {
             bottom: {
                 color: "auto",
                 space: 1,
                 value: BorderStyle.SINGLE,
                 size: 6,
             },
          },
          spacing: { before: 400, after: 200 },
        }),
        new Paragraph({
          children: [new TextRun({ text: "📍 Konum: ", bold: true }), new TextRun(obs.location.name)],
        }),
        new Paragraph({
          children: [new TextRun({ text: "☁️ Hava Durumu: ", bold: true }), new TextRun(obs.weather)],
        }),
        new Paragraph({
          children: [new TextRun({ text: "🔭 Gözlemlenenler: ", bold: true }), new TextRun(obs.objects)],
        }),
        new Paragraph({
          children: [new TextRun({ text: "✨ Berraklık (1-5): ", bold: true }), new TextRun(obs.skyClarity)],
        }),
        new Paragraph({
          children: [new TextRun({ text: "📝 Notlar:", bold: true })],
          spacing: { before: 200 },
        }),
        new Paragraph({
          text: obs.notes,
          spacing: { after: 300 },
        })
      );
    });

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: children,
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `trakya_gozlem_raporu_${new Date().toISOString().slice(0, 10)}.docx`);
  };

  // --- Render ---
  return (
    <div className="min-h-screen bg-space-950 text-gray-100 pb-20 font-sans">
      {/* Header */}
      <header className="bg-space-900 border-b border-white/5 p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        <div className="max-w-4xl mx-auto flex items-center justify-between relative z-10">
          <div className="flex items-center gap-4">
            <img 
              src="https://user-gen-media-assets.s3.amazonaws.com/gemini_images/07dc5a11-40ce-4ecb-aa29-d6ac7bd89feb.png" 
              alt="Trakya SkyObserver" 
              className="w-16 h-16 rounded-full border-2 border-teal-500 shadow-[0_0_20px_rgba(45,166,178,0.3)] object-cover bg-space-950"
            />
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                Trakya SkyObserver
              </h1>
              <p className="text-[10px] sm:text-xs text-teal-400 font-bold tracking-widest uppercase">
                TRAKYA ASTRONOMİ AMATÖR GÖZLEM ARACI
              </p>
            </div>
          </div>
          
          <div className="hidden sm:block text-right">
            <div className="text-sm font-semibold text-gray-200">{currentCity.name}</div>
            <div className="text-[10px] text-gray-500 font-mono">{currentCity.latitude.toFixed(4)}°N, {currentCity.longitude.toFixed(4)}°E</div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <div className="sticky top-0 z-50 bg-space-950/80 backdrop-blur-xl border-b border-white/5 mb-8">
        <div className="max-w-4xl mx-auto flex overflow-x-auto">
          <button 
            onClick={() => setActiveTab('map')}
            className={`flex-1 min-w-[100px] py-4 text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-all border-b-2 ${activeTab === 'map' ? 'border-teal-500 text-teal-400 bg-teal-500/5' : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            <MapPin className="w-4 h-4" /> Gökyüzü
          </button>
          <button 
            onClick={() => setActiveTab('log')}
            className={`flex-1 min-w-[100px] py-4 text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-all border-b-2 ${activeTab === 'log' ? 'border-teal-500 text-teal-400 bg-teal-500/5' : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            <BookOpen className="w-4 h-4" /> Defter
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`flex-1 min-w-[100px] py-4 text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-all border-b-2 ${activeTab === 'history' ? 'border-teal-500 text-teal-400 bg-teal-500/5' : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            <Clock className="w-4 h-4" /> Kayıtlar
          </button>
          <button 
            onClick={() => setActiveTab('stats')}
            className={`flex-1 min-w-[100px] py-4 text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-all border-b-2 ${activeTab === 'stats' ? 'border-teal-500 text-teal-400 bg-teal-500/5' : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            <BarChart3 className="w-4 h-4" /> İstatistik
          </button>
          <button 
            onClick={() => setActiveTab('help')}
            className={`flex-1 min-w-[100px] py-4 text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-all border-b-2 ${activeTab === 'help' ? 'border-teal-500 text-teal-400 bg-teal-500/5' : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            <Info className="w-4 h-4" /> Yardım
          </button>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4">
        
        {/* --- MAP TAB --- */}
        {activeTab === 'map' && (
          <div className="space-y-6 animate-fadeIn pb-10">
            {/* Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 bg-space-900 p-5 rounded-2xl border border-white/5 shadow-xl">
              <div className="space-y-2">
                <label className="text-[10px] uppercase text-gray-500 font-bold tracking-wider flex items-center gap-1"><Calendar className="w-3 h-3"/> Tarih</label>
                <input 
                  type="date" 
                  value={currentDate} 
                  onChange={(e) => setCurrentDate(e.target.value)}
                  className="w-full bg-space-950 border border-space-800 rounded-lg px-3 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase text-gray-500 font-bold tracking-wider flex items-center gap-1"><Clock className="w-3 h-3"/> Saat</label>
                <input 
                  type="time" 
                  value={currentTime} 
                  onChange={(e) => setCurrentTime(e.target.value)}
                  className="w-full bg-space-950 border border-space-800 rounded-lg px-3 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] uppercase text-gray-500 font-bold tracking-wider flex items-center gap-1"><MapPin className="w-3 h-3"/> Konum</label>
                  <button 
                    onClick={handleGeolocation} 
                    disabled={isLocating}
                    className="text-[10px] text-teal-400 hover:text-white flex items-center gap-1 transition-colors disabled:opacity-50"
                  >
                    {isLocating ? <div className="animate-spin w-3 h-3 border-2 border-teal-500 border-t-transparent rounded-full"></div> : <LocateFixed className="w-3 h-3" />}
                  </button>
                </div>
                <select 
                  value={selectedCityIndex}
                  onChange={(e) => setSelectedCityIndex(Number(e.target.value))}
                  className="w-full bg-space-950 border border-space-800 rounded-lg px-3 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
                >
                  {availableCities.map((city, idx) => (
                    <option key={city.name + idx} value={idx}>{city.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] uppercase text-gray-500 font-bold tracking-wider flex items-center gap-1"><Crosshair className="w-3 h-3"/> Takip Modu</label>
                 <select 
                   value={trackedBodyName || ""}
                   onChange={(e) => setTrackedBodyName(e.target.value || null)}
                   className="w-full bg-space-950 border border-space-800 rounded-lg px-3 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
                 >
                   <option value="">Serbest Gezinme</option>
                   {celestialBodies.sort((a,b) => (a.type === 'planet' ? 0 : 1) - (b.type === 'planet' ? 0 : 1)).map((body) => (
                     <option key={body.name} value={body.name}>
                       {body.type === 'sun' ? '☀️ ' : body.type === 'moon' ? '🌑 ' : body.type === 'planet' ? '🪐 ' : '⭐ '}
                       {body.name}
                     </option>
                   ))}
                 </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase text-gray-500 font-bold tracking-wider flex items-center gap-1"><Palette className="w-3 h-3"/> Tema</label>
                <select 
                    value={currentThemeId}
                    onChange={(e) => setCurrentThemeId(e.target.value)}
                    className="w-full bg-space-950 border border-space-800 rounded-lg px-3 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
                >
                    {Object.values(SKY_THEMES).map(theme => (
                        <option key={theme.id} value={theme.id}>{theme.name}</option>
                    ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Sky Map Visualization */}
              <div className="lg:col-span-2 bg-space-900 p-1 rounded-full aspect-square relative border border-white/5 shadow-2xl mx-auto w-full max-w-[500px]">
                <SkyMap 
                    bodies={celestialBodies} 
                    constellations={constellations} 
                    trackedBody={trackedBody}
                    onStopTracking={() => setTrackedBodyName(null)}
                    theme={currentTheme}
                />
              </div>

              {/* Info Column */}
              <div className="space-y-4">
                {/* Weather Card */}
                <div className="bg-space-900 rounded-xl p-5 border border-white/5 shadow-lg">
                  <h3 className="text-teal-400 text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Cloud className="w-4 h-4" /> Anlık Hava Durumu
                  </h3>
                  {weatherData ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-2">
                            <Thermometer className="w-5 h-5 text-orange-400" />
                            <span className="text-2xl font-bold text-white">{weatherData.temperature}°C</span>
                         </div>
                         <div className="text-right">
                           <div className="text-sm text-gray-300">{weatherData.conditionText}</div>
                         </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
                        <div className="bg-space-950 p-2 rounded flex items-center gap-2">
                           <Wind className="w-3 h-3 text-blue-400" /> {weatherData.windSpeed} km/s
                        </div>
                        <div className="bg-space-950 p-2 rounded flex items-center gap-2">
                           <Droplets className="w-3 h-3 text-blue-400" /> {weatherData.cloudCover}% Bulut
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-gray-500 animate-pulse">Veri alınıyor...</div>
                  )}
                </div>

                {/* Moon Phase Card */}
                {moonData && (
                  <div className="bg-space-900 rounded-xl p-5 border border-white/5 shadow-lg">
                    <h3 className="text-teal-400 text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-gray-700 flex items-center justify-center text-[10px]">☾</div> Ay Durumu
                    </h3>
                    <div className="flex items-center justify-between mb-2">
                       <span className="text-4xl filter drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">{moonData.emoji}</span>
                       <div className="text-right">
                          <div className="text-white font-medium">{moonData.phaseName}</div>
                          <div className="text-xs text-teal-500">%{(moonData.illumination * 100).toFixed(0)} Aydınlık</div>
                       </div>
                    </div>
                    <div className="w-full bg-space-950 h-1.5 rounded-full overflow-hidden mt-2">
                       <div className="h-full bg-teal-600 transition-all duration-1000" style={{ width: `${moonData.illumination * 100}%`}}></div>
                    </div>
                  </div>
                )}
                
                {/* Sky Events Notification Card */}
                <div className="bg-space-900 rounded-xl p-5 border border-white/5 shadow-lg">
                   <h3 className="text-teal-400 text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
                      <Bell className="w-4 h-4" /> Yaklaşan Olaylar
                   </h3>
                   {skyEvents.length > 0 ? (
                       <ul className="space-y-2">
                           {skyEvents.map((event, idx) => (
                               <li key={idx} className="text-xs text-gray-300 bg-space-950/50 p-2 rounded border border-white/5 flex items-start gap-2">
                                   <span className="text-teal-400 mt-0.5">•</span>
                                   {event}
                               </li>
                           ))}
                       </ul>
                   ) : (
                       <div className="text-xs text-gray-500 italic">Önemli bir gök olayı bulunmuyor.</div>
                   )}
                </div>

                {/* Gemini AI */}
                <div className="bg-gradient-to-br from-indigo-950 to-space-900 p-5 rounded-xl border border-indigo-500/20 shadow-lg relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/10 rounded-full blur-xl"></div>
                   <h3 className="text-indigo-400 text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2 relative z-10">
                        <BrainCircuit className="w-4 h-4" /> AI Astronom
                    </h3>
                    
                    {aiAnalysis ? (
                        <div className="text-sm text-indigo-100 leading-relaxed animate-fadeIn relative z-10">
                            {aiAnalysis}
                            <button onClick={() => setAiAnalysis(null)} className="block mt-3 text-xs text-indigo-400 hover:text-white underline">Sıfırla</button>
                        </div>
                    ) : (
                        <div className="relative z-10">
                            <p className="text-xs text-gray-400 mb-3">Seçili konum ve zamandaki gökyüzü olayları hakkında detaylı analiz alın.</p>
                            <button 
                                onClick={handleAIAnalysis}
                                disabled={aiLoading}
                                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium py-2.5 px-3 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                            >
                                {aiLoading ? (
                                   <><div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Analiz...</> 
                                ) : (
                                   'Analiz Başlat'
                                )}
                            </button>
                        </div>
                    )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- LOG TAB --- */}
        {activeTab === 'log' && (
          <div className="max-w-2xl mx-auto animate-fadeIn">
            <form onSubmit={handleSaveObservation} className="bg-space-900 p-8 rounded-2xl border border-white/5 shadow-2xl space-y-6">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-teal-400" />
                  Gözlem Kaydı
                </h2>
                <span className="text-xs bg-teal-500/10 text-teal-400 px-2 py-1 rounded border border-teal-500/20">
                   {currentCity.name}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs text-gray-400 font-medium ml-1">Tarih</label>
                  <input 
                    type="date" 
                    required
                    value={obsForm.date}
                    onChange={e => setObsForm({...obsForm, date: e.target.value})}
                    className="w-full bg-space-950 border border-space-800 rounded-lg p-3 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-gray-400 font-medium ml-1">Saat</label>
                  <input 
                    type="time" 
                    required
                    value={obsForm.time}
                    onChange={e => setObsForm({...obsForm, time: e.target.value})}
                    className="w-full bg-space-950 border border-space-800 rounded-lg p-3 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                 <div className="space-y-2">
                  <label className="text-xs text-gray-400 font-medium ml-1">Hava Durumu</label>
                  <div className="relative">
                    <input 
                      type="text"
                      value={obsForm.weather}
                      onChange={e => setObsForm({...obsForm, weather: e.target.value})}
                      className="w-full bg-space-950 border border-space-800 rounded-lg p-3 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 transition-all"
                      placeholder="Örn: Açık"
                    />
                    {weatherData && (
                        <button 
                            type="button" 
                            onClick={() => setObsForm(prev => ({...prev, weather: weatherData.conditionText}))}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] bg-space-800 px-2 py-1 rounded text-teal-400 hover:text-white transition-colors"
                        >
                            Otomatik Çek
                        </button>
                    )}
                  </div>
                </div>
                 <div className="space-y-2">
                  <label className="text-xs text-gray-400 font-medium ml-1">Seeing (Berraklık)</label>
                  <select 
                    value={obsForm.skyClarity}
                    onChange={e => setObsForm({...obsForm, skyClarity: e.target.value})}
                    className="w-full bg-space-950 border border-space-800 rounded-lg p-3 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 transition-all"
                  >
                    {Object.entries(CLARITY_SCALE).map(([key, label]) => (
                        <option key={key} value={key}>{key} - {label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-gray-400 font-medium ml-1">Gözlemlenen Cisimler</label>
                <input 
                  type="text" 
                  required
                  list="celestial-bodies-list"
                  placeholder="Örn: Jüpiter, Ay, Orion Bulutsusu..."
                  value={obsForm.objects}
                  onChange={e => setObsForm({...obsForm, objects: e.target.value})}
                  className="w-full bg-space-950 border border-space-800 rounded-lg p-3 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 transition-all"
                />
                <datalist id="celestial-bodies-list">
                    {suggestionOptions.map(option => (
                        <option key={option} value={option} />
                    ))}
                </datalist>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-gray-400 font-medium ml-1">Notlar</label>
                <textarea 
                  rows={4}
                  placeholder="Gözlem detayları, kullanılan ekipman vb..."
                  value={obsForm.notes}
                  onChange={e => setObsForm({...obsForm, notes: e.target.value})}
                  className="w-full bg-space-950 border border-space-800 rounded-lg p-3 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 transition-all"
                />
              </div>

              <button 
                type="submit" 
                disabled={aiLoading}
                className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-teal-900/20 hover:shadow-teal-900/40 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
              >
                {aiLoading ? 'AI Notları Analiz Ediyor...' : 'Gözlemi Kaydet'}
              </button>
            </form>
          </div>
        )}

        {/* --- HISTORY TAB --- */}
        {activeTab === 'history' && (
          <div className="space-y-6 animate-fadeIn pb-10">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white">Gözlem Geçmişi ({observations.length})</h2>
                {observations.length > 0 && (
                    <div className="flex gap-2">
                        <button 
                            onClick={exportJSON}
                            className="flex items-center gap-2 bg-space-900 hover:bg-space-800 border border-white/10 px-4 py-2 rounded-lg text-sm transition-colors text-teal-400"
                        >
                            <Download className="w-4 h-4" /> JSON
                        </button>
                        <button 
                            onClick={exportWord}
                            className="flex items-center gap-2 bg-blue-900/30 hover:bg-blue-800/40 border border-blue-500/20 px-4 py-2 rounded-lg text-sm transition-colors text-blue-400"
                        >
                            <FileText className="w-4 h-4" /> Word
                        </button>
                    </div>
                )}
            </div>

            {observations.length === 0 ? (
                <div className="text-center py-20 bg-space-900/50 rounded-2xl border border-white/5 border-dashed">
                    <div className="bg-space-800 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                         <BookOpen className="w-8 h-8 text-gray-600" />
                    </div>
                    <p className="text-gray-400 font-medium">Henüz kayıtlı gözlem bulunmuyor.</p>
                    <button onClick={() => setActiveTab('log')} className="text-teal-400 hover:text-teal-300 hover:underline mt-2 text-sm font-medium">İlk gözleminizi şimdi kaydedin</button>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {observations.map((obs) => (
                        <div key={obs.id} className="bg-space-900 rounded-xl p-6 border border-white/5 hover:border-teal-500/30 transition-all group relative shadow-lg">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="bg-teal-500/10 text-teal-400 px-2.5 py-1 rounded-md text-xs font-bold border border-teal-500/20">
                                            {obs.date}
                                        </div>
                                        <span className="text-gray-500 text-xs font-mono">{obs.time}</span>
                                    </div>
                                    <h3 className="font-bold text-lg text-white group-hover:text-teal-400 transition-colors">{obs.objects}</h3>
                                </div>
                                <button 
                                    onClick={() => deleteObservation(obs.id)}
                                    className="p-2 text-gray-600 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5 text-xs text-gray-400 bg-space-950/50 p-3 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <MapPin className="w-3.5 h-3.5 text-teal-600" />
                                    {obs.location.name}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Cloud className="w-3.5 h-3.5 text-teal-600" />
                                    {obs.weather}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Star className="w-3.5 h-3.5 text-teal-600" />
                                    Berraklık: {obs.skyClarity}/5
                                </div>
                            </div>

                            {obs.notes && (
                                <div className="bg-space-950 p-4 rounded-lg text-sm text-gray-300 leading-relaxed whitespace-pre-wrap border border-white/5 font-light">
                                    {obs.notes}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
          </div>
        )}

        {/* --- STATS TAB --- */}
        {activeTab === 'stats' && (
            <div className="max-w-4xl mx-auto animate-fadeIn space-y-8 pb-10">
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-white mb-2">Gözlem İstatistikleri</h2>
                    <p className="text-gray-400 text-sm">Gözlem geçmişinizin özet analizi.</p>
                </div>
                
                {stats ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Card 1: Total */}
                        <div className="bg-space-900 p-6 rounded-2xl border border-white/5 shadow-xl flex flex-col items-center justify-center text-center">
                            <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-4 text-blue-400">
                                <BookOpen className="w-8 h-8" />
                            </div>
                            <div className="text-3xl font-bold text-white mb-1">{stats.totalObs}</div>
                            <div className="text-xs text-gray-400 uppercase tracking-wider">Toplam Gözlem</div>
                        </div>

                        {/* Card 2: Frequent */}
                        <div className="bg-space-900 p-6 rounded-2xl border border-white/5 shadow-xl flex flex-col items-center justify-center text-center">
                            <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mb-4 text-yellow-400">
                                <Star className="w-8 h-8" />
                            </div>
                            <div className="text-xl font-bold text-white mb-1 px-2 break-words max-w-full">
                                {stats.mostFrequent}
                            </div>
                            <div className="text-xs text-gray-400 uppercase tracking-wider">En Çok İzlenen ({stats.freqCount} kez)</div>
                        </div>

                        {/* Card 3: Avg Clarity */}
                        <div className="bg-space-900 p-6 rounded-2xl border border-white/5 shadow-xl flex flex-col items-center justify-center text-center">
                            <div className="w-16 h-16 bg-teal-500/10 rounded-full flex items-center justify-center mb-4 text-teal-400">
                                <TrendingUp className="w-8 h-8" />
                            </div>
                            <div className="text-3xl font-bold text-white mb-1">{stats.avgClarity}<span className="text-sm text-gray-500">/5</span></div>
                            <div className="text-xs text-gray-400 uppercase tracking-wider">Ortalama Berraklık</div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-20 bg-space-900/50 rounded-2xl border border-white/5 border-dashed">
                        <div className="bg-space-800 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                            <BarChart3 className="w-8 h-8 text-gray-600" />
                        </div>
                        <p className="text-gray-400 font-medium">İstatistik oluşturmak için henüz yeterli veri yok.</p>
                        <button onClick={() => setActiveTab('log')} className="text-teal-400 hover:text-teal-300 hover:underline mt-2 text-sm font-medium">İlk gözleminizi kaydedin</button>
                    </div>
                )}
            </div>
        )}

        {/* --- HELP TAB --- */}
        {activeTab === 'help' && (
          <div className="max-w-3xl mx-auto animate-fadeIn space-y-8 pb-10">
             <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">Nasıl Kullanılır?</h2>
                <p className="text-gray-400 text-sm">Trakya SkyObserver uygulamasının özellikleri ve kullanım rehberi.</p>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Map Info */}
                <div className="bg-space-900 p-6 rounded-2xl border border-white/5 shadow-xl">
                   <div className="w-12 h-12 bg-teal-500/10 rounded-xl flex items-center justify-center mb-4 text-teal-400">
                      <MapPin className="w-6 h-6" />
                   </div>
                   <h3 className="text-lg font-bold text-white mb-2">Gökyüzü Haritası</h3>
                   <p className="text-sm text-gray-400 leading-relaxed">
                      Seçilen şehir ve zamana göre anlık gökyüzü simülasyonunu görüntüler. 
                      Haritanın <span className="text-teal-400">merkezi tam tepenizi (Zenith)</span>, kenarları ise 
                      <span className="text-teal-400"> ufuk çizgisini</span> temsil eder.
                   </p>
                </div>

                {/* Log Info */}
                <div className="bg-space-900 p-6 rounded-2xl border border-white/5 shadow-xl">
                   <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center mb-4 text-purple-400">
                      <BookOpen className="w-6 h-6" />
                   </div>
                   <h3 className="text-lg font-bold text-white mb-2">Gözlem Defteri</h3>
                   <p className="text-sm text-gray-400 leading-relaxed">
                      Yaptığınız astronomik gözlemleri kaydedin. Konum, tarih, görülen cisimler ve hava kalitesi bilgilerini
                      dijital bir defterde saklayın.
                   </p>
                </div>

                {/* AI Info */}
                <div className="bg-space-900 p-6 rounded-2xl border border-white/5 shadow-xl">
                   <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center mb-4 text-indigo-400">
                      <BrainCircuit className="w-6 h-6" />
                   </div>
                   <h3 className="text-lg font-bold text-white mb-2">Yapay Zeka Asistanı</h3>
                   <p className="text-sm text-gray-400 leading-relaxed">
                      <strong>Gemini API</strong> destekli asistan, o anki gökyüzü olaylarını analiz eder veya 
                      aldığınız notlara bilimsel yorumlar ekler. "Analiz Başlat" butonu ile gökyüzü raporu alabilirsiniz.
                   </p>
                </div>

                {/* History Info */}
                <div className="bg-space-900 p-6 rounded-2xl border border-white/5 shadow-xl">
                   <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-4 text-blue-400">
                      <Clock className="w-6 h-6" />
                   </div>
                   <h3 className="text-lg font-bold text-white mb-2">Kayıt & Yedekleme</h3>
                   <p className="text-sm text-gray-400 leading-relaxed">
                      Tüm gözlemleriniz tarayıcı hafızasında saklanır. Verilerinizi kaybetmemek için 
                      geçmiş sekmesinden <span className="text-teal-400">JSON indir</span> veya <span className="text-blue-400">Word indir</span> seçeneği ile yedeğinizi alabilirsiniz.
                   </p>
                </div>
             </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default App;