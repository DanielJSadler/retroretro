'use client';

import React, { useState } from 'react';
import { NoteColor } from '@/types';
import Input from '@/components/atoms/Input';
import Button from '@/components/atoms/Button';
import FormField from '@/components/molecules/FormField';
import ColorPicker, { sectionColors } from '@/components/molecules/ColorPicker';

interface SectionInput {
  id: string;
  name: string;
  color: NoteColor;
}

interface CreateBoardFormProps {
  onSubmit: (boardName: string, sections: SectionInput[]) => void;
  disabled?: boolean;
}

const defaultSections: SectionInput[] = [
  { id: 'section-1', name: 'What went well?', color: 'green' },
  { id: 'section-2', name: 'What could be better?', color: 'pink' },
  { id: 'section-3', name: 'Action items', color: 'blue' },
];

export default function CreateBoardForm({
  onSubmit,
  disabled,
}: CreateBoardFormProps) {
  const [boardName, setBoardName] = useState('');
  const [sections, setSections] = useState<SectionInput[]>(defaultSections);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (sections.filter((s) => s.name.trim()).length === 0) return;
    onSubmit(boardName, sections);
  };

  const addSection = () => {
    const colorIndex = sections.length % sectionColors.length;
    setSections([
      ...sections,
      {
        id: `section-${Date.now()}`,
        name: '',
        color: sectionColors[colorIndex].value,
      },
    ]);
  };

  const removeSection = (id: string) => {
    if (sections.length > 1) {
      setSections(sections.filter((s) => s.id !== id));
    }
  };

  const updateSection = (id: string, updates: Partial<SectionInput>) => {
    setSections(sections.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  };

  return (
    <div className="bg-white rounded-2xl shadow-2xl p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">
        ✨ Create New Board
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Board name" htmlFor="boardName">
          <Input
            id="boardName"
            type="text"
            value={boardName}
            onChange={(e) => setBoardName(e.target.value)}
            placeholder="Sprint 42 Retro"
            className="text-sm"
            maxLength={50}
          />
        </FormField>

        {/* Section Configuration */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Board sections
          </label>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {sections.map((section, index) => (
              <div key={section.id} className="flex items-center gap-2">
                <span className="text-gray-500 text-sm w-5">{index + 1}.</span>
                <input
                  type="text"
                  value={section.name}
                  onChange={(e) =>
                    updateSection(section.id, { name: e.target.value })
                  }
                  placeholder="Section name..."
                  className="flex-1 px-2 py-1.5 border text-black border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  maxLength={50}
                />
                <ColorPicker
                  value={section.color}
                  onChange={(color) => updateSection(section.id, { color })}
                />
                <button
                  type="button"
                  onClick={() => removeSection(section.id)}
                  disabled={sections.length <= 1}
                  className="text-gray-400 hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed text-sm"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addSection}
            className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            + Add section
          </button>
        </div>

        <Button
          type="submit"
          disabled={
            disabled || sections.filter((s) => s.name.trim()).length === 0
          }
          className="w-full py-3"
        >
          Create Board
        </Button>
      </form>
    </div>
  );
}

export type { SectionInput };
