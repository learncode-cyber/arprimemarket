/**
 * Real-time SEO scoring for product titles and descriptions.
 * Returns a percentage score (0-100) with actionable feedback.
 */

interface SEOScoreResult {
  score: number;
  label: string;
  color: string;
  issues: string[];
  suggestions: string[];
}

export function calculateTitleSEO(title: string): SEOScoreResult {
  const issues: string[] = [];
  const suggestions: string[] = [];
  let score = 0;

  if (!title.trim()) return { score: 0, label: "No Title", color: "text-destructive", issues: ["Title is empty"], suggestions: ["Add a descriptive product title"] };

  const len = title.trim().length;
  const words = title.trim().split(/\s+/).length;

  // Length check (ideal: 50-60 chars)
  if (len >= 30 && len <= 65) { score += 25; }
  else if (len >= 20 && len < 30) { score += 15; issues.push("Title is a bit short"); suggestions.push("Aim for 30-65 characters"); }
  else if (len > 65 && len <= 80) { score += 15; issues.push("Title slightly long"); suggestions.push("Keep under 65 characters for Google"); }
  else if (len > 80) { score += 5; issues.push("Title too long — will be truncated in search"); suggestions.push("Shorten to under 65 characters"); }
  else { score += 10; issues.push("Title too short"); suggestions.push("Add more descriptive keywords"); }

  // Word count (ideal: 5-10 words)
  if (words >= 4 && words <= 12) score += 20;
  else if (words < 4) { score += 10; issues.push("Too few words"); suggestions.push("Use 4-12 words for better SEO"); }
  else { score += 10; issues.push("Too many words"); }

  // Capitalization
  const hasProperCase = /^[A-Z]/.test(title) || /[\u0980-\u09FF]/.test(title) || /[\u0600-\u06FF]/.test(title);
  if (hasProperCase) score += 10;
  else { issues.push("Start with capital letter"); suggestions.push("Capitalize the first letter"); }

  // No excessive caps
  const capsRatio = (title.match(/[A-Z]/g) || []).length / len;
  if (capsRatio < 0.5) score += 10;
  else { issues.push("Too many capital letters — looks spammy"); score += 3; }

  // Contains numbers (product specs)
  if (/\d/.test(title)) score += 10;
  else suggestions.push("Consider adding specs (size, quantity, etc.)");

  // No special characters spam
  if (!/[!@#$%^&*]{2,}/.test(title)) score += 10;
  else { issues.push("Avoid excessive special characters"); score += 3; }

  // Keyword variety (unique words ratio)
  const uniqueWords = new Set(title.toLowerCase().split(/\s+/));
  if (uniqueWords.size / words >= 0.7) score += 15;
  else { score += 8; issues.push("Too many repeated words"); }

  score = Math.min(100, score);

  return {
    score,
    label: score >= 80 ? "Excellent" : score >= 60 ? "Good" : score >= 40 ? "Needs Work" : "Poor",
    color: score >= 80 ? "text-green-500" : score >= 60 ? "text-amber-500" : score >= 40 ? "text-orange-500" : "text-destructive",
    issues,
    suggestions,
  };
}

export function calculateDescriptionSEO(description: string, title: string): SEOScoreResult {
  const issues: string[] = [];
  const suggestions: string[] = [];
  let score = 0;

  if (!description.trim()) return { score: 0, label: "No Description", color: "text-destructive", issues: ["Description is empty"], suggestions: ["Add a product description for better SEO"] };

  const len = description.trim().length;
  const words = description.trim().split(/\s+/).length;
  const sentences = description.split(/[.!?।]+/).filter(s => s.trim()).length;

  // Length (ideal: 150-300 words / 500-1500 chars)
  if (len >= 300 && len <= 2000) { score += 25; }
  else if (len >= 100 && len < 300) { score += 15; issues.push("Description is short"); suggestions.push("Aim for 300+ characters"); }
  else if (len > 2000) { score += 18; suggestions.push("Consider trimming for readability"); }
  else { score += 8; issues.push("Description too short"); suggestions.push("Write at least 100 characters"); }

  // Word count
  if (words >= 50 && words <= 300) score += 20;
  else if (words >= 20 && words < 50) { score += 12; suggestions.push("Add more detail (50+ words ideal)"); }
  else if (words < 20) { score += 5; issues.push("Very short description"); }
  else score += 15;

  // Sentence variety
  if (sentences >= 3) score += 10;
  else { score += 5; suggestions.push("Use multiple sentences for readability"); }

  // Contains title keywords
  const titleWords = title.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  const descLower = description.toLowerCase();
  const matchedKeywords = titleWords.filter(w => descLower.includes(w));
  if (matchedKeywords.length >= Math.min(2, titleWords.length)) score += 15;
  else { score += 5; issues.push("Description missing title keywords"); suggestions.push("Include product name keywords in description"); }

  // Has bullet-like structure or paragraphs
  if (description.includes("\n") || description.includes("•") || description.includes("-")) score += 10;
  else suggestions.push("Use bullet points or paragraphs for structure");

  // No keyword stuffing
  const wordFreq: Record<string, number> = {};
  descLower.split(/\s+/).forEach(w => { if (w.length > 3) wordFreq[w] = (wordFreq[w] || 0) + 1; });
  const maxFreq = Math.max(...Object.values(wordFreq), 0);
  if (maxFreq <= Math.max(5, words * 0.05)) score += 10;
  else { score += 3; issues.push("Possible keyword stuffing detected"); }

  // Call to action
  const ctaWords = ["buy", "shop", "order", "get", "try", "discover", "কিনুন", "অর্ডার"];
  if (ctaWords.some(w => descLower.includes(w))) score += 10;
  else suggestions.push("Add a call-to-action phrase");

  score = Math.min(100, score);

  return {
    score,
    label: score >= 80 ? "Excellent" : score >= 60 ? "Good" : score >= 40 ? "Needs Work" : "Poor",
    color: score >= 80 ? "text-green-500" : score >= 60 ? "text-amber-500" : score >= 40 ? "text-orange-500" : "text-destructive",
    issues,
    suggestions,
  };
}

export function calculateOverallSEO(title: string, description: string): SEOScoreResult {
  const titleSEO = calculateTitleSEO(title);
  const descSEO = calculateDescriptionSEO(description, title);
  const score = Math.round(titleSEO.score * 0.4 + descSEO.score * 0.6);
  
  return {
    score,
    label: score >= 80 ? "Excellent" : score >= 60 ? "Good" : score >= 40 ? "Needs Work" : "Poor",
    color: score >= 80 ? "text-green-500" : score >= 60 ? "text-amber-500" : score >= 40 ? "text-orange-500" : "text-destructive",
    issues: [...titleSEO.issues, ...descSEO.issues],
    suggestions: [...titleSEO.suggestions, ...descSEO.suggestions],
  };
}
