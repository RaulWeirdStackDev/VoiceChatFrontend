export function cleanTextForSpeech(text) {
  let cleaned = text;
  cleaned = cleaned.replace(/(\*\*|\*)(.*?)\1/g, '$2');          // Negrita/cursiva
  cleaned = cleaned.replace(/~~(.*?)~~/g, '$1');                 // Tachado
  cleaned = cleaned.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');     // Links
  cleaned = cleaned.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDDE0-\uDDFF]|\uD83D[\uDC00-\uDE4F]|\uD83D[\uDE80-\uDEFF])/g, ''); // Emojis
  return cleaned;
}