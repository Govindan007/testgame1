import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';

const GRID_SIZE = 20;
const INITIAL_SNAKE = [{ x: 10, y: 10 }];
const INITIAL_DIRECTION = { x: 0, y: -1 };
const INITIAL_SPEED = 150;

type Point = { x: number; y: number };
type GameState = 'IDLE' | 'PLAYING' | 'PAUSED' | 'GAME_OVER';

const generateFood = (snake: Point[]): Point => {
  let newFood: Point;
  while (true) {
    newFood = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
    // eslint-disable-next-line no-loop-func
    const isOnSnake = snake.some((segment) => segment.x === newFood.x && segment.y === newFood.y);
    if (!isOnSnake) break;
  }
  return newFood;
};

export default function App() {
  const [snake, setSnake] = useState<Point[]>(INITIAL_SNAKE);
  const [direction, setDirection] = useState<Point>(INITIAL_DIRECTION);
  const [food, setFood] = useState<Point>({ x: 5, y: 5 });
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameState, setGameState] = useState<GameState>('IDLE');
  
  // Use a ref to store the latest direction to prevent rapid double-keypress self-collision
  const directionRef = useRef(INITIAL_DIRECTION);

  useEffect(() => {
    const storedHighScore = localStorage.getItem('snakeHighScore');
    if (storedHighScore) {
      setHighScore(parseInt(storedHighScore, 10));
    }
    setFood(generateFood(INITIAL_SNAKE));
  }, []);

  const handleGameOver = useCallback(() => {
    setGameState('GAME_OVER');
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('snakeHighScore', score.toString());
    }
  }, [score, highScore]);

  const moveSnake = useCallback(() => {
    if (gameState !== 'PLAYING') return;

    setSnake((prevSnake) => {
      const head = prevSnake[0];
      const currentDirection = directionRef.current;
      const newHead = {
        x: head.x + currentDirection.x,
        y: head.y + currentDirection.y,
      };

      // Check wall collision
      if (
        newHead.x < 0 ||
        newHead.x >= GRID_SIZE ||
        newHead.y < 0 ||
        newHead.y >= GRID_SIZE
      ) {
        handleGameOver();
        return prevSnake;
      }

      // Check self collision
      if (prevSnake.some((segment) => segment.x === newHead.x && segment.y === newHead.y)) {
        handleGameOver();
        return prevSnake;
      }

      const newSnake = [newHead, ...prevSnake];

      // Check food collision
      if (newHead.x === food.x && newHead.y === food.y) {
        setScore((s) => s + 10);
        setFood(generateFood(newSnake));
        // Don't pop the tail, so it grows
      } else {
        newSnake.pop(); // Remove tail if no food eaten
      }

      return newSnake;
    });
  }, [gameState, food, handleGameOver]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default scrolling for arrow keys and space
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      if (gameState !== 'PLAYING') {
        if (e.key === ' ' && (gameState === 'IDLE' || gameState === 'GAME_OVER')) {
            startGame();
        } else if (e.key === ' ' && gameState === 'PAUSED') {
            setGameState('PLAYING');
        }
        return;
      }

      const currentDir = directionRef.current;
      let newDir = currentDir;

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          if (currentDir.y !== 1) newDir = { x: 0, y: -1 };
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          if (currentDir.y !== -1) newDir = { x: 0, y: 1 };
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          if (currentDir.x !== 1) newDir = { x: -1, y: 0 };
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          if (currentDir.x !== -1) newDir = { x: 1, y: 0 };
          break;
        case ' ':
        case 'Escape':
          setGameState('PAUSED');
          break;
      }

      directionRef.current = newDir;
      setDirection(newDir);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    if (gameState === 'PLAYING') {
      // Speed up slightly as score increases, max speed 50ms
      const currentSpeed = Math.max(50, INITIAL_SPEED - Math.floor(score / 50) * 10);
      intervalId = setInterval(moveSnake, currentSpeed);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [gameState, moveSnake, score]);

  const startGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    directionRef.current = INITIAL_DIRECTION;
    setScore(0);
    setGameState('PLAYING');
    setFood(generateFood(INITIAL_SNAKE));
  };

  const togglePause = () => {
    if (gameState === 'PLAYING') setGameState('PAUSED');
    else if (gameState === 'PAUSED') setGameState('PLAYING');
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center font-mono text-green-400 p-4 selection:bg-green-900">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-4xl md:text-6xl font-black mb-2 tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600 drop-shadow-[0_0_15px_rgba(74,222,128,0.5)] uppercase">
          Neon Snake
        </h1>
        <div className="flex gap-8 justify-center text-lg md:text-xl font-bold">
          <div className="flex flex-col items-center">
            <span className="text-gray-500 text-sm uppercase tracking-wider">Score</span>
            <span className="text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.8)]">{score}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-gray-500 text-sm uppercase tracking-wider">High Score</span>
            <span className="text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]">{highScore}</span>
          </div>
        </div>
      </div>

      {/* Game Board Container */}
      <div className="relative p-1 bg-gray-900 rounded-xl shadow-[0_0_30px_rgba(0,0,0,0.8)] ring-1 ring-gray-800">
        {/* Grid */}
        <div 
          className="bg-gray-950 rounded-lg overflow-hidden grid"
          style={{
            gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
            width: 'min(90vw, 500px)',
            height: 'min(90vw, 500px)',
          }}
        >
          {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
            const x = i % GRID_SIZE;
            const y = Math.floor(i / GRID_SIZE);
            const isSnakeHead = snake[0].x === x && snake[0].y === y;
            const isSnakeBody = snake.some((segment, idx) => idx !== 0 && segment.x === x && segment.y === y);
            const isFood = food.x === x && food.y === y;

            return (
              <div
                key={i}
                className={`
                  w-full h-full border-[0.5px] border-gray-900/30
                  ${isSnakeHead ? 'bg-green-400 shadow-[0_0_10px_rgba(74,222,128,1)] z-10 rounded-sm' : ''}
                  ${isSnakeBody ? 'bg-green-600/80 shadow-[0_0_5px_rgba(22,163,74,0.5)] rounded-sm' : ''}
                  ${isFood ? 'bg-pink-500 shadow-[0_0_12px_rgba(236,72,153,1)] rounded-full scale-75' : ''}
                `}
              />
            );
          })}
        </div>

        {/* Overlays */}
        {gameState !== 'PLAYING' && (
          <div className="absolute inset-0 bg-gray-950/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-lg z-20">
            {gameState === 'IDLE' && (
              <div className="text-center animate-pulse">
                <p className="text-2xl font-bold mb-6 text-green-400 drop-shadow-[0_0_10px_rgba(74,222,128,0.8)]">READY?</p>
                <button
                  onClick={startGame}
                  className="group relative px-8 py-3 bg-transparent overflow-hidden rounded-md transition-all hover:scale-105 cursor-pointer"
                >
                  <div className="absolute inset-0 border-2 border-green-400 rounded-md group-hover:bg-green-400/20 transition-colors"></div>
                  <span className="relative flex items-center gap-2 font-bold text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.8)]">
                    <Play size={20} /> START GAME
                  </span>
                </button>
              </div>
            )}

            {gameState === 'PAUSED' && (
              <div className="text-center">
                <p className="text-3xl font-bold mb-6 text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.8)] tracking-widest">PAUSED</p>
                <button
                  onClick={togglePause}
                  className="group relative px-8 py-3 bg-transparent overflow-hidden rounded-md transition-all hover:scale-105 cursor-pointer"
                >
                  <div className="absolute inset-0 border-2 border-yellow-400 rounded-md group-hover:bg-yellow-400/20 transition-colors"></div>
                  <span className="relative flex items-center gap-2 font-bold text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]">
                    <Play size={20} /> RESUME
                  </span>
                </button>
              </div>
            )}

            {gameState === 'GAME_OVER' && (
              <div className="text-center">
                <p className="text-4xl font-black mb-2 text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.8)] tracking-widest">GAME OVER</p>
                <p className="text-gray-400 mb-8">Final Score: <span className="text-white font-bold">{score}</span></p>
                <button
                  onClick={startGame}
                  className="group relative px-8 py-3 bg-transparent overflow-hidden rounded-md transition-all hover:scale-105 cursor-pointer"
                >
                  <div className="absolute inset-0 border-2 border-red-500 rounded-md group-hover:bg-red-500/20 transition-colors"></div>
                  <span className="relative flex items-center gap-2 font-bold text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]">
                    <RotateCcw size={20} /> PLAY AGAIN
                  </span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Controls / Instructions */}
      <div className="mt-8 flex flex-col items-center gap-4">
        <div className="flex gap-4">
          <button
            onClick={gameState === 'IDLE' || gameState === 'GAME_OVER' ? startGame : togglePause}
            className="p-3 rounded-full border border-gray-700 text-gray-400 hover:text-green-400 hover:border-green-400 hover:bg-green-400/10 transition-all focus:outline-none cursor-pointer"
            title={gameState === 'PLAYING' ? 'Pause' : 'Play'}
          >
            {gameState === 'PLAYING' ? <Pause size={24} /> : <Play size={24} />}
          </button>
          <button
            onClick={startGame}
            className="p-3 rounded-full border border-gray-700 text-gray-400 hover:text-red-400 hover:border-red-400 hover:bg-red-400/10 transition-all focus:outline-none cursor-pointer"
            title="Restart"
          >
            <RotateCcw size={24} />
          </button>
        </div>
        <p className="text-gray-600 text-sm text-center max-w-xs">
          Use <kbd className="bg-gray-800 px-1 py-0.5 rounded text-gray-300">W</kbd> <kbd className="bg-gray-800 px-1 py-0.5 rounded text-gray-300">A</kbd> <kbd className="bg-gray-800 px-1 py-0.5 rounded text-gray-300">S</kbd> <kbd className="bg-gray-800 px-1 py-0.5 rounded text-gray-300">D</kbd> or <kbd className="bg-gray-800 px-1 py-0.5 rounded text-gray-300">Arrows</kbd> to move. <br/>
          Press <kbd className="bg-gray-800 px-1 py-0.5 rounded text-gray-300">Space</kbd> to pause/start.
        </p>
      </div>
    </div>
  );
}
