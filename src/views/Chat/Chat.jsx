import { useEffect, useRef, useState } from "react";
import { Card, CardContent, Typography, Button, Box } from "@mui/material";
import { LanguageSelect } from "../../components/LanguageSelect/LanguageSelect";
import { cleanTextForSpeech } from "../../utils/cleanTextForSpeech.js";

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3000/ws/chat';

// eslint-disable-next-line react/prop-types
export const Chat = ({ lang, onLangChange }) => {
  const recognition = useRef(null);
  const chatDiv = useRef(null);
  const ws = useRef(null);
  const currentUtterance = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // Conectar WebSocket
  useEffect(() => {
    const connectWebSocket = () => {
      ws.current = new WebSocket(WS_URL);

      ws.current.onopen = () => {
        console.log('✅ WebSocket conectado');
        setIsConnected(true);
      };

      ws.current.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.type === 'chunk') {
          // Actualizar UI con el texto acumulado
          const geminiMsg = chatDiv.current.querySelector('.gemini-response');
          if (geminiMsg) {
            geminiMsg.innerHTML = `<b>Gemini:</b> ${data.fullText}`;
          }

          // Síntesis de voz progresiva (opcional: puedes esperar al 'done')
          // Para mejor experiencia, habla cuando tenga suficiente texto
          if (data.fullText.length > 50 && !currentUtterance.current) {
            speakText(data.fullText);
          }

        } else if (data.type === 'done') {
          console.log('✅ Respuesta completa recibida');
          
          // Asegurar que se habla el texto completo
          if (currentUtterance.current) {
            speechSynthesis.cancel();
          }
          speakText(data.fullText);
          
          if (chatDiv.current) {
            chatDiv.current.scrollTop = chatDiv.current.scrollHeight;
          }

        } else if (data.type === 'error') {
          console.error('Error del servidor:', data.message);
          if (chatDiv.current) {
            chatDiv.current.innerHTML += `<p style="color:red;"><b>Error:</b> ${data.message}</p>`;
          }
        }
      };

      ws.current.onclose = () => {
        console.log('🔌 WebSocket desconectado');
        setIsConnected(false);
        
        // Reconectar después de 3 segundos
        setTimeout(connectWebSocket, 3000);
      };

      ws.current.onerror = (error) => {
        console.error('❌ Error en WebSocket:', error);
      };
    };

    connectWebSocket();

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []);

  // Configurar reconocimiento de voz (solo una vez)
  useEffect(() => {
    if (!recognition.current) {
      recognition.current = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
      recognition.current.interimResults = false;

      recognition.current.onstart = () => {
        setIsListening(true);
        console.log('🎤 Escuchando...');
      };

      recognition.current.onend = () => {
        setIsListening(false);
        console.log('🎤 Reconocimiento finalizado');
      };

      recognition.current.onresult = async (event) => {
        const transcript = event.results[0][0].transcript;
        console.log('📝 Transcripción:', transcript);

        if (chatDiv.current) {
          chatDiv.current.innerHTML += `<p><b>Tú:</b> ${transcript}</p>`;
          
          // Crear elemento para respuesta de Gemini (se actualizará con streaming)
          const geminiP = document.createElement('p');
          geminiP.className = 'gemini-response';
          geminiP.innerHTML = '<b>Gemini:</b> <i>Pensando...</i>';
          chatDiv.current.appendChild(geminiP);
          
          chatDiv.current.scrollTop = chatDiv.current.scrollHeight;
        }

        // Enviar transcripción al servidor vía WebSocket
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
          ws.current.send(JSON.stringify({
            transcript: transcript,
            lang: lang
          }));
        } else {
          console.error('❌ WebSocket no está conectado');
          if (chatDiv.current) {
            chatDiv.current.innerHTML += `<p style="color:red;"><b>Error:</b> No hay conexión con el servidor.</p>`;
          }
        }
      };

      recognition.current.onerror = (event) => {
        console.error('Error en reconocimiento:', event.error);
        setIsListening(false);
      };
    }

    return () => {
      if (recognition.current) {
        recognition.current.abort();
      }
    };
  }, [lang]);

  // Actualizar idioma cuando cambia
  useEffect(() => {
    if (recognition.current) {
      recognition.current.lang = lang;
      console.log(`🌍 Idioma actualizado a: ${lang}`);
    }
  }, [lang]);

  const speakText = (text) => {
    speechSynthesis.cancel();
    const cleanText = cleanTextForSpeech(text);
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = lang;
    
    // Intentar encontrar una voz en el idioma seleccionado
    const voices = speechSynthesis.getVoices();
    const voice = voices.find(v => v.lang.startsWith(lang.split('-')[0]));
    if (voice) {
      utterance.voice = voice;
      console.log(`🔊 Usando voz: ${voice.name} (${voice.lang})`);
    } else {
      console.warn(`⚠️ No se encontró voz para ${lang}, usando voz por defecto`);
    }
    
    currentUtterance.current = utterance;
    
    utterance.onend = () => {
      currentUtterance.current = null;
    };
    
    speechSynthesis.speak(utterance);
  };

  const handleStart = () => {
    if (!isConnected) {
      alert('No hay conexión con el servidor. Espera un momento...');
      return;
    }
    recognition.current?.start();
  };

  const handleStop = () => {
    recognition.current?.stop();
    speechSynthesis.cancel();
    currentUtterance.current = null;
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              bgcolor: isConnected ? 'success.main' : 'error.main',
            }}
          />
          <Typography variant="caption" color="text.secondary">
            {isConnected ? 'Conectado' : 'Desconectado'}
          </Typography>
        </Box>

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
          <Button 
            variant="contained" 
            onClick={handleStart}
            disabled={!isConnected || isListening}
          >
            {isListening ? '🎤 Escuchando...' : 'Hablar'}
          </Button>
          <Button 
            variant="outlined" 
            color="error" 
            onClick={handleStop}
            disabled={!isListening}
          >
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
          "& p": {
            mb: 1
          }
        }}
      />
    </Card>
  );
};