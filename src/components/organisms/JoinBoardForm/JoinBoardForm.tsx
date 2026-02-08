'use client';

import React, { useState } from 'react';
import Input from '@/components/atoms/Input';
import Button from '@/components/atoms/Button';
import FormField from '@/components/molecules/FormField';

interface JoinBoardFormProps {
  onSubmit: (boardId: string) => void;
  disabled?: boolean;
}

export default function JoinBoardForm({
  onSubmit,
  disabled,
}: JoinBoardFormProps) {
  const [showForm, setShowForm] = useState(false);
  const [boardId, setBoardId] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!boardId.trim()) return;

    // Extract board ID from URL or use as-is
    let id = boardId.trim();
    if (id.includes('/board/')) {
      const match = id.match(/\/board\/([^/?]+)/);
      if (match) id = match[1];
    }

    onSubmit(id);
  };

  return (
    <div className="bg-white rounded-2xl shadow-2xl p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">
        🔗 Join Existing Board
      </h2>

      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-all border-2 border-dashed border-gray-300"
        >
          Have a board link or ID? Click here
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Board link or ID" htmlFor="boardId">
            <Input
              id="boardId"
              type="text"
              value={boardId}
              onChange={(e) => setBoardId(e.target.value)}
              placeholder="Paste board URL or ID..."
              className="text-sm"
              autoFocus
            />
          </FormField>
          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={disabled || !boardId.trim()}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              Join Board
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowForm(false);
                setBoardId('');
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}

      {/* How it works */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <h3 className="font-semibold text-gray-800 mb-2 text-sm">
          How it works:
        </h3>
        <ol className="space-y-1 text-xs text-gray-600">
          <li className="flex items-start">
            <span className="font-bold text-blue-600 mr-2">1.</span>
            <span>Writing: Add private notes</span>
          </li>
          <li className="flex items-start">
            <span className="font-bold text-blue-600 mr-2">2.</span>
            <span>Reveal: All notes become visible</span>
          </li>
          <li className="flex items-start">
            <span className="font-bold text-blue-600 mr-2">3.</span>
            <span>Voting: Vote on important items</span>
          </li>
          <li className="flex items-start">
            <span className="font-bold text-blue-600 mr-2">4.</span>
            <span>Discussion: Group and discuss</span>
          </li>
        </ol>
      </div>
    </div>
  );
}
