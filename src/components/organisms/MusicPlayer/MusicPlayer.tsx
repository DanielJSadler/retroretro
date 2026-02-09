'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Id } from '../../../../convex/_generated/dataModel';

interface MusicPlayerProps {
  boardId: string;
  currentSong?: string;
  status?: 'playing' | 'paused';
  startedAt?: number;
  seekTime?: number;
}

export default function MusicPlayer({
  boardId,
  currentSong,
  status,
  startedAt,
  seekTime,
}: MusicPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const [selectedSong, setSelectedSong] = useState<string>("");

  const songs = useQuery(api.music.listSongs);
  const playMutation = useMutation(api.music.play);
  const pauseMutation = useMutation(api.music.pause);
  const nextMutation = useMutation(api.music.next);

  // Set default selected song when songs load
  useEffect(() => {
    if (songs && songs.length > 0 && !selectedSong) {
      setSelectedSong(songs[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [songs]); // Only run when songs load, not when selectedSong changes (to avoid loop/re-selection)

  const playAudio = async () => {
    try {
      if (audioRef.current) {
        await audioRef.current.play();
      }
    } catch (err) {
      console.warn("Autoplay failed:", err);
    }
  };

  // Sync with server state
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!currentSong) return;

    // Check if song changed
    const songPath = `/music/${encodeURIComponent(currentSong)}`;
    if (audio.getAttribute('src') !== songPath) {
      audio.src = songPath;
      audio.load();
    }

    if (status === 'playing' && startedAt) {
      const elapsed = (Date.now() - startedAt) / 1000;
      if (Math.abs(audio.currentTime - elapsed) > 1) {
        audio.currentTime = elapsed;
      }
      playAudio();
    } else if (status === 'paused' && seekTime !== undefined) {
      audio.currentTime = seekTime / 1000;
      audio.pause();
    }
  }, [currentSong, status, startedAt, seekTime]);

  // Handle Volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);



  const handleTogglePlay = async () => {
    if (!boardId) return;
    
    if (status === 'playing') {
      // Pause globally
      if (audioRef.current) {
        await pauseMutation({
          boardId: boardId as Id<"boards">,
          seekTime: Math.floor(audioRef.current.currentTime * 1000),
        });
      }
    } else {
      // Play globally
      await playMutation({
        boardId: boardId as Id<"boards">,
        seekTime: audioRef.current ? Math.floor(audioRef.current.currentTime * 1000) : 0,
      });
    }
  };

  const handleNext = async () => {
    if (!boardId) return;
    await nextMutation({ boardId: boardId as Id<"boards"> });
  };

  const handleEnded = () => {
    // When song ends, request next song
    // Only one client needs to do this really, but idempotent mutation handles it
    handleNext();
  };



  if (!currentSong) {
    return (
      <div className="p-4 border-t border-gray-200 space-y-3">
         <div>
           <label className="block text-xs font-medium text-gray-700 mb-1">Select Song</label>
           <select 
             value={selectedSong}
             onChange={(e) => setSelectedSong(e.target.value)}
             className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
             disabled={!songs}
           >
             {songs?.map((song) => (
               <option key={song} value={song}>
                 {song.replace('.mp3', '').split(' - ').pop()}
               </option>
             ))}
           </select>
         </div>
         <button 
           onClick={() => {
             if (boardId) {
               playMutation({ 
                 boardId: boardId as Id<"boards">,
                 song: selectedSong 
               });
             }
           }}
           className="w-full py-2 bg-blue-500 text-white rounded hover:bg-blue-600 font-medium transition-colors"
           disabled={!songs || !selectedSong}
         >
           Start Music
         </button>
      </div>
    );
  }

  return (
    <div className="p-4 border-t border-gray-200 bg-gray-50">
      <audio
        ref={audioRef}
        playsInline
        onEnded={handleEnded}
        onError={(e) => console.error("Audio error", e)}
      />
      
      <div className="mb-2 text-sm truncate font-medium text-gray-700" title={currentSong}>
        🎵 {currentSong.replace('.mp3', '').split(' - ').pop()}
      </div>

      <div className="flex items-center gap-2 mb-2">
        <button
          onClick={handleTogglePlay}
          className="p-2 rounded-full hover:bg-gray-200"
        >
          {status === 'playing' ? '⏸️' : '▶️'}
        </button>
        
        <button
          onClick={handleNext}
          className="p-2 rounded-full hover:bg-gray-200"
        >
          ⏭️
        </button>
        
        <div className="flex-1 flex items-center gap-2 ml-2">
           <button onClick={() => setIsMuted(!isMuted)} className="text-xs">
             {isMuted ? '🔇' : '🔊'}
           </button>
           <input
             type="range"
             min="0"
             max="1"
             step="0.05"
             value={volume}
             onChange={(e) => setVolume(parseFloat(e.target.value))}
             className="w-full h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer"
           />
        </div>
      </div>
    </div>
  );
}
