'use client';

import React, { useState, useEffect } from 'react';
import { NoteColor, Section } from '@/types';

interface NoteCreatorProps {
  sections: Section[];
  onCreateNote: (content: string, color: NoteColor, sectionId: string) => void;
}

export default function NoteCreator({
  sections,
  onCreateNote,
}: NoteCreatorProps) {
  const [content, setContent] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState<string>(
    sections[0]?.id || '',
  );

  // Update selected section if sections change
  useEffect(() => {
    if (
      sections.length > 0 &&
      !sections.find((s) => s.id === selectedSectionId)
    ) {
      setSelectedSectionId(sections[0].id);
    }
  }, [sections, selectedSectionId]);

  const selectedSection = sections.find((s) => s.id === selectedSectionId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim() && selectedSectionId) {
      onCreateNote(
        content,
        selectedSection?.color || 'yellow',
        selectedSectionId,
      );
      setContent('');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h3 className="text-lg font-semibold mb-3">Add Note</h3>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Section selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Section
          </label>
          <select
            value={selectedSectionId}
            onChange={(e) => setSelectedSectionId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
          >
            {sections.map((section) => (
              <option key={section.id} value={section.id}>
                {section.name}
              </option>
            ))}
          </select>
        </div>

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={
            selectedSection
              ? `Add a note to "${selectedSection.name}"...`
              : 'Add a note...'
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
        />

        <button
          type="submit"
          disabled={!content.trim() || !selectedSectionId}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          Add Note
        </button>
      </form>
    </div>
  );
}
