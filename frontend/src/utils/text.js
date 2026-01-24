/**
 * Count meaningful characters (excluding leading/trailing whitespace)
 * Matches the validation logic in App.jsx
 */
export function getCharacterCount(text) {
  return text.trim().length;
}
