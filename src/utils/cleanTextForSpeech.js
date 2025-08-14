export function cleanTextForSpeech(text) {
  let cleaned = text;

  // Negrita/cursiva: **texto** o *texto*
  cleaned = cleaned.replace(/(\*\*|\*)(.*?)\1/g, '$2');

  // Tachado: ~~texto~~
  cleaned = cleaned.replace(/~~(.*?)~~/g, '$1');

  // Links: [texto](url)
  cleaned = cleaned.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

  // Quitar emojis (unicode)
  cleaned = cleaned.replace(
    /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDDE0-\uDDFF]|\uD83D[\uDC00-\uDE4F]|\uD83D[\uDE80-\uDEFF])/g,
    ''
  );

  // Reemplazar enumeraciones tipo "1. Apple 2. Banana" por "Apple, Banana"
  cleaned = cleaned.replace(/\d+\.\s*/g, '');

  // Asegurar comas entre elementos si no existen (opcional)
  // Esto agrega una coma después de cada palabra seguida de espacio si viene de una enumeración eliminada
  cleaned = cleaned.replace(/([a-zA-Z0-9])\s+(?=[A-Z])/g, '$1, ');

  return cleaned.trim();
}
