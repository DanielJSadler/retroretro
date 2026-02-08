'use client';

import React, { useState, useEffect } from 'react';

interface TimerProps {
  duration: number;
  startedAt?: number;
  isPaused: boolean;
  remainingTime?: number;
  onStart: (duration: number) => void;
  onPause: () => void;
  onReset: () => void;
}

export default function Timer({
  duration,
  startedAt,
  isPaused,
  remainingTime: serverRemainingTime,
  onStart,
  onPause,
  onReset,
}: TimerProps) {
  const [customDuration, setCustomDuration] = useState(5);
  const [remainingTime, setRemainingTime] = useState(0);

  useEffect(() => {
    if (startedAt && !isPaused) {
      const interval = setInterval(() => {
        const elapsed = Date.now() - startedAt;
        const remaining = Math.max(0, duration - elapsed);
        setRemainingTime(remaining);

        if (remaining === 0) {
          clearInterval(interval);
        }
      }, 100);

      return () => clearInterval(interval);
    } else if (isPaused && serverRemainingTime !== undefined) {
      setRemainingTime(serverRemainingTime);
    } else if (!startedAt) {
      setRemainingTime(0);
    }
  }, [startedAt, duration, isPaused, serverRemainingTime]);

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const isRunning = startedAt && !isPaused;
  const progress = duration > 0 ? (remainingTime / duration) * 100 : 0;
  const isLowTime = remainingTime > 0 && remainingTime < duration * 0.2;

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h3 className="text-lg font-semibold mb-3">Timer</h3>

      {!isRunning && remainingTime === 0 && (
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            Set Duration (minutes)
          </label>
          <input
            type="number"
            min="1"
            max="60"
            value={customDuration}
            onChange={(e) =>
              setCustomDuration(Math.max(1, parseInt(e.target.value) || 1))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      {(isRunning || remainingTime > 0) && (
        <div className="mb-4">
          <div
            className={`text-4xl font-bold text-center mb-2 ${
              isLowTime ? 'text-red-600 animate-pulse' : 'text-gray-800'
            }`}
          >
            {formatTime(remainingTime)}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                isLowTime ? 'bg-red-500' : 'bg-blue-500'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex gap-2">
        {!isRunning && remainingTime === 0 && (
          <button
            onClick={() => onStart(customDuration * 60 * 1000)}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            Start
          </button>
        )}

        {isRunning && (
          <button
            onClick={onPause}
            className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
          >
            Pause
          </button>
        )}

        {isPaused && remainingTime > 0 && (
          <button
            onClick={() => onStart(remainingTime)}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            Resume
          </button>
        )}

        {(isRunning || remainingTime > 0) && (
          <button
            onClick={onReset}
            className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            Reset
          </button>
        )}
      </div>

      {remainingTime === 0 && (isRunning || isPaused) && (
        <div className="mt-3 text-center text-red-600 font-semibold">
          Time&apos;s Up!
        </div>
      )}
    </div>
  );
}
