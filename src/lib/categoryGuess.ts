import type { Category } from '../types';

// Keyword → default category name. Matched against the uppercased
// transaction description. Order matters: first match wins, so more
// specific keywords should precede generic ones.
const EXPENSE_KEYWORD_RULES: [RegExp, string][] = [
  [/LOYER|SCI\s|AGENCE IMMO/, 'Logement'],
  [/EDF|ENGIE|TOTALENERGIES|ELECTRICITE|GAZ DE/, 'Logement'],
  [/CARREFOUR|LECLERC|AUCHAN|INTERMARCHE|LIDL|ALDI|MONOPRIX|FRANPRIX|CASINO|BOULANGERIE|BOUCHERIE/, 'Alimentation'],
  [/SNCF|RATP|UBER\s|TOTAL ACCES|ESSO|SHELL|BP\s|PARKING|AUTOROUTE|VINCI/, 'Transport'],
  [/NETFLIX|SPOTIFY|DISNEY|AMAZON PRIME|CANAL\+|DEEZER|APPLE\.COM\/BILL|GOOGLE\s*\*|YOUTUBE PREMIUM/, 'Abonnements'],
  [/CINEMA|UGC|PATHE|GAUMONT|FNAC SPECTACLE|BILLETTERIE/, 'Loisirs'],
  [/PHARMACIE|MUTUELLE|CPAM|DOCTEUR|DENTISTE|LABORATOIRE/, 'Santé'],
  [/ZARA|H&M|AMAZON\.FR|FNAC|DECATHLON|SHEIN|VINTED/, 'Shopping'],
];

const INCOME_KEYWORD_RULES: [RegExp, string][] = [
  [/VIR.*SALAIRE|SALAIRE/, 'Salaire'],
  [/VIR.*FREELANCE|FACTURE/, 'Freelance'],
  [/REMBOURS/, 'Remboursements'],
];

export function guessCategoryId(
  description: string,
  type: 'income' | 'expense',
  categories: Category[],
): string | null {
  const upper = description.toUpperCase();
  const rules = type === 'expense' ? EXPENSE_KEYWORD_RULES : INCOME_KEYWORD_RULES;

  for (const [pattern, categoryName] of rules) {
    if (pattern.test(upper)) {
      const match = categories.find((c) => c.name === categoryName && c.appliesTo === type && c.parentId === null);
      if (match) return match.id;
    }
  }

  const fallbackName = type === 'expense' ? 'Autres' : 'Autres revenus';
  return categories.find((c) => c.name === fallbackName && c.appliesTo === type && c.parentId === null)?.id ?? null;
}
