export function getSessionId() {
  try {
    const key = 'gtg_session_id';
    let sid = localStorage.getItem(key);
    if (!sid) {
      sid = generateSimpleUUID();
      localStorage.setItem(key, sid);
    }
    return sid;
  } catch {
    // Fallback: in environments without localStorage
    return generateSimpleUUID();
  }
}

function generateSimpleUUID() {
  // Lightweight UUID-like generator (not RFC4122, but sufficient for session grouping)
  const s4 = () =>
    Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  return `${s4()}${s4()}-${s4()}-${s4()}-${s4()}-${s4()}${s4()}${s4()}`;
}
