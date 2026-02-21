import { useState, useEffect } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { Sparkles, Loader2, Building2, Copy, Check, Star, Tags, Bookmark } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const PREDEFINED_MODIFIERS = [
  'Tech', 'Eco', 'Global', 'Labs', 'Hub', 'AI', 'Smart', 'Pro', 'Cloud', 'Data', 'Health', 'Fin'
];

interface StartupIdea {
  name: string;
  slogan: string;
}

export default function App() {
  const [industry, setIndustry] = useState('');
  const [keywords, setKeywords] = useState('');
  const [selectedModifiers, setSelectedModifiers] = useState<string[]>([]);
  const [ideas, setIdeas] = useState<StartupIdea[]>([]);
  const [favorites, setFavorites] = useState<StartupIdea[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [view, setView] = useState<'generate' | 'favorites'>('generate');

  // Load favorites from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('startup-favorites');
    if (saved) {
      try {
        setFavorites(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse favorites', e);
      }
    }
  }, []);

  // Save favorites to local storage when updated
  useEffect(() => {
    localStorage.setItem('startup-favorites', JSON.stringify(favorites));
  }, [favorites]);

  const toggleModifier = (mod: string) => {
    setSelectedModifiers(prev => 
      prev.includes(mod) ? prev.filter(m => m !== mod) : [...prev, mod]
    );
  };

  const toggleFavorite = (idea: StartupIdea) => {
    setFavorites(prev => {
      const exists = prev.some(f => f.name === idea.name);
      if (exists) {
        return prev.filter(f => f.name !== idea.name);
      }
      return [...prev, idea];
    });
  };

  const isFavorite = (name: string) => favorites.some(f => f.name === name);

  const generateIdeas = async () => {
    if (!industry.trim()) return;
    
    setLoading(true);
    setError(null);
    setCopiedIndex(null);
    setView('generate');
    
    try {
      const prompt = `Generate 10 highly creative, catchy, and modern startup names for the following industry or concept: "${industry}".
      ${keywords.trim() ? `Incorporate or be inspired by these keywords: "${keywords}".` : ''}
      ${selectedModifiers.length > 0 ? `Consider these modifiers/styles: ${selectedModifiers.join(', ')}.` : ''}
      For each name, also generate one unique, catchy slogan. Return the result as a list of objects with 'name' and 'slogan' properties.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING, description: "The startup name" },
                slogan: { type: Type.STRING, description: "A catchy slogan for the startup" },
              },
              required: ["name", "slogan"]
            },
            description: "A list of 10 creative startup names and slogans.",
          },
        },
      });

      const jsonStr = response.text?.trim();
      if (jsonStr) {
        const parsedIdeas = JSON.parse(jsonStr);
        setIdeas(parsedIdeas);
      } else {
        throw new Error("Failed to generate ideas.");
      }
    } catch (err) {
      console.error(err);
      setError("An error occurred while generating ideas. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="w-full max-w-2xl space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-4">
            <Sparkles className="h-6 w-6" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-neutral-900">
            Startup Name Generator
          </h2>
          <p className="mt-2 text-sm text-neutral-600">
            Enter your industry, add keywords, and we'll generate creative names with slogans.
          </p>
        </div>

        <div className="flex justify-center space-x-4 border-b border-neutral-200 pb-4">
          <button
            onClick={() => setView('generate')}
            className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${view === 'generate' ? 'bg-indigo-50 text-indigo-700' : 'text-neutral-600 hover:bg-neutral-100'}`}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Generator
          </button>
          <button
            onClick={() => setView('favorites')}
            className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${view === 'favorites' ? 'bg-indigo-50 text-indigo-700' : 'text-neutral-600 hover:bg-neutral-100'}`}
          >
            <Bookmark className="w-4 h-4 mr-2" />
            Favorites ({favorites.length})
          </button>
        </div>

        {view === 'generate' && (
          <div className="space-y-6 bg-white p-6 rounded-2xl shadow-sm border border-neutral-100">
            <div className="space-y-4">
              <div>
                <label htmlFor="industry" className="block text-sm font-medium text-neutral-700">
                  Industry or Concept *
                </label>
                <div className="mt-2 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building2 className="h-5 w-5 text-neutral-400" />
                  </div>
                  <input
                    type="text"
                    name="industry"
                    id="industry"
                    className="block w-full pl-10 pr-3 py-3 border border-neutral-200 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors outline-none"
                    placeholder="e.g. AI Healthcare, Sustainable Fashion..."
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && generateIdeas()}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="keywords" className="block text-sm font-medium text-neutral-700">
                  Additional Keywords (Optional)
                </label>
                <div className="mt-2 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Tags className="h-5 w-5 text-neutral-400" />
                  </div>
                  <input
                    type="text"
                    name="keywords"
                    id="keywords"
                    className="block w-full pl-10 pr-3 py-3 border border-neutral-200 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors outline-none"
                    placeholder="e.g. fast, green, secure..."
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && generateIdeas()}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Modifiers (Optional)
                </label>
                <div className="flex flex-wrap gap-2">
                  {PREDEFINED_MODIFIERS.map(mod => (
                    <button
                      key={mod}
                      onClick={() => toggleModifier(mod)}
                      className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                        selectedModifiers.includes(mod)
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          : 'bg-white text-neutral-600 border-neutral-200 hover:border-indigo-200'
                      }`}
                    >
                      {mod}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={generateIdeas}
              disabled={loading || !industry.trim()}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-6"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" />
                  Generating...
                </>
              ) : (
                'Generate Names & Slogans'
              )}
            </button>
          </div>
        )}

        {error && view === 'generate' && (
          <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm border border-red-100">
            {error}
          </div>
        )}

        <AnimatePresence mode="wait">
          {(view === 'generate' && ideas.length > 0) || view === 'favorites' ? (
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mt-8"
            >
              <h3 className="text-xl font-semibold text-neutral-900 mb-4 px-1">
                {view === 'generate' ? 'Generated Ideas' : 'Your Favorites'}
              </h3>
              
              {view === 'favorites' && favorites.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-neutral-100 shadow-sm">
                  <Star className="mx-auto h-12 w-12 text-neutral-300 mb-3" />
                  <p className="text-neutral-500">No favorites yet. Generate some ideas and star them!</p>
                </div>
              ) : (
                <ul className="space-y-4">
                  {(view === 'generate' ? ideas : favorites).map((idea, index) => (
                    <motion.li
                      key={`${idea.name}-${index}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-white p-5 rounded-2xl shadow-sm border border-neutral-100 flex items-start justify-between group hover:border-indigo-200 transition-all"
                    >
                      <div className="flex-1 pr-4">
                        <h4 className="text-lg font-bold text-neutral-900">{idea.name}</h4>
                        <p className="text-neutral-600 mt-1 italic">"{idea.slogan}"</p>
                      </div>
                      <div className="flex items-center space-x-2 shrink-0">
                        <button
                          onClick={() => handleCopy(`${idea.name} - ${idea.slogan}`, index)}
                          className="text-neutral-400 hover:text-indigo-600 focus:outline-none transition-colors p-2 rounded-lg hover:bg-indigo-50"
                          title="Copy to clipboard"
                        >
                          {copiedIndex === index ? (
                            <Check className="h-5 w-5 text-emerald-500" />
                          ) : (
                            <Copy className="h-5 w-5" />
                          )}
                        </button>
                        <button
                          onClick={() => toggleFavorite(idea)}
                          className={`focus:outline-none transition-colors p-2 rounded-lg hover:bg-amber-50 ${
                            isFavorite(idea.name) ? 'text-amber-400' : 'text-neutral-300 hover:text-amber-400'
                          }`}
                          title={isFavorite(idea.name) ? "Remove from favorites" : "Add to favorites"}
                        >
                          <Star className="h-5 w-5" fill={isFavorite(idea.name) ? "currentColor" : "none"} />
                        </button>
                      </div>
                    </motion.li>
                  ))}
                </ul>
              )}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
