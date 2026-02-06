import React from 'react';
import { nowISO } from '../utils/helpers';

export default function MetaPanel({ node, onChange }) {
  if (!node || node.type !== 'chapter') {
    return (
      <div className="p-3 text-sm opacity-60">Select a chapter to edit metadata.</div>
    );
  }

  const update = (patch) => onChange({ ...node, ...patch, updatedAt: nowISO() });
  const setTags = (csv) => update({ tags: csv.split(',').map(t => t.trim()).filter(Boolean) });

  return (
    <div className="p-3 space-y-2">
      <div>
        <div className="text-xs opacity-60">Synopsis</div>
        <textarea
          className="w-full h-24 rounded bg-neutral-100 dark:bg-neutral-900 p-2"
          value={node.synopsis || ''}
          onChange={e => update({ synopsis: e.target.value })}
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <div className="text-xs opacity-60">Status</div>
          <select
            className="w-full rounded bg-neutral-100 dark:bg-neutral-900 p-2"
            value={node.status || 'Draft'}
            onChange={e => update({ status: e.target.value })}
          >
            {['Idea', 'Draft', 'Revised', 'Final'].map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <div className="text-xs opacity-60">POV</div>
          <input
            className="w-full rounded bg-neutral-100 dark:bg-neutral-900 p-2"
            value={node.pov || ''}
            onChange={e => update({ pov: e.target.value })}
          />
        </div>
      </div>
      <div>
        <div className="text-xs opacity-60">Tags (comma-separated)</div>
        <input
          className="w-full rounded bg-neutral-100 dark:bg-neutral-900 p-2"
          value={(node.tags || []).join(', ')}
          onChange={e => setTags(e.target.value)}
        />
      </div>
      <div className="text-xs opacity-60">
        Created: {new Date(node.createdAt).toLocaleString()} • Updated: {new Date(node.updatedAt).toLocaleString()}
      </div>
    </div>
  );
}
