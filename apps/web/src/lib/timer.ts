export interface PausableTimer {
  pause: () => void;
  resume: () => void;
  cancel: () => void;
}

/** A timeout that waits while paused, for messages that leave on their own (WCAG 2.2.1, enough time). Resuming starts
 *  the full time again, so someone who stopped to read or reached Undo with the keyboard is never rushed. */
export function pausableTimer(ms: number, onDone: () => void): PausableTimer {
  let id: ReturnType<typeof setTimeout> | null = null;
  let over = false; // fired or cancelled: it never starts again
  const start = () => {
    id = setTimeout(() => {
      id = null;
      over = true;
      onDone();
    }, ms);
  };
  const stop = () => {
    if (id !== null) clearTimeout(id);
    id = null;
  };
  start();
  return {
    pause: stop,
    resume: () => {
      if (!over && id === null) start();
    },
    cancel: () => {
      over = true;
      stop();
    },
  };
}
