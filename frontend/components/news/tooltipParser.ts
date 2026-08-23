import {FINANCIAL_DICTIONARY} from './financialDictionary';

export interface DescriptionSegment {
    text: string;
    isTerm: boolean;
    definition?: string;
}

const SORTED_TERMS = Object.keys(FINANCIAL_DICTIONARY)
    .filter(term => term.trim().length > 0)
    .sort((a, b) => b.length - a.length);

const DICTIONARY_MAP = new Map(
    Object.entries(FINANCIAL_DICTIONARY).map(([k, v]) => [k.toLowerCase(), v])
);

const ESCAPED_TERMS = SORTED_TERMS.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`));
const PATTERN_STRING = ESCAPED_TERMS.length > 0 ? String.raw`\b(${ESCAPED_TERMS.join('|')})\b` : null;

export function parseDescriptionForTerms(description: string): DescriptionSegment[] {
    if (!description) return [];
    if (!PATTERN_STRING) return [{text: description, isTerm: false}];

    const regex = new RegExp(PATTERN_STRING, 'gi');
    const segments: DescriptionSegment[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(description)) !== null) {
        const [matchedText] = match;

        if (matchedText.length === 0) {
            regex.lastIndex++;
            continue;
        }

        if (match.index > lastIndex) {
            segments.push({text: description.slice(lastIndex, match.index), isTerm: false});
        }

        const definition = DICTIONARY_MAP.get(matchedText.toLowerCase());
        segments.push({text: matchedText, isTerm: true, definition});
        lastIndex = match.index + matchedText.length;
    }

    if (lastIndex < description.length) {
        segments.push({text: description.slice(lastIndex), isTerm: false});
    }

    return segments;
}