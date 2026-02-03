'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { NoteColor } from '@/types';

const sectionColors: { value: NoteColor; class: string }[] = [
  { value: 'green', class: 'bg-green-200' },
  { value: 'pink', class: 'bg-pink-200' },
  { value: 'blue', class: 'bg-blue-200' },
  { value: 'yellow', class: 'bg-yellow-200' },
  { value: 'red', class: 'bg-red-200' },
];

interface SectionInput {
  id: string;
  name: string;
  color: NoteColor;
}

export default function Home() {
  const [name, setName] = useState('');
  const [sections, setSections] = useState<SectionInput[]>([
    { id: 'section-1', name: 'What went well?', color: 'green' },
    { id: 'section-2', name: 'What could be better?', color: 'pink' },
    { id: 'section-3', name: 'Action items', color: 'blue' },
  ]);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && sections.filter(s => s.name.trim()).length > 0) {
      localStorage.setItem('userName', name.trim());
      
      // Store sections to be used when creating session
      const validSections = sections
        .filter(s => s.name.trim())
        .map((s, index) => ({
          id: `section-${Date.now()}-${index}`,
          name: s.name.trim(),
          color: s.color,
        }));
      localStorage.setItem('boardSections', JSON.stringify(validSections));
      
      router.push('/board');
    }
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
    setSections(
      sections.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Retro Board</h1>
          <p className="text-gray-600">
            Collaborate on your team retrospective
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Your name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-4 py-3 border text-black border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
              maxLength={30}
            />
          </div>

          {/* Section Configuration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Board sections
            </label>
            <div className="space-y-2 max-h-60 overflow-y-auto">
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
                    className="flex-1 px-3 py-2 border text-black border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    maxLength={50}
                  />
                  <div className="flex gap-1">
                    {sectionColors.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() =>
                          updateSection(section.id, { color: color.value })
                        }
                        className={`w-6 h-6 rounded transition-all ${color.class} ${
                          section.color === color.value
                            ? 'ring-2 ring-gray-800 scale-110'
                            : 'ring-1 ring-gray-300 hover:scale-105'
                        }`}
                      />
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeSection(section.id)}
                    disabled={sections.length <= 1}
                    className="text-gray-400 hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed"
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
              + Add another section
            </button>
          </div>

          <button
            type="submit"
            disabled={!name.trim() || sections.filter(s => s.name.trim()).length === 0}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all transform hover:scale-105 disabled:hover:scale-100"
          >
            Create & Join Board
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <h2 className="font-semibold text-gray-800 mb-3">How it works:</h2>
          <ol className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start">
              <span className="font-bold text-blue-600 mr-2">1.</span>
              <span>Writing phase: Add private notes</span>
            </li>
            <li className="flex items-start">
              <span className="font-bold text-blue-600 mr-2">2.</span>
              <span>Reveal phase: All notes become visible</span>
            </li>
            <li className="flex items-start">
              <span className="font-bold text-blue-600 mr-2">3.</span>
              <span>Voting phase: Vote on important items</span>
            </li>
            <li className="flex items-start">
              <span className="font-bold text-blue-600 mr-2">4.</span>
              <span>Discussion phase: Group and discuss</span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
