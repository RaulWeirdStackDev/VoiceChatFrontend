import { useEffect, useRef } from "react";
import { Card, CardContent, Typography, Button, Box } from "@mui/material";
import { LanguageSelect } from "../../components/LanguageSelect/LanguageSelect";
import { cleanTextForSpeech } from "../../utils/cleanTextForSpeech.js";

const API_URL = import.meta.env.VITE_API_URL;

// eslint-disable-next-line react/prop-types
export const Chat = ({ lang, onLangChange }) => {
  const recognition = useRef(null);
  const chatDiv = useRef(null);

  useEffect(() => {
    recognition.current = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.current.lang = lang;
    recognition.current.interimResults = false;

    recognition.current.onresult = async (event) => {
      const transcript = event.results[0][0].transcript;

      if (chatDiv.current) {
        chatDiv.current.innerHTML += `<p><b>Tú:</b> ${transcript}</p>`;
        chatDiv.current.scrollTop = chatDiv.current.scrollHeight; // Scroll automático
      }

      // Prompt reforzado: máximo 100 palabras, claro y directo
      const prompt = `
Eres Gemini, un asistente conversacional.
Responde exactamente a lo que el usuario pide en máximo 100 palabras.
- Sé claro, directo y conciso.
- No agregues información extra ni comentarios personales.
- Mantén coherencia y buena gramática.
- Termina la respuesta siempre con una oración completa.
Usuario: "${transcript}"
Respuesta:
      `;

      try {
        const res = await fetch(`${API_URL}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: prompt }),
        });
        const data = await res.json();

        if (chatDiv.current) {
          chatDiv.current.innerHTML += `<p><b>Gemini:</b> ${data.reply}</p>`;
          chatDiv.current.scrollTop = chatDiv.current.scrollHeight;
        }

        // Síntesis de voz
        speechSynthesis.cancel();
        const cleanText = cleanTextForSpeech(data.reply);
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = lang;
        speechSynthesis.speak(utterance);

      } catch (err) {
        console.error("Error al contactar Gemini:", err);
        if (chatDiv.current) {
          chatDiv.current.innerHTML += `<p style="color:red;"><b>Error:</b> No se pudo obtener respuesta de Gemini.</p>`;
        }
      }
    };

    recognition.current.onerror = (event) => {
      console.error('Error en reconocimiento:', event.error);
    };
  }, [lang]);

  const handleStart = () => {
    recognition.current?.start();
  };

  const handleStop = () => {
    speechSynthesis.cancel();
  };

  return (
    <Card
      sx={{
        width: 400,
        maxHeight: "80vh",
        display: "flex",
        flexDirection: "column",
        p: 2,
      }}
    >
      <CardContent
        sx={{
          flexGrow: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 2,
          mb: 2,
        }}
      >
        <LanguageSelect
          lang={lang}
          onChange={(value) => {
            console.log('Idioma seleccionado:', value);
            onLangChange(value);
          }}
          sx={{ minWidth: 180 }}
        />
        <Typography variant="h5" component="h1">
          Chat con voz
        </Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button variant="contained" onClick={handleStart}>
            Hablar
          </Button>
          <Button variant="outlined" color="error" onClick={handleStop}>
            Detener
          </Button>
        </Box>
      </CardContent>

      <Box
        ref={chatDiv}
        id="chat"
        sx={{
          flexGrow: 1,
          overflowY: "auto",
          border: "1px solid #ccc",
          borderRadius: 1,
          p: 1,
          bgcolor: "#fff",
          fontSize: "0.9rem",
        }}
      />
    </Card>
  );
};
