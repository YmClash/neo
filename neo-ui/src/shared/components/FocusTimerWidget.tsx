import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, Button, Badge } from '@shared/components';
import { useFocusTimer } from '@shared/hooks';

export const FocusTimerWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { focusState, formattedTime, startTimer, stopTimer } = useFocusTimer();
  const [minutes, setMinutes] = useState(25);

  const handleStart = () => startTimer(minutes);

  if (compact) {
    return (
      <Card variant="glass" padding="sm" className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">{focusState.isActive ? '⏱️' : '⏳'}</span>
          <div>
            <div className="text-sm font-mono font-bold tracking-wider text-neo-text">
              {focusState.isActive ? formattedTime : `${minutes}:00`}
            </div>
            <div className="text-[10px] text-neo-text-dim">FOCUS</div>
          </div>
        </div>
        <Button
          variant={focusState.isActive ? 'danger' : 'primary'}
          size="sm"
          onClick={focusState.isActive ? stopTimer : handleStart}
        >
          {focusState.isActive ? 'STOP' : 'START'}
        </Button>
      </Card>
    );
  }

  // Full version for Dashboard
  const progress = focusState.isActive && focusState.endTime && focusState.startTime
    ? 100 - ((focusState.endTime - Date.now()) / (focusState.endTime - focusState.startTime)) * 100
    : 0;

  return (
    <Card variant="glass" padding="lg" className="relative overflow-hidden">
      {/* Background progress bar */}
      {focusState.isActive && (
        <motion.div
          className="absolute inset-0 bg-neo-accent/10 z-0"
          initial={{ width: `${progress}%` }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1, ease: 'linear' }}
          style={{ transformOrigin: 'left' }}
        />
      )}

      <div className="relative z-10 flex flex-col items-center text-center">
        <Badge variant={focusState.isActive ? 'success' : 'default'} dot className="mb-4">
          {focusState.isActive ? 'FOCUS ACTIVE' : 'READY'}
        </Badge>
        
        <div className="text-6xl font-display font-bold neo-gradient-text tracking-widest mb-6">
          {focusState.isActive ? formattedTime : `${minutes}:00`}
        </div>

        {!focusState.isActive ? (
          <div className="flex flex-col items-center gap-4 w-full">
            <div className="flex items-center gap-2">
              {[15, 25, 50].map((m) => (
                <Button
                  key={m}
                  variant={minutes === m ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setMinutes(m)}
                >
                  {m}m
                </Button>
              ))}
            </div>
            <Button variant="primary" className="w-full" onClick={handleStart}>
              START FOCUS SESSION
            </Button>
          </div>
        ) : (
          <Button variant="danger" className="w-full" onClick={stopTimer}>
            ABORT SESSION
          </Button>
        )}
      </div>
    </Card>
  );
};
