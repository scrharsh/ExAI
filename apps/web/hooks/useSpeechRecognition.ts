"use client";

import { useCallback, useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
    SpeechRecognition?: SpeechRecognitionConstructor;
  }
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: {
    [index: number]: {
      isFinal: boolean;
      [altIndex: number]: {
        transcript: string;
      };
    };
    length: number;
  };
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
}

interface SpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

interface UseSpeechRecognitionProps {
  onFinalTranscript: (text: string) => void;
}

export function useSpeechRecognition({ onFinalTranscript }: UseSpeechRecognitionProps) {
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [supported, setSupported] = useState<boolean | null>(null);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const isSupported = !!(
      window.SpeechRecognition || window.webkitSpeechRecognition
    );
    setSupported(isSupported);
  }, []);

  const init = useCallback(() => {
    if (supported !== true) {
      return null;
    }
    if (recognitionRef.current) {
      return recognitionRef.current;
    }

    const SpeechRecognitionApi = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionApi) {
      return null;
    }

    const recognition = new SpeechRecognitionApi();
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let interimText = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const transcript = result?.[0]?.transcript?.trim();
        if (!transcript) {
          continue;
        }
        if (result.isFinal) {
          onFinalTranscript(transcript);
        } else {
          interimText += ` ${transcript}`;
        }
      }
      setInterim(interimText.trim());
    };

    recognition.onerror = (evt) => {
      setError(evt.error);
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
      setInterim("");
    };

    recognitionRef.current = recognition;
    return recognition;
  }, [onFinalTranscript, supported]);

  const startListening = useCallback(() => {
    const recognition = init();
    if (!recognition) {
      return;
    }
    setError(null);
    recognition.start();
    setListening(true);
  }, [init]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
    setInterim("");
  }, []);

  return {
    supported,
    listening,
    interim,
    error,
    startListening,
    stopListening,
  };
}
