import { useState, useEffect, useRef } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { supabase } from "@/integrations/supabase/client";

// In-memory cache to avoid re-fetching during same session
const memoryCache = new Map<string, string>();

function cacheKey(text: string, lang: string) {
  return `${lang}::${text}`;
}

/**
 * Translate a single text string to the current language.
 * Returns original text while loading, translated text when ready.
 */
export function useTranslatedText(text: string | undefined | null): string {
  const { lang } = useLanguage();
  const [translated, setTranslated] = useState(text || "");
  const abortRef = useRef<AbortController>();

  useEffect(() => {
    if (!text) { setTranslated(""); return; }
    if (lang.code === "en") { setTranslated(text); return; }

    const key = cacheKey(text, lang.code);
    const cached = memoryCache.get(key);
    if (cached) { setTranslated(cached); return; }

    // Show original while loading
    setTranslated(text);

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const translate = async () => {
      try {
        // Check DB cache first
        const { data } = await supabase
          .from("translations_cache")
          .select("translated_text")
          .eq("source_text", text)
          .eq("target_lang", lang.code)
          .maybeSingle();

        if (controller.signal.aborted) return;

        if (data?.translated_text) {
          memoryCache.set(key, data.translated_text);
          setTranslated(data.translated_text);
          return;
        }

        // Call edge function
        const { data: fnData, error } = await supabase.functions.invoke("translate-content", {
          body: { texts: [text], target_lang: lang.code, content_type: "product" },
        });

        if (controller.signal.aborted) return;
        if (error) { console.error("Translation error:", error); return; }

        const result = fnData?.translations?.[0];
        if (result && result !== text) {
          memoryCache.set(key, result);
          setTranslated(result);
        }
      } catch (e) {
        if (!controller.signal.aborted) console.error("Translation failed:", e);
      }
    };

    translate();
    return () => controller.abort();
  }, [text, lang.code]);

  return translated;
}

/**
 * Translate multiple texts in a single batch call.
 */
export function useTranslatedTexts(texts: (string | undefined | null)[]): string[] {
  const { lang } = useLanguage();
  const validTexts = texts.filter(Boolean) as string[];
  const [results, setResults] = useState<string[]>(validTexts);
  const abortRef = useRef<AbortController>();

  useEffect(() => {
    if (validTexts.length === 0) { setResults([]); return; }
    if (lang.code === "en") { setResults(validTexts); return; }

    // Check memory cache
    const allCached = validTexts.every(t => memoryCache.has(cacheKey(t, lang.code)));
    if (allCached) {
      setResults(validTexts.map(t => memoryCache.get(cacheKey(t, lang.code))!));
      return;
    }

    setResults(validTexts);

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const translate = async () => {
      try {
        const uncached = validTexts.filter(t => !memoryCache.has(cacheKey(t, lang.code)));
        if (uncached.length === 0) return;

        const { data: fnData, error } = await supabase.functions.invoke("translate-content", {
          body: { texts: uncached, target_lang: lang.code },
        });

        if (controller.signal.aborted) return;
        if (error) return;

        const translated = fnData?.translations || uncached;
        uncached.forEach((t, i) => {
          if (translated[i]) memoryCache.set(cacheKey(t, lang.code), translated[i]);
        });

        setResults(validTexts.map(t => memoryCache.get(cacheKey(t, lang.code)) || t));
      } catch {
        // Keep originals
      }
    };

    translate();
    return () => controller.abort();
  }, [validTexts.join("||"), lang.code]);

  return results;
}
