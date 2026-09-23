import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Clock3,
  Delete,
  History,
  Minus,
  Percent,
  Plus,
  RotateCcw,
  Sparkles,
  X,
} from 'lucide-react';
import { sound } from '../../services/soundService';

type Operator = '+' | '-' | '×' | '÷' | null;

interface HistoryItem {
  id: number;
  expression: string;
  result: string;
}

const MAX_DISPLAY_LENGTH = 14;

const formatNumber = (value: number): string => {
  if (!Number.isFinite(value)) return 'Error';

  if (Object.is(value, -0)) value = 0;

  const rounded = Number.parseFloat(value.toPrecision(12));

  if (Math.abs(rounded) >= 1e12 || (Math.abs(rounded) > 0 && Math.abs(rounded) < 1e-9)) {
    return rounded.toExponential(6);
  }

  return String(rounded);
};

const calculate = (
  first: number,
  second: number,
  op: Exclude<Operator, null>,
): number => {
  switch (op) {
    case '+':
      return first + second;

    case '-':
      return first - second;

    case '×':
      return first * second;

    case '÷':
      return second === 0 ? NaN : first / second;

    default:
      return second;
  }
};

export const CalculatorApp: React.FC = () => {
  const [display, setDisplay] = useState('0');
  const [prevValue, setPrevValue] = useState<number | null>(null);
  const [operator, setOperator] = useState<Operator>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [expression, setExpression] = useState('');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isPressed, setIsPressed] = useState<string | null>(null);

  const playClick = useCallback(() => {
    sound.playClick();
  }, []);

  const inputDigit = useCallback(
    (digit: string) => {
      playClick();

      setIsPressed(digit);
      window.setTimeout(() => setIsPressed(null), 100);

      setDisplay((current) => {
        if (waitingForOperand) {
          setWaitingForOperand(false);
          return digit;
        }

        if (current === '0') {
          return digit;
        }

        if (current.length >= MAX_DISPLAY_LENGTH) {
          return current;
        }

        return current + digit;
      });
    },
    [playClick, waitingForOperand],
  );

  const inputDecimal = useCallback(() => {
    playClick();

    setIsPressed('.');
    window.setTimeout(() => setIsPressed(null), 100);

    if (waitingForOperand) {
      setDisplay('0.');
      setWaitingForOperand(false);
      return;
    }

    if (!display.includes('.')) {
      setDisplay((current) => current + '.');
    }
  }, [display, playClick, waitingForOperand]);

  const clearAll = useCallback(() => {
    playClick();

    setDisplay('0');
    setPrevValue(null);
    setOperator(null);
    setWaitingForOperand(false);
    setExpression('');
  }, [playClick]);

  const deleteLast = useCallback(() => {
    playClick();

    if (waitingForOperand || display === 'Error') {
      setDisplay('0');
      setWaitingForOperand(false);
      return;
    }

    setDisplay((current) => {
      if (current.length <= 1 || (current.length === 2 && current.startsWith('-'))) {
        return '0';
      }

      return current.slice(0, -1);
    });
  }, [display, playClick, waitingForOperand]);

  const toggleSign = useCallback(() => {
    playClick();

    if (display === '0' || display === 'Error') return;

    setDisplay((current) => {
      if (current.startsWith('-')) {
        return current.slice(1);
      }

      return `-${current}`;
    });
  }, [display, playClick]);

  const inputPercent = useCallback(() => {
    playClick();

    const value = Number.parseFloat(display);

    if (!Number.isFinite(value)) return;

    setDisplay(formatNumber(value / 100));
  }, [display, playClick]);

  const performOperation = useCallback(
    (nextOperator: Exclude<Operator, null>) => {
      playClick();

      const inputValue = Number.parseFloat(display);

      if (!Number.isFinite(inputValue)) {
        clearAll();
        return;
      }

      if (prevValue === null) {
        setPrevValue(inputValue);
        setOperator(nextOperator);
        setWaitingForOperand(true);
        setExpression(`${formatNumber(inputValue)} ${nextOperator}`);
        return;
      }

      if (operator) {
        const result = calculate(prevValue, inputValue, operator);
        const formattedResult = formatNumber(result);

        if (formattedResult === 'Error') {
          setDisplay('Error');
          setPrevValue(null);
          setOperator(null);
          setWaitingForOperand(true);
          setExpression('');
          return;
        }

        const fullExpression = `${formatNumber(prevValue)} ${operator} ${formatNumber(
          inputValue,
        )}`;

        setDisplay(formattedResult);
        setPrevValue(result);
        setExpression(
          nextOperator === '='
            ? `${fullExpression} =`
            : `${formattedResult} ${nextOperator}`,
        );

        if (nextOperator === '=') {
          setHistory((items) => [
            {
              id: Date.now(),
              expression: fullExpression,
              result: formattedResult,
            },
            ...items,
          ].slice(0, 12));

          setOperator(null);
          setWaitingForOperand(true);
        } else {
          setOperator(nextOperator);
          setWaitingForOperand(true);
        }
      }
    },
    [clearAll, display, operator, playClick, prevValue],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const key = event.key;

      if (/^[0-9]$/.test(key)) {
        inputDigit(key);
        return;
      }

      if (key === '.') {
        inputDecimal();
        return;
      }

      if (key === '+') {
        performOperation('+');
        return;
      }

      if (key === '-') {
        performOperation('-');
        return;
      }

      if (key === '*') {
        performOperation('×');
        return;
      }

      if (key === '/') {
        event.preventDefault();
        performOperation('÷');
        return;
      }

      if (key === '%') {
        inputPercent();
        return;
      }

      if (key === 'Enter' || key === '=') {
        performOperation('=');
        return;
      }

      if (key === '') {
        deleteLast();
        return;
      }

      if (key === 'Escape') {
        clearAll();
      }
    },
    [
      clearAll,
      deleteLast,
      inputDecimal,
      inputDigit,
      inputPercent,
      performOperation,
    ],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  const displaySize = useMemo(() => {
    if (display.length > 12) return 'text-3xl';
    if (display.length > 9) return 'text-4xl';
    return 'text-5xl';
  }, [display.length]);

  const buttonBase =
    'relative overflow-hidden select-none rounded-[20px] border transition-all duration-200 active:scale-[0.94] active:translate-y-[3px]';

  const numberButton = `
    ${buttonBase}
    border-white/[0.07]
    bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950
    text-white
    shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_8px_16px_rgba(0,0,0,0.35),0_2px_0_rgba(255,255,255,0.03)]
    hover:-translate-y-1
    hover:border-white/[0.14]
    hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_14px_25px_rgba(0,0,0,0.45)]
  `;

  const utilityButton = `
    ${buttonBase}
    border-white/[0.07]
    bg-gradient-to-br from-slate-700/80 to-slate-900
    text-slate-200
    shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_8px_16px_rgba(0,0,0,0.3)]
    hover:-translate-y-1
    hover:bg-slate-700
  `;

  const operatorButton = (active: boolean) => `
    ${buttonBase}
    border-amber-300/20
    ${
      active
        ? 'bg-white text-amber-500 shadow-[0_0_25px_rgba(245,158,11,0.5),inset_0_2px_0_rgba(255,255,255,0.9)]'
        : 'bg-gradient-to-br from-amber-400 via-amber-500 to-orange-600 text-white shadow-[0_10px_25px_rgba(245,158,11,0.28),inset_0_1px_0_rgba(255,255,255,0.35)]'
    }
    hover:-translate-y-1
    hover:shadow-[0_15px_30px_rgba(245,158,11,0.38)]
  `;

  return (
    <div className="relative flex h-full min-h-0 w-full items-center justify-center overflow-hidden bg-[#05070c] p-3 text-white sm:p-5">
      {/* Ambient 3D lighting */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[-180px] h-[380px] w-[380px] -translate-x-1/2 rounded-full bg-amber-500/10 blur-[100px]" />

        <div className="absolute bottom-[-160px] left-[-100px] h-[300px] w-[300px] rounded-full bg-blue-500/10 blur-[110px]" />

        <div className="absolute right-[-100px] top-1/3 h-[260px] w-[260px] rounded-full bg-purple-500/[0.08] blur-[100px]" />

        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
      </div>

      {/* Calculator shell */}
      <div
        className="
          relative
          flex
          h-full
          max-h-[760px]
          w-full
          max-w-[430px]
          flex-col
          overflow-hidden
          rounded-[34px]
          border
          border-white/[0.10]
          bg-gradient-to-b
          from-white/[0.075]
          via-slate-950/95
          to-black
          p-3
          shadow-[0_40px_90px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.10)]
          backdrop-blur-2xl
          sm:p-4
        "
      >
        {/* Top glass reflection */}
        <div className="pointer-events-none absolute left-8 right-8 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

        {/* Header */}
        <div className="relative flex items-center justify-between px-2 pb-3 pt-1">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-amber-300/20 bg-amber-400/10 shadow-[0_0_18px_rgba(245,158,11,0.15)]">
              <Sparkles size={15} className="text-amber-400" />
            </div>

            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/80">
                Calculator
              </div>

              <div className="text-[9px] tracking-wider text-white/30">
                Abhishek OS
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              playClick();
              setShowHistory((value) => !value);
            }}
            className="
              group
              flex
              h-9
              w-9
              items-center
              justify-center
              rounded-xl
              border
              border-white/[0.07]
              bg-white/[0.035]
              text-white/40
              transition-all
              hover:border-white/15
              hover:bg-white/[0.08]
              hover:text-white
            "
            title="Calculation history"
          >
            <History
              size={16}
              className="transition-transform duration-300 group-hover:rotate-[-12deg]"
            />
          </button>
        </div>

        {/* Display */}
        <div
          className="
            relative
            mb-3
            overflow-hidden
            rounded-[27px]
            border
            border-white/[0.08]
            bg-gradient-to-br
            from-black
            via-slate-950
            to-slate-900/80
            px-5
            pb-4
            pt-5
            shadow-[inset_0_2px_18px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.05),0_12px_30px_rgba(0,0,0,0.35)]
          "
        >
          {/* Display glow */}
          <div className="pointer-events-none absolute right-[-50px] top-[-80px] h-40 w-40 rounded-full bg-amber-500/10 blur-[60px]" />

          <div className="relative flex h-6 items-center justify-end">
            <span className="max-w-full truncate font-mono text-[11px] tracking-wide text-white/30">
              {expression || 'Ready'}
            </span>
          </div>

          <div className="relative mt-1 flex min-h-[68px] items-end justify-end overflow-hidden">
            <span
              className={`
                ${displaySize}
                max-w-full
                truncate
                font-mono
                font-light
                tracking-[-0.06em]
                text-white
                drop-shadow-[0_0_18px_rgba(255,255,255,0.12)]
              `}
            >
              {display}
            </span>
          </div>

          {/* Bottom display light */}
          <div className="absolute bottom-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-amber-400/30 to-transparent" />
        </div>

        {/* History drawer */}
        {showHistory && (
          <div
            className="
              absolute
              inset-x-3
              top-[92px]
              z-30
              overflow-hidden
              rounded-3xl
              border
              border-white/10
              bg-slate-950/95
              p-3
              shadow-[0_30px_70px_rgba(0,0,0,0.75)]
              backdrop-blur-2xl
              sm:inset-x-4
            "
          >
            <div className="mb-2 flex items-center justify-between px-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-white/70">
                <Clock3 size={13} />
                History
              </div>

              <button
                onClick={() => {
                  playClick();
                  setHistory([]);
                }}
                className="flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] text-white/30 transition hover:bg-white/5 hover:text-red-300"
              >
                <Delete size={11} />
                Clear
              </button>
            </div>

            {history.length === 0 ? (
              <div className="flex h-28 items-center justify-center text-xs text-white/25">
                No calculations yet
              </div>
            ) : (
              <div className="max-h-56 space-y-1 overflow-y-auto pr-1">
                {history.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      playClick();
                      setDisplay(item.result);
                      setExpression(`${item.expression} =`);
                      setShowHistory(false);
                    }}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition hover:bg-white/[0.06]"
                  >
                    <span className="truncate font-mono text-[11px] text-white/35">
                      {item.expression}
                    </span>

                    <span className="ml-3 font-mono text-sm text-white">
                      {item.result}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Buttons */}
        <div className="grid min-h-0 flex-1 grid-cols-4 gap-2 sm:gap-2.5">
          {/* Row 1 */}
          <button
            onClick={clearAll}
            className={utilityButton}
          >
            <span className="relative z-10 text-sm font-bold">AC</span>
            <span className="absolute inset-x-4 bottom-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          </button>

          <button
            onClick={toggleSign}
            className={utilityButton}
          >
            <span className="relative z-10 text-lg font-semibold">±</span>
          </button>

          <button
            onClick={inputPercent}
            className={utilityButton}
          >
            <Percent size={19} className="relative z-10 mx-auto" />
          </button>

          <button
            onClick={() => performOperation('÷')}
            className={operatorButton(operator === '÷')}
          >
            <span className="relative z-10 text-2xl font-semibold">÷</span>
          </button>

          {/* Row 2 */}
          {['7', '8', '9'].map((digit) => (
            <button
              key={digit}
              onClick={() => inputDigit(digit)}
              className={`${numberButton} ${
                isPressed === digit ? 'scale-[0.94] translate-y-[3px]' : ''
              }`}
            >
              <span className="relative z-10 text-xl font-medium">{digit}</span>

              <span className="pointer-events-none absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/0 blur-xl transition-all duration-300 group-hover:bg-white/5" />
            </button>
          ))}

          <button
            onClick={() => performOperation('×')}
            className={operatorButton(operator === '×')}
          >
            <X size={22} className="relative z-10 mx-auto" />
          </button>

          {/* Row 3 */}
          {['4', '5', '6'].map((digit) => (
            <button
              key={digit}
              onClick={() => inputDigit(digit)}
              className={`${numberButton} ${
                isPressed === digit ? 'scale-[0.94] translate-y-[3px]' : ''
              }`}
            >
              <span className="relative z-10 text-xl font-medium">{digit}</span>
            </button>
          ))}

          <button
            onClick={() => performOperation('-')}
            className={operatorButton(operator === '-')}
          >
            <Minus size={22} className="relative z-10 mx-auto" />
          </button>

          {/* Row 4 */}
          {['1', '2', '3'].map((digit) => (
            <button
              key={digit}
              onClick={() => inputDigit(digit)}
              className={`${numberButton} ${
                isPressed === digit ? 'scale-[0.94] translate-y-[3px]' : ''
              }`}
            >
              <span className="relative z-10 text-xl font-medium">{digit}</span>
            </button>
          ))}

          <button
            onClick={() => performOperation('+')}
            className={operatorButton(operator === '+')}
          >
            <Plus size={23} className="relative z-10 mx-auto" />
          </button>

          {/* Row 5 */}
          <button
            onClick={() => inputDigit('0')}
            className={`${numberButton} col-span-2 text-left pl-7 ${
              isPressed === '0' ? 'scale-[0.94] translate-y-[3px]' : ''
            }`}
          >
            <span className="relative z-10 text-xl font-medium">0</span>
          </button>

          <button
            onClick={inputDecimal}
            className={`${numberButton} ${
              isPressed === '.' ? 'scale-[0.94] translate-y-[3px]' : ''
            }`}
          >
            <span className="relative z-10 text-xl font-medium">.</span>
          </button>

          <button
            onClick={() => performOperation('=')}
            className="
              relative
              overflow-hidden
              rounded-[20px]
              border
              border-amber-300/30
              bg-gradient-to-br
              from-amber-300
              via-amber-500
              to-orange-600
              text-white
              shadow-[0_12px_30px_rgba(245,158,11,0.32),inset_0_1px_0_rgba(255,255,255,0.5),inset_0_-5px_10px_rgba(120,50,0,0.15)]
              transition-all
              duration-200
              hover:-translate-y-1
              hover:shadow-[0_18px_38px_rgba(245,158,11,0.42)]
              active:translate-y-[3px]
              active:scale-[0.94]
            "
          >
            <span className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent" />

            <span className="relative z-10 text-2xl font-semibold">=</span>
          </button>
        </div>

        {/* Bottom toolbar */}
        <div className="flex items-center justify-between px-2 pb-1 pt-3">
          <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-[0.15em] text-white/20">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]" />
            Ready
          </div>

          <button
  onClick={deleteLast}
  className="
    group
    flex
    items-center
    gap-1.5
    rounded-lg
    px-2
    py-1
    text-[10px]
    text-white/25
    transition
    hover:bg-white/[0.05]
    hover:text-white/70
  "
>
  {/* Replace YourIconComponent with your actual icon name (e.g., Trash2, ArrowLeft) */}
  <ArrowLeft 
    size={12} 
    className="transition-transform group-hover:-translate-x-0.5" 
  />
  Delete
</button>


          <button
            onClick={clearAll}
            className="
              group
              flex
              items-center
              gap-1.5
              rounded-lg
              px-2
              py-1
              text-[10px]
              text-white/25
              transition
              hover:bg-white/[0.05]
              hover:text-white/70
            "
          >
            <RotateCcw
              size={11}
              className="transition-transform duration-300 group-hover:rotate-[-45deg]"
            />
            Reset
          </button>
        </div>
      </div>
    </div>
  );
};