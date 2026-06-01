import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@shared/components';
import { useNeoCodex, type CodexEntry } from '@shared/hooks';

// ─── Entry Card ───────────────────────────────────────────────────────────────

const EntryCard: React.FC<{
  entry: CodexEntry;
  onDelete: (id: string) => void;
  showRelevance?: boolean;
}> = ({ entry, onDelete, showRelevance }) => {
  const date = new Date(entry.ts).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  const relevance = entry.distance !== undefined
    ? Math.round((1 - entry.distance) * 100)
    : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="rounded-lg px-3 py-2 group"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[10px] font-mono font-semibold text-neo-text truncate">{entry.title}</span>
            {showRelevance && relevance !== null && (
              <span
                className="text-[8px] font-mono px-1 rounded shrink-0"
                style={{
                  background: relevance > 75 ? 'rgba(52,211,153,0.15)' : 'rgba(99,102,241,0.15)',
                  color: relevance > 75 ? '#34d399' : '#818cf8',
                  border: `1px solid ${relevance > 75 ? 'rgba(52,211,153,0.3)' : 'rgba(99,102,241,0.3)'}`,
                }}
              >
                {relevance}% pertinent
              </span>
            )}
          </div>
          <p className="text-[9px] font-mono text-neo-text-dim leading-relaxed line-clamp-2">
            {entry.content}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[8px] font-mono text-neo-text-dim opacity-60">{date}</span>
            {entry.tags?.filter(Boolean).map((tag) => (
              <span key={tag} className="text-[7px] font-mono px-1 rounded"
                style={{ background: 'rgba(99,102,241,0.12)', color: '#8892b0' }}>
                {tag}
              </span>
            ))}
          </div>
        </div>
        <button
          onClick={() => onDelete(entry.id)}
          className="opacity-0 group-hover:opacity-100 shrink-0 text-[10px] text-neo-text-dim hover:text-neo-danger transition-all"
          title="Supprimer ce souvenir"
        >
          ✕
        </button>
      </div>
    </motion.div>
  );
};

// ─── Add Form ─────────────────────────────────────────────────────────────────

const AddForm: React.FC<{
  onAdd: (title: string, content: string, tags: string[]) => Promise<void>;
  onClose: () => void;
  isLoading: boolean;
}> = ({ onAdd, onClose, isLoading }) => {
  const [title, setTitle]     = useState('');
  const [content, setContent] = useState('');
  const [tagsRaw, setTagsRaw] = useState('');
  const titleRef              = useRef<HTMLInputElement>(null);

  useEffect(() => { titleRef.current?.focus(); }, []);

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) return;
    const tags = tagsRaw.split(',').map((t) => t.trim()).filter(Boolean);
    await onAdd(title, content, tags);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      className="mb-3 p-3 rounded-lg"
      style={{ background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.25)' }}
    >
      <p className="text-[9px] font-mono text-neo-text-dim mb-2">📝 Nouveau souvenir</p>
      <input
        ref={titleRef}
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value.slice(0, 60))}
        placeholder="Titre (ex: Config GPU, Projet Neo, Préférences...)"
        className="w-full bg-transparent text-[10px] font-mono outline-none text-neo-text placeholder-neo-text-dim px-2 py-1 rounded border border-neo-border mb-2"
        style={{ background: 'rgba(0,0,0,0.3)' }}
      />
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value.slice(0, 500))}
        placeholder="Contenu du souvenir (max 500 caractères)..."
        rows={3}
        className="w-full bg-transparent text-[10px] font-mono outline-none resize-none text-neo-text placeholder-neo-text-dim px-2 py-1 rounded border border-neo-border mb-2"
        style={{ background: 'rgba(0,0,0,0.3)' }}
      />
      <input
        type="text"
        value={tagsRaw}
        onChange={(e) => setTagsRaw(e.target.value)}
        placeholder="Tags (séparés par virgule, ex: gpu,config,hardware)"
        className="w-full bg-transparent text-[9px] font-mono outline-none text-neo-text placeholder-neo-text-dim px-2 py-1 rounded border border-neo-border mb-2"
        style={{ background: 'rgba(0,0,0,0.3)' }}
        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
      />
      <div className="flex justify-between items-center">
        <span className="text-[8px] font-mono text-neo-text-dim">
          {content.length}/500 caractères
        </span>
        <div className="flex gap-2">
          <button onClick={onClose}
            className="text-[9px] font-mono px-2 py-1 rounded border border-neo-border text-neo-text-dim hover:text-neo-text transition-colors">
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={!title.trim() || !content.trim() || isLoading}
            className="text-[9px] font-mono px-3 py-1 rounded transition-all"
            style={{
              background: title.trim() && content.trim() ? 'rgba(99,102,241,0.7)' : 'rgba(99,102,241,0.2)',
              color: title.trim() && content.trim() ? 'white' : '#8892b0',
              border: '1px solid rgba(99,102,241,0.4)',
              cursor: title.trim() && content.trim() ? 'pointer' : 'not-allowed',
            }}
          >
            {isLoading ? '⟳' : '✦ Mémoriser'}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// ─── Main NeoCodex ────────────────────────────────────────────────────────────

export const NeoCodex: React.FC = () => {
  const {
    entries, searchResults, status, isLoading, isSearching, chromaAvailable,
    addEntry, deleteEntry, searchEntries, clearSearch, clearAll, reindex,
  } = useNeoCodex();

  const [showForm, setShowForm]     = useState(false);
  const [searchQ, setSearchQ]       = useState('');
  const [showConfirm, setConfirm]   = useState(false);
  const searchTimer                 = useRef<ReturnType<typeof setTimeout>>();

  // Debounced semantic search
  const handleSearchChange = useCallback((q: string) => {
    setSearchQ(q);
    clearTimeout(searchTimer.current);
    if (!q.trim()) { clearSearch(); return; }
    searchTimer.current = setTimeout(() => searchEntries(q), 500);
  }, [searchEntries, clearSearch]);

  const handleDelete = useCallback(async (id: string) => {
    await deleteEntry(id);
  }, [deleteEntry]);

  const handleClearAll = useCallback(async () => {
    await clearAll();
    setConfirm(false);
  }, [clearAll]);

  const displayEntries = searchQ.trim() ? searchResults : entries;
  const isSearchMode = searchQ.trim().length > 0;

  return (
    <Card variant="glass" padding="lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-mono text-neo-text-dim tracking-wider">📚 CODEX SÉMANTIQUE</h3>
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded"
            style={{ background: 'rgba(99,102,241,0.12)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.2)' }}>
            {entries.length} entrée{entries.length !== 1 ? 's' : ''}
          </span>
          {/* ChromaDB status indicator */}
          <span
            className="text-[8px] font-mono px-1.5 py-0.5 rounded"
            style={{
              background: chromaAvailable ? 'rgba(52,211,153,0.1)' : 'rgba(251,191,36,0.1)',
              color: chromaAvailable ? '#34d399' : '#fbbf24',
              border: `1px solid ${chromaAvailable ? 'rgba(52,211,153,0.3)' : 'rgba(251,191,36,0.3)'}`,
            }}
            title={chromaAvailable
              ? `Vector DB — ${status?.n_entries ?? 0} vecteurs — ${status?.embed_model ?? 'nomic-embed-text'}`
              : 'ChromaDB non disponible — mode fallback (chrome.storage)'}
          >
            {chromaAvailable ? '🟢 Vector DB' : '🟡 Fallback'}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {chromaAvailable && entries.length > 0 && (
            <button
              onClick={reindex}
              disabled={isLoading}
              className="text-[8px] font-mono text-neo-text-dim hover:text-neo-accent transition-colors px-1.5 py-0.5 rounded border border-neo-border"
              title="Régénérer les embeddings (migration modèle)"
            >
              ↻ Reindex
            </button>
          )}
          {entries.length > 0 && !showConfirm && (
            <button
              onClick={() => setConfirm(true)}
              className="text-[8px] font-mono text-neo-text-dim hover:text-neo-danger transition-colors"
              title="Effacer tout le Codex"
            >
              CLEAR
            </button>
          )}
          {showConfirm && (
            <div className="flex items-center gap-1">
              <span className="text-[8px] font-mono text-neo-danger">Confirmer ?</span>
              <button onClick={handleClearAll} className="text-[8px] font-mono px-1.5 py-0.5 rounded"
                style={{ background: 'rgba(239,68,68,0.2)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.4)' }}>
                Oui
              </button>
              <button onClick={() => setConfirm(false)} className="text-[8px] font-mono text-neo-text-dim">Non</button>
            </div>
          )}
          <button
            onClick={() => setShowForm((s) => !s)}
            className="text-[9px] font-mono px-2 py-0.5 rounded transition-all"
            style={{
              background: showForm ? 'rgba(99,102,241,0.3)' : 'rgba(99,102,241,0.1)',
              color: '#818cf8',
              border: '1px solid rgba(99,102,241,0.4)',
            }}
          >
            {showForm ? '✕ Fermer' : '+ Mémoriser'}
          </button>
        </div>
      </div>

      {/* Add Form */}
      <AnimatePresence>
        {showForm && (
          <AddForm
            onAdd={addEntry}
            onClose={() => setShowForm(false)}
            isLoading={isLoading}
          />
        )}
      </AnimatePresence>

      {/* Search Bar */}
      <div className="relative mb-3">
        <input
          type="text"
          value={searchQ}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder={chromaAvailable
            ? '🔍 Recherche sémantique... (ex: "config GPU", "projet Neo")'
            : '🔍 Rechercher dans les titres...'}
          className="w-full bg-transparent text-[10px] font-mono outline-none text-neo-text placeholder-neo-text-dim px-3 py-1.5 rounded-lg border border-neo-border"
          style={{ background: 'rgba(0,0,0,0.3)' }}
        />
        {isSearching && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[8px] font-mono text-neo-accent animate-pulse">
            vectorisation...
          </span>
        )}
        {searchQ && !isSearching && (
          <button
            onClick={() => { setSearchQ(''); clearSearch(); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-neo-text-dim hover:text-neo-text"
          >✕</button>
        )}
      </div>

      {/* Entry List */}
      <div className="space-y-1.5 overflow-y-auto pr-1" style={{ maxHeight: '260px', scrollbarWidth: 'thin' }}>
        {isSearchMode && searchResults.length === 0 && !isSearching && (
          <div className="text-center py-6 text-[10px] font-mono text-neo-text-dim">
            Aucun souvenir sémantiquement similaire trouvé.
          </div>
        )}

        {!isSearchMode && entries.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
            <span className="text-2xl opacity-30">📚</span>
            <p className="text-[10px] font-mono text-neo-text-dim">
              Le Codex est vide.<br />
              Mémorise des informations pour que Neo les utilise lors de ses réponses.
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-1 text-[9px] font-mono px-2 py-1 rounded"
              style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', color: '#818cf8' }}
            >
              + Ajouter un premier souvenir
            </button>
          </div>
        )}

        <AnimatePresence initial={false}>
          {displayEntries.map((entry) => (
            <EntryCard
              key={entry.id}
              entry={entry}
              onDelete={handleDelete}
              showRelevance={isSearchMode}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Footer */}
      {entries.length > 0 && (
        <p className="text-[8px] font-mono text-neo-text-dim text-center mt-2 opacity-60">
          Neo consulte le Codex sémantiquement à chaque requête AI ✦
        </p>
      )}
    </Card>
  );
};
