'use client';

import React, { useState, useEffect, useRef } from 'react';
import { levels } from './levels/levels';
import { Position, GameStatus } from './maze-objects/maze';
import { useSearchParams } from 'next/navigation';

interface Command {
  direction: 'up' | 'down' | 'left' | 'right';
  steps: number;
}

function parseCode(code: string): Command[] {
  // Supports moveRight(1), up(), turnLeft(1), etc.
  const regex = /(?:move|turn)?(Up|Down|Left|Right)\s*\(\s*(\d*)\s*\)/gi;
  const commands: Command[] = [];
  let match;
  while ((match = regex.exec(code)) !== null) {
    commands.push({
      direction: match[1].toLowerCase() as any,
      steps: match[2] ? parseInt(match[2], 10) : 1,
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
  const [trail, setTrail] = useState<Position[]>([]);
  const [runningCmdIdx, setRunningCmdIdx] = useState<number | null>(null);
  const [commandsToRun, setCommandsToRun] = useState<Command[]>([]);
  const codeRef = useRef<HTMLTextAreaElement>(null);

  const urlParams = useSearchParams();
  const group = Number(urlParams.get('group'));

  const currentMaze = levels[currentLevelIdx];

  useEffect(() => {
    // Reset position when level changes
    setPosition(currentMaze.startPos);
    setStatus('idle');
    setMessage('');
    setTrail([]);
    setRunningCmdIdx(null);
    setCommandsToRun([]);
  }, [currentLevelIdx, currentMaze]);

  const handleRun = async () => {
    if (status === 'playing') return;
    setStatus('playing');
    setMessage('');
    setTrail([]);
    setRunningCmdIdx(null);

    const commands = parseCode(code);
    setCommandsToRun(commands);
    if (commands.length === 0) {
      setMessage('No valid commands found. Try: right(), down(2), etc.');
      setStatus('idle');
      return;
    }

    let currPos = { ...currentMaze.startPos };
    setPosition(currPos); // Start from beginning
    setTrail([{...currPos}]);

    for (let cmdIdx = 0; cmdIdx < commands.length; cmdIdx++) {
      const cmd = commands[cmdIdx];
      setRunningCmdIdx(cmdIdx);
      for (let i = 0; i < cmd.steps; i++) {
        // Wait for animation
        await new Promise(resolve => setTimeout(resolve, 75));
        
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
        setTrail(prev => {
          if (!prev.some(p => p.x === currPos.x && p.y === currPos.y)) {
            return [...prev, { ...currPos }];
          }
          return prev;
        });

        if (currentMaze.isEnd(currPos.x, currPos.y)) {
            console.log(group);
          setStatus('won');
          if (group === 1) {
                if (currentLevelIdx === 1) {
                    setMessage('You escaped! Your first code is 7!');
                } else if (currentLevelIdx === 3) {
                    setMessage ('You escaped! Your second code is 6!')
                } else if (currentLevelIdx === 5) {
                    setMessage('You escaped! Your third code is 4!');
                } else if (currentLevelIdx === 6) {
                  setMessage('You escaped! Your fourth code is 2!');
                } else {
                    setMessage('You escaped!');
                }
            } else if (group === 2) {
                if (currentLevelIdx === 1) {
                    setMessage('You escaped! Your first code is 2!');
                } else if (currentLevelIdx === 3) {
                    setMessage ('You escaped! Your second code is 5!')
                } else if (currentLevelIdx === 5) {
                    setMessage('You escaped! Your third code is 0!');
                } else if (currentLevelIdx === 6) {
                  setMessage('You escaped! Your fourth code is 1!');
                } else {
                    setMessage('You escaped!');
                }
            } else if (group === 3) {
                if (currentLevelIdx === 1) {
                    setMessage('You escaped! Your first code is 5!');
                } else if (currentLevelIdx === 3) {
                    setMessage ('You escaped! Your second code is 8!')
                } else if (currentLevelIdx === 5) {
                    setMessage('You escaped! Your third code is 9!');
                } else if (currentLevelIdx === 6) {
                  setMessage('You escaped! Your fourth code is 6!');
                } else {
                    setMessage('You escaped!');
                }
            }
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
    setTrail([]);
    setRunningCmdIdx(null);
    setCommandsToRun([]);
  };

  const insertCommand = (cmdStr: string) => {
    if (!codeRef.current) return;
    const start = codeRef.current.selectionStart;
    const end = codeRef.current.selectionEnd;
    const currentCode = code;
    
    let textToInsert = cmdStr;
    const needsNewlineBefore = start > 0 && currentCode[start - 1] !== '\n';
    if (needsNewlineBefore) {
      textToInsert = '\n' + textToInsert;
    }
    
    const newCode = currentCode.substring(0, start) + textToInsert + currentCode.substring(end);
    setCode(newCode);
    
    setTimeout(() => {
      if (codeRef.current) {
        codeRef.current.focus();
        const cursorPosition = start + textToInsert.length - 1;
        codeRef.current.setSelectionRange(cursorPosition, cursorPosition);
      }
    }, 0);
  };

  const nextLevel = () => {
    if (currentLevelIdx < levels.length - 1) {
      setCurrentLevelIdx(cur => cur + 1);
      setCode('');
    }
  };

  const unlockedDigits = (() => {
    let digits = ['-', '-', '-', '-'];
    const unlockIndex1 = currentLevelIdx > 1 || (currentLevelIdx === 1 && status === 'won');
    const unlockIndex2 = currentLevelIdx > 3 || (currentLevelIdx === 3 && status === 'won');
    const unlockIndex3 = currentLevelIdx > 5 || (currentLevelIdx === 5 && status === 'won');
    const unlockIndex4 = currentLevelIdx > 6 || (currentLevelIdx === 6 && status === 'won');

    if (group === 1) {
      if (unlockIndex1) digits[0] = '7';
      if (unlockIndex2) digits[1] = '6';
      if (unlockIndex3) digits[2] = '4';
      if (unlockIndex4) digits[3] = '2';
    } else if (group === 2) {
      if (unlockIndex1) digits[0] = '2';
      if (unlockIndex2) digits[1] = '5';
      if (unlockIndex3) digits[2] = '0';
      if (unlockIndex4) digits[3] = '1';
    } else if (group === 3) {
      if (unlockIndex1) digits[0] = '5';
      if (unlockIndex2) digits[1] = '8';
      if (unlockIndex3) digits[2] = '9';
      if (unlockIndex4) digits[3] = '6';
    }
    return digits;
  })();

  return (
    <div className="flex flex-col items-center gap-6 w-full text-slate-800 dark:text-slate-200">
      <h1 className="text-3xl font-bold">Maze Level {currentLevelIdx + 1} of {levels.length}</h1>
      
      {/* Digit Counter */}
      {[1, 2, 3].includes(group) && (
        <div className="flex flex-col items-center gap-2">
          <div className="text-sm font-semibold uppercase tracking-wider text-slate-500">Access Code</div>
          <div className="flex gap-4 text-3xl font-mono font-bold bg-slate-200 dark:bg-slate-800 p-4 rounded-xl shadow-inner">
            {unlockedDigits.map((digit, i) => (
              <div key={i} className={`w-14 h-16 flex items-center justify-center rounded-lg border-2 shadow-sm ${digit !== '-' ? 'border-green-500 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30' : 'border-slate-300 dark:border-slate-700 text-slate-400 dark:text-slate-600 bg-slate-100 dark:bg-slate-800/50'}`}>
                {digit}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Maze Grid */}
      <div 
        className="grid gap-[2px] bg-slate-300 dark:bg-slate-700 p-2 border-4 border-slate-400 dark:border-slate-600 rounded w-full max-w-2xl"
        style={{
          gridTemplateColumns: `repeat(${currentMaze.width}, minmax(0, 1fr))`
        }}
      >
        {currentMaze.grid.map((row, y) => (
          row.map((cell, x) => {
            const isCharacter = position.x === x && position.y === y;
            const isTrailCell = trail.some(p => p.x === x && p.y === y);
            let bgColor = 'bg-slate-100 dark:bg-slate-800';
            if (cell === 'wall') bgColor = 'bg-slate-800 dark:bg-slate-900';
            else if (cell === 'start') bgColor = 'bg-green-200 dark:bg-green-800';
            else if (cell === 'end') bgColor = 'bg-red-300 dark:bg-red-800';
            
            return (
              <div 
                key={`${x}-${y}`} 
                className={`w-full aspect-square flex items-center justify-center ${bgColor} ${isCharacter ? 'relative' : ''}`}
              >
                {isTrailCell && !isCharacter && cell !== 'start' && cell !== 'end' && (
                  <div className="w-1/3 h-1/3 bg-blue-300/50 dark:bg-blue-600/50 rounded-full"></div>
                )}
                {isCharacter && (
                  <div className="w-1/2 h-1/2 bg-blue-500 rounded-full shadow-md z-10 transition-all"></div>
                )}
              </div>
            );
          })
        ))}
      </div>

      <div className="w-full max-w-lg flex flex-col gap-3">
        <div className="flex gap-2">
          <button onClick={() => insertCommand('up()')} disabled={status === 'playing'} className="flex-1 bg-slate-200 dark:bg-slate-700 text-sm font-bold py-1.5 rounded hover:bg-slate-300 dark:hover:bg-slate-600 disabled:opacity-50">Up()</button>
          <button onClick={() => insertCommand('down()')} disabled={status === 'playing'} className="flex-1 bg-slate-200 dark:bg-slate-700 text-sm font-bold py-1.5 rounded hover:bg-slate-300 dark:hover:bg-slate-600 disabled:opacity-50">Down()</button>
          <button onClick={() => insertCommand('left()')} disabled={status === 'playing'} className="flex-1 bg-slate-200 dark:bg-slate-700 text-sm font-bold py-1.5 rounded hover:bg-slate-300 dark:hover:bg-slate-600 disabled:opacity-50">Left()</button>
          <button onClick={() => insertCommand('right()')} disabled={status === 'playing'} className="flex-1 bg-slate-200 dark:bg-slate-700 text-sm font-bold py-1.5 rounded hover:bg-slate-300 dark:hover:bg-slate-600 disabled:opacity-50">Right()</button>
        </div>
        
        <textarea
          ref={codeRef}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Enter commands here e.g.:\nright(2)\ndown(3)\nup()\n..."
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

        {status === 'playing' && commandsToRun.length > 0 && runningCmdIdx !== null && (
          <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded text-sm font-mono flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            Currently running: {commandsToRun[runningCmdIdx].direction}({commandsToRun[runningCmdIdx].steps})
          </div>
        )}

        {status === 'lost' && runningCmdIdx !== null && commandsToRun[runningCmdIdx] && (
          <div className="p-3 bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200 rounded text-sm font-mono flex flex-col items-center gap-1 font-semibold text-center">
            <span>Failed on command: {commandsToRun[runningCmdIdx].direction}({commandsToRun[runningCmdIdx].steps})</span>
            <span className="text-xs font-normal opacity-80">{message}</span>
          </div>
        )}

        {status !== 'playing' && status !== 'lost' && message && (
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