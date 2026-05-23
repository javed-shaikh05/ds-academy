// SM-2 lite algorithm — schedules when a question should be reviewed again.
// Correct answers push the next review further out; wrong answers reset it.

interface ReviewState {
  ease: number;
  interval_days: number;
  repetitions: number;
}

export function schedule(
  state: ReviewState,
  correct: boolean,
): {
  ease: number;
  interval_days: number;
  repetitions: number;
  due_date: string;
} {
  let { ease, interval_days, repetitions } = state;

  if (correct) {
    repetitions += 1;
    if (repetitions === 1) interval_days = 1;
    else if (repetitions === 2) interval_days = 3;
    else interval_days = Math.round(interval_days * ease);
    // Nudge ease up slightly for correct
    ease = Math.min(2.8, ease + 0.1);
  } else {
    // Wrong: reset, show again tomorrow
    repetitions = 0;
    interval_days = 1;
    ease = Math.max(1.3, ease - 0.2);
  }

  const due = new Date();
  due.setDate(due.getDate() + interval_days);

  return {
    ease,
    interval_days,
    repetitions,
    due_date: due.toISOString().split("T")[0],
  };
}
