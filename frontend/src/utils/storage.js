export function saveEvaluationState(state) {
  try {
    localStorage.setItem('gtg_eval_state', JSON.stringify(state));
  } catch {
    // ignore storage errors (private mode or disabled storage)
  }
}

export function loadEvaluationState() {
  try {
    const raw = localStorage.getItem('gtg_eval_state');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearEvaluationState() {
  try {
    localStorage.removeItem('gtg_eval_state');
  } catch {
    // ignore storage errors
  }
}
