

'use client';

import React, { useState, useEffect } from 'react';
import { levels } from './levels/levels';
import { Position, GameStatus } from './maze-objects/maze';

interface Command {
  direction: 'up' | 'down' | 'left' | 'right';
  steps: number;
}

function parseCode(code: string): Command[] {
  // Supports moveRight(1), moveLeft(1), turnLeft(1), etc.
  const regex = /(?:move|turn)(Up|Down|Left|Right)\s*\(\s*(\d+)\s*\)/gi;
  const commands: Command[] = [];
  let match;
  while ((match = regex.exec(code)) !== null) {
    commands.push({
      direction: match[1].toLowerCase() as any,
      steps: parseInt(match[2], 10),
    });
  }
  return commands;
}

export default function MazeGame() {
  const [currentLevelIdx, setCurrentLevelIdx] = useState(0);
  const [code, setCode] = useState('');
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [status, setStatus] = useState<GameStatus>('idle');
  const [message, setMessage] = useState('');

  const currentMaze = levels[currentLevelIdx];

  useEffect(() => {
    // Reset position when level changes
    setPosition(currentMaze.startPos);
    setStatus('idle');
    setMessage('');
  }, [currentLevelIdx, currentMaze]);

  const handleRun = async () => {
    if (status === 'playing') return;
    setStatus('playing');
    setMessage('');

    const commands = parseCode(code);
    if (commands.length === 0) {
      setMessage('No valid commands found. Try: moveRight(1), turnDown(2), etc.');
      setStatus('idle');
      return;
    }

    let currPos = { ...currentMaze.startPos };
    setPosition(currPos); // Start from beginning

    for (const cmd of commands) {
      for (let i = 0; i < cmd.steps; i++) {
        // Wait for animation
        await new Promise(resolve => setTimeout(resolve, 300));
        
        let nextPos = { ...currPos };
        if (cmd.direction === 'up') nextPos.y -= 1;
        if (cmd.direction === 'down') nextPos.y += 1;
        if (cmd.direction === 'left') nextPos.x -= 1;
        if (cmd.direction === 'right') nextPos.x += 1;

        if (currentMaze.isWall(nextPos.x, nextPos.y)) {
          setStatus('lost');
          setMessage('Ouch! You hit a wall or fell off. Try adjusting your code and clicking Reset.');
          return;
        }

        currPos = nextPos;
        setPosition(currPos);

        if (currentMaze.isEnd(currPos.x, currPos.y)) {
          setStatus('won');
          setMessage('You escaped!');
          return;
        }
      }
    }

    if (!currentMaze.isEnd(currPos.x, currPos.y)) {
      setStatus('lost');
      setMessage('You finished all commands but did not reach the end. Try again!');
    }
  };

  const handleReset = () => {
    setPosition(currentMaze.startPos);
    setStatus('idle');
    setMessage('');
  };

  const nextLevel = () => {
    if (currentLevelIdx < levels.length - 1) {
      setCurrentLevelIdx(cur => cur + 1);
      setCode('');
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 w-full text-slate-800 dark:text-slate-200">
      <h1 className="text-3xl font-bold">Maze Level {currentLevelIdx + 1}</h1>
      
      {/* Maze Grid */}
      <div 
        className="grid gap-1 bg-slate-300 dark:bg-slate-700 p-2 border-4 border-slate-400 dark:border-slate-600 rounded"
        style={{
          gridTemplateColumns: `repeat(${currentMaze.width}, minmax(0, 1fr))`
        }}
      >
        {currentMaze.grid.map((row, y) => (
          row.map((cell, x) => {
            const isCharacter = position.x === x && position.y === y;
            let bgColor = 'bg-slate-100 dark:bg-slate-800';
            if (cell === 'wall') bgColor = 'bg-slate-800 dark:bg-slate-900';
            else if (cell === 'start') bgColor = 'bg-green-200 dark:bg-green-800';
            else if (cell === 'end') bgColor = 'bg-red-300 dark:bg-red-800';
            
            return (
              <div 
                key={`${x}-${y}`} 
                className={`w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center ${bgColor} ${isCharacter ? 'relative' : ''}`}
              >
                {isCharacter && (
                  <div className="w-6 h-6 bg-blue-500 rounded-full shadow-md z-10 transition-all"></div>
                )}
              </div>
            );
          })
        ))}
      </div>

      <div className="w-full max-w-lg flex flex-col gap-3">
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Enter commands here e.g.:\nturnRight(2)\nturnDown(3)\nmoveRight(1)\n..."
          className="w-full h-40 p-3 font-mono text-sm border-2 rounded focus:outline-none focus:border-blue-500 shadow-inner dark:bg-slate-900 dark:border-slate-700"
          disabled={status === 'playing'}
        />
        
        <div className="flex gap-4">
          <button 
            onClick={handleRun}
            disabled={status === 'playing'}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:bg-slate-400"
          >
            Run Code
          </button>
          <button 
            onClick={handleReset}
            disabled={status === 'playing'}
            className="flex-1 bg-slate-200 hover:bg-slate-300 dark:bg-slate-600 dark:hover:bg-slate-500 text-slate-800 dark:text-slate-100 font-bold py-2 px-4 rounded disabled:opacity-50"
          >
            Reset
          </button>
        </div>

        {message && (
          <div className={`p-4 rounded font-semibold text-center ${status === 'won' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
            {message}
          </div>
        )}

        {status === 'won' && currentLevelIdx < levels.length - 1 && (
          <button 
            onClick={nextLevel}
            className="mt-2 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
          >
            Next Level
          </button>
        )}
        {status === 'won' && currentLevelIdx === levels.length - 1 && (
          <div className="text-center font-bold text-xl mt-4 text-purple-600 dark:text-purple-400">
            Congratulations! You have completed all levels!
          </div>
        )}
      </div>
    </div>
  );
}