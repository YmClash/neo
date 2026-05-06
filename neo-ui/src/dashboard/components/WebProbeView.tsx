import React, { useState } from 'react';
import { Card, Badge, Button } from '@shared/components';
import { useProbes, ProbeConfig } from '@shared/hooks';
import { motion, AnimatePresence } from 'framer-motion';

export const WebProbeView: React.FC = () => {
  const { results, loading, isProbing, executeProbe, clearResults } = useProbes();
  
  const [config, setConfig] = useState<ProbeConfig>({
    selectors: { 'heading': 'h1' },
    extract_text: false,
    extract_links: true,
    extract_images: false,
  });

  const [selectorKey, setSelectorKey] = useState('heading');
  const [selectorValue, setSelectorValue] = useState('h1');

  const handleAddSelector = () => {
    if (selectorKey && selectorValue) {
      setConfig({
        ...config,
        selectors: { ...config.selectors, [selectorKey]: selectorValue }
      });
      setSelectorKey('');
      setSelectorValue('');
    }
  };

  const handleRemoveSelector = (key: string) => {
    const newSelectors = { ...config.selectors };
    delete newSelectors[key];
    setConfig({ ...config, selectors: newSelectors });
  };

  const handleRunProbe = () => {
    executeProbe(config);
  };

  return (
    <Card variant="glass" padding="md">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">🕷️</span>
          <h3 className="text-sm font-mono text-neo-text-dim tracking-wider">
            WEB PROBES
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={isProbing ? 'warning' : 'default'} dot pulse={isProbing} size="sm">
            {isProbing ? 'SCANNING ACTIVE TAB' : `${results.length} SAVED`}
          </Badge>
          <Button variant="danger" size="sm" onClick={clearResults} disabled={results.length === 0}>
            Clear
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Configuration Panel */}
        <div className="md:col-span-1 bg-neo-bg-alt/50 border border-neo-border rounded-neo p-4">
          <h4 className="text-xs font-mono text-neo-text-dim mb-3">PROBE CONFIGURATION</h4>
          
          <div className="space-y-3 mb-4">
            <label className="flex items-center gap-2 text-xs text-neo-text cursor-pointer">
              <input 
                type="checkbox" 
                className="accent-neo-accent"
                checked={config.extract_links} 
                onChange={(e) => setConfig({...config, extract_links: e.target.checked})} 
              />
              Extract All Links
            </label>
            <label className="flex items-center gap-2 text-xs text-neo-text cursor-pointer">
              <input 
                type="checkbox" 
                className="accent-neo-accent"
                checked={config.extract_images} 
                onChange={(e) => setConfig({...config, extract_images: e.target.checked})} 
              />
              Extract Image Sources
            </label>
            <label className="flex items-center gap-2 text-xs text-neo-text cursor-pointer">
              <input 
                type="checkbox" 
                className="accent-neo-accent"
                checked={config.extract_text} 
                onChange={(e) => setConfig({...config, extract_text: e.target.checked})} 
              />
              Extract Body Text
            </label>
          </div>

          <div className="h-px bg-neo-border mb-3" />

          <h4 className="text-xs font-mono text-neo-text-dim mb-2">CSS SELECTORS</h4>
          <div className="space-y-2 mb-3">
            {Object.entries(config.selectors).map(([k, v]) => (
              <div key={k} className="flex items-center justify-between bg-neo-bg p-1.5 rounded border border-neo-border text-[10px] font-mono">
                <span className="text-neo-text truncate">{k}: <span className="text-neo-accent">{v as string}</span></span>
                <button onClick={() => handleRemoveSelector(k)} className="text-neo-danger hover:text-red-400 px-1">✕</button>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-2 mb-4">
            <input 
              type="text" 
              placeholder="Key (e.g. title)" 
              value={selectorKey}
              onChange={(e) => setSelectorKey(e.target.value)}
              className="bg-neo-bg border border-neo-border rounded px-2 py-1 text-xs text-neo-text focus:outline-none"
            />
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="Selector (e.g. h1)" 
                value={selectorValue}
                onChange={(e) => setSelectorValue(e.target.value)}
                className="flex-1 bg-neo-bg border border-neo-border rounded px-2 py-1 text-xs text-neo-text focus:outline-none"
              />
              <Button variant="outline" size="sm" onClick={handleAddSelector}>+</Button>
            </div>
          </div>

          <Button 
            variant="primary" 
            className="w-full" 
            onClick={handleRunProbe} 
            disabled={isProbing}
          >
            {isProbing ? 'PROBING...' : 'RUN ON ACTIVE TAB'}
          </Button>
        </div>

        {/* Results Panel */}
        <div className="md:col-span-2 overflow-hidden rounded-neo border border-neo-border bg-neo-bg/50 flex flex-col">
          {loading ? (
            <div className="p-8 text-center text-xs font-mono text-neo-text-dim animate-pulse">
              LOADING HISTORY...
            </div>
          ) : results.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="text-4xl mb-3 opacity-30">🕸️</div>
              <p className="text-sm text-neo-text-dim mb-1">No extraction history</p>
              <p className="text-[10px] font-mono text-neo-text-dim opacity-60">
                Run a probe to start collecting data from web pages.
              </p>
            </div>
          ) : (
            <div className="flex-1 overflow-auto custom-scrollbar">
              <table className="w-full text-xs text-left">
                <thead className="sticky top-0 bg-neo-bg-alt border-b border-neo-border shadow-md z-10">
                  <tr>
                    <th className="px-4 py-2 font-mono text-neo-text-dim font-medium">Time</th>
                    <th className="px-4 py-2 font-mono text-neo-text-dim font-medium">Page</th>
                    <th className="px-4 py-2 font-mono text-neo-text-dim font-medium">Status</th>
                    <th className="px-4 py-2 font-mono text-neo-text-dim font-medium">Data Items</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neo-border/50">
                  <AnimatePresence>
                    {results.map((res) => (
                      <motion.tr 
                        key={res.id}
                        initial={{ opacity: 0, backgroundColor: 'rgba(99, 102, 241, 0.2)' }}
                        animate={{ opacity: 1, backgroundColor: 'transparent' }}
                        className="hover:bg-neo-bg-alt/30 transition-colors"
                      >
                        <td className="px-4 py-3 font-mono text-[10px] text-neo-text-dim whitespace-nowrap">
                          {new Date(res.timestamp).toLocaleTimeString()}
                        </td>
                        <td className="px-4 py-3 max-w-[200px] truncate text-neo-text" title={res.title || res.url}>
                          {res.title || res.url}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={res.success ? 'success' : 'danger'} size="sm">
                            {res.success ? 'OK' : 'ERR'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 font-mono text-neo-accent">
                          {res.success ? Object.keys(res.data).length : '-'} items
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
