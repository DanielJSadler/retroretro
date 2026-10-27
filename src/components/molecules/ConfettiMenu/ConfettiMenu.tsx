import React from 'react';
import Button from '@/components/atoms/Button';

interface ConfettiMenuProps {
  isActive: boolean;
  onToggle: () => void;
  currentType: 'basic' | 'stars' | 'fireworks' | 'random';
  onTypeChange: (type: 'basic' | 'stars' | 'fireworks' | 'random') => void;
}

const types = [
  { id: 'basic', label: '🎉 Basic' },
  { id: 'stars', label: '⭐ Stars' },
  { id: 'fireworks', label: '🎆 Fireworks' },
  { id: 'random', label: '🎲 Random' },
] as const;

export default function ConfettiMenu({ isActive, onToggle, currentType, onTypeChange }: ConfettiMenuProps) {
  return (
    <div className="fixed bottom-2 sm:bottom-6 max-w-[calc(100%-1.5rem)] flex-wrap justify-center left-1/2 transform -translate-x-1/2 bg-white rounded-full shadow-xl p-2 z-50 flex items-center gap-2 border border-blue-100">
      <Button
        onClick={onToggle}
        size="sm"
        variant={isActive ? 'primary' : 'secondary'}
        className={`rounded-full px-4 ${isActive ? 'bg-gradient-to-r from-pink-500 to-purple-500 border-none' : ''}`}
      >
        {isActive ? '✨ Confetti Mode ON' : '🎈 Confetti Mode'}
      </Button>

      {isActive && (
        <div className="flex flex-wrap justify-center gap-1 border-l pl-2 ml-2">
          {types.map((type) => (
            <button
              key={type.id}
              onClick={() => onTypeChange(type.id)}
              className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                currentType === type.id
                  ? 'bg-purple-100 text-purple-700 font-medium'
                  : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
