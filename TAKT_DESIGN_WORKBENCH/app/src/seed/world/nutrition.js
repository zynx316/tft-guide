// Gemeinsame Datenwelt: Ernährung (benannte Exporte = Welt-Schlüssel, Präfix „nut“).
// Persona Jonas Keller: 38 J., Körperwerte aus der Fitness-Welt, Ziel 3 kg Fett abbauen, 2.400 kcal / 140 g Eiweiß.
// Referenztag Di, 24.11.2026 09:30. Abgeleitete Summen werden hier berechnet, nicht von Hand gepflegt.
// Alle Nährwerte sind plausible Demo-Werte (je 100 g), keine geprüften Herstellerdaten.
import { per, totals, entryFromFood, ean13, bmr, tdee, shiftDay, dayEntries, r1 } from '../../library/components/nutrition/_calc.js';
import { transactions } from './finance.js';
import { triple } from './_util.js';
import { fmtNumber } from '../../lib/format.js';
const num = (v) => fmtNumber(v, { digits: 0 });
import { fitnessProfile, bodySummary, bodyWeightLog, trainingProgram } from './fitness.js';
import { trendOf } from '../../library/components/fitness/_calc.js';
import { recipeToEntry, recipePerServing, planNutrition } from '../../library/components/nutrition/_recipes.js';

const TODAY = '2026-11-24';
const d = (n) => shiftDay(TODAY, n);

// ------------------------------------------------------------ Lebensmittel
// F(id, Name, Kategorie, [kcal, Eiweiß, KH, Fett, Ballast., Zucker, ges. Fett, Salz], Portionen, Zusatz)
const F = (id, name, category, [kcal, protein, carbs, fat, fiber, sugar, satFat, salt], portions, x = {}) => ({
  id, name, category, kcal, protein, carbs, fat, fiber, sugar, satFat, salt, unit: x.unit || 'g',
  portions: portions.map(([label, g]) => ({ label, g })), brand: x.brand || null, barcode: x.bc ? ean13(x.bc) : null,
  allergens: x.al || [], tags: x.tags || [], fav: !!x.fav, custom: false, piece: x.piece || null, eur100: x.eur ?? 0.5,
  source: x.bc ? 'Demo-Daten (Herstellerangabe, nicht verifiziert)' : 'Demo-Daten (Richtwerte)',
  ...(x.alc ? { alcohol: x.alc } : {}), // Alkohol in g je 100 g/ml (7 kcal je g, Atwater)
});
export const nutFoods = [
  F('f-skyr', 'Skyr natur', 'Milch & Eier', [63, 11, 4, 0.2, 0, 4, 0.1, 0.1], [['Becher (150 g)', 150], ['Schüssel (250 g)', 250]], { brand: 'Arla', bc: '571000100011', al: ['Milch'], tags: ['proteinreich'], fav: true, eur: 0.56 }),
  F('f-quark', 'Magerquark', 'Milch & Eier', [67, 12, 4, 0.3, 0, 4, 0.2, 0.1], [['Packung (250 g)', 250], ['Portion (125 g)', 125]], { brand: 'Milram', bc: '401500200021', al: ['Milch'], tags: ['proteinreich'], fav: true, eur: 0.36 }),
  F('f-huettenkaese', 'Hüttenkäse', 'Milch & Eier', [89, 12, 3.1, 3.5, 0, 3, 2.3, 0.7], [['Becher (200 g)', 200], ['Portion (100 g)', 100]], { al: ['Milch'], tags: ['proteinreich'], eur: 0.62 }),
  F('f-joghurt', 'Naturjoghurt 3,5 %', 'Milch & Eier', [66, 3.9, 4.8, 3.5, 0, 4.8, 2.3, 0.1], [['Becher (150 g)', 150], ['Löffel (30 g)', 30]], { al: ['Milch'], eur: 0.25 }),
  F('f-milch', 'Milch 1,5 %', 'Milch & Eier', [47, 3.4, 4.9, 1.5, 0, 4.9, 1, 0.1], [['Glas (250 ml)', 250], ['Schuss (50 ml)', 50]], { unit: 'ml', al: ['Milch'], eur: 0.11 }),
  F('f-ei', 'Ei (Größe M)', 'Milch & Eier', [137, 12.5, 0.7, 9.3, 0, 0.7, 2.6, 0.35], [['1 Ei (58 g)', 58], ['2 Eier (116 g)', 116], ['3 Eier (174 g)', 174]], { al: ['Eier'], piece: { g: 58, label: 'Ei', plural: 'Eier' }, eur: 0.34 }),
  F('f-feta', 'Feta', 'Milch & Eier', [264, 17, 1.5, 21, 0, 1.5, 14, 2.8], [['Stück (50 g)', 50], ['Packung (200 g)', 200]], { al: ['Milch'], eur: 0.95 }),
  F('f-parmesan', 'Parmesan', 'Milch & Eier', [392, 36, 0, 28, 0, 0, 19, 1.6], [['EL gerieben (10 g)', 10], ['Portion (20 g)', 20]], { al: ['Milch'], eur: 2.3 }),
  F('f-butter', 'Butter', 'Milch & Eier', [741, 0.7, 0.6, 82, 0, 0.6, 52, 0.02], [['Portion (10 g)', 10], ['TL (5 g)', 5]], { al: ['Milch'], eur: 1.6 }),
  F('f-hafermilch', 'Hafer-Drink ungesüßt', 'Getränke', [47, 0.8, 6.5, 1.5, 0.8, 3.9, 0.2, 0.1], [['Schuss (100 ml)', 100], ['Glas (250 ml)', 250]], { unit: 'ml', brand: 'Alpro', bc: '541000300031', al: ['Gluten'], eur: 0.14 }),
  F('f-haehnchen', 'Hähnchenbrust, roh', 'Fleisch & Fisch', [106, 23.5, 0, 1.2, 0, 0, 0.3, 0.15], [['Filet (150 g)', 150], ['Portion (200 g)', 200]], { tags: ['proteinreich'], eur: 1.1 }),
  F('f-lachs', 'Lachsfilet', 'Fleisch & Fisch', [202, 20, 0, 13, 0, 0, 2.6, 0.12], [['Filet (150 g)', 150]], { al: ['Fisch'], eur: 2.2 }),
  F('f-thunfisch', 'Thunfisch im eigenen Saft', 'Konserven', [112, 25.5, 0, 1, 0, 0, 0.3, 0.9], [['Dose (130 g abgetropft)', 130]], { brand: 'Saupiquet', bc: '301000400041', al: ['Fisch'], tags: ['proteinreich'], piece: { g: 130, label: 'Dose', plural: 'Dosen' }, eur: 1.1 }),
  F('f-tofu', 'Tofu natur', 'Pflanzlich', [120, 13, 1, 7, 0.8, 0.6, 1, 0.03], [['Portion (100 g)', 100], ['Packung (200 g)', 200]], { al: ['Soja'], tags: ['vegan'], eur: 0.9 }),
  F('f-hummus', 'Hummus', 'Pflanzlich', [240, 7, 9, 19, 5, 0.5, 2.7, 1], [['Portion (50 g)', 50], ['EL (20 g)', 20]], { brand: 'Zühlke', bc: '401600500051', al: ['Sesam'], tags: ['vegan'], eur: 0.9 }),
  F('f-linsen', 'Rote Linsen, roh', 'Hülsenfrüchte', [340, 24, 50, 1.5, 11, 2, 0.2, 0.02], [['Portion roh (75 g)', 75]], { tags: ['vegan', 'proteinreich'], eur: 0.35 }),
  F('f-kichererbsen', 'Kichererbsen (Dose)', 'Hülsenfrüchte', [125, 7.5, 16, 2.5, 6, 1.2, 0.3, 0.5], [['Dose (240 g abgetropft)', 240], ['Portion (120 g)', 120]], { tags: ['vegan'], piece: { g: 240, label: 'Dose', plural: 'Dosen' }, eur: 0.28 }),
  F('f-haferflocken', 'Haferflocken zart', 'Getreide & Brot', [372, 13.5, 58.7, 7, 10, 1.2, 1.3, 0.02], [['Portion (50 g)', 50], ['EL (10 g)', 10]], { brand: 'Kölln', bc: '400100600061', al: ['Gluten'], tags: ['vegan'], fav: true, eur: 0.2 }),
  F('f-vollkornbrot', 'Vollkornbrot', 'Getreide & Brot', [215, 7, 38, 1.6, 7, 3, 0.3, 1.2], [['Scheibe (50 g)', 50], ['2 Scheiben (100 g)', 100]], { al: ['Gluten'], tags: ['vegan'], eur: 0.35 }),
  F('f-reis', 'Basmatireis, roh', 'Getreide & Brot', [349, 8, 77, 0.8, 1.4, 0.2, 0.2, 0.01], [['Portion roh (75 g)', 75]], { tags: ['vegan'], eur: 0.28 }),
  F('f-nudeln', 'Vollkornnudeln, roh', 'Getreide & Brot', [340, 12, 62, 2.5, 8, 3, 0.5, 0.03], [['Portion roh (100 g)', 100]], { al: ['Gluten'], tags: ['vegan'], eur: 0.28 }),
  F('f-kartoffeln', 'Kartoffeln, gekocht', 'Obst & Gemüse', [71, 2, 14.8, 0.1, 1.7, 0.8, 0, 0.01], [['Portion (250 g)', 250]], { tags: ['vegan'], eur: 0.15 }),
  F('f-suesskartoffel', 'Süßkartoffel', 'Obst & Gemüse', [86, 1.6, 20, 0.1, 3, 4.2, 0, 0.05], [['mittel (250 g)', 250]], { tags: ['vegan'], eur: 0.2 }),
  F('f-brokkoli', 'Brokkoli', 'Obst & Gemüse', [34, 2.8, 4.0, 0.4, 2.6, 1.4, 0.1, 0.03], [['Portion (150 g)', 150], ['Kopf (400 g)', 400]], { tags: ['vegan'], eur: 0.25 }),
  F('f-tomate', 'Tomate', 'Obst & Gemüse', [18, 0.9, 2.6, 0.2, 1.2, 2.5, 0, 0.01], [['mittel (100 g)', 100]], { tags: ['vegan'], eur: 0.3 }),
  F('f-zucchini', 'Zucchini', 'Obst & Gemüse', [17, 1.2, 2, 0.3, 1.1, 1.7, 0.1, 0.01], [['Zucchini (250 g)', 250]], { tags: ['vegan'], eur: 0.18 }),
  F('f-paprika', 'Paprika rot', 'Obst & Gemüse', [31, 1, 6, 0.3, 2, 4.2, 0.1, 0.01], [['Paprika (170 g)', 170]], { tags: ['vegan'], piece: { g: 170, label: 'Paprika', plural: 'Paprika' }, eur: 0.3 }),
  F('f-gurke', 'Gurke', 'Obst & Gemüse', [12, 0.6, 1.8, 0.2, 0.5, 1.7, 0, 0.01], [['halbe (200 g)', 200]], { tags: ['vegan'], piece: { g: 400, label: 'Gurke', plural: 'Gurken' }, eur: 0.12 }),
  F('f-spinat', 'Blattspinat', 'Obst & Gemüse', [23, 2.9, 1.4, 0.4, 2.2, 0.4, 0.1, 0.2], [['Portion (150 g)', 150]], { tags: ['vegan'], eur: 0.45 }),
  F('f-zwiebel', 'Zwiebel', 'Obst & Gemüse', [28, 1.2, 4.9, 0.2, 1.7, 4.2, 0, 0.01], [['mittel (80 g)', 80]], { tags: ['vegan'], piece: { g: 80, label: 'Zwiebel', plural: 'Zwiebeln' }, eur: 0.12 }),
  F('f-karotte', 'Karotte', 'Obst & Gemüse', [36, 0.9, 7.5, 0.2, 3, 6.2, 0, 0.1], [['mittel (80 g)', 80]], { tags: ['vegan'], piece: { g: 80, label: 'Karotte', plural: 'Karotten' }, eur: 0.1 }),
  F('f-avocado', 'Avocado', 'Obst & Gemüse', [160, 2, 2, 15, 6.7, 0.7, 2.1, 0.01], [['halbe (80 g)', 80], ['ganze (160 g)', 160]], { tags: ['vegan'], piece: { g: 160, label: 'Avocado', plural: 'Avocados' }, eur: 0.75 }),
  F('f-banane', 'Banane', 'Obst & Gemüse', [93, 1.1, 20.5, 0.2, 2, 17, 0.1, 0], [['mittel (120 g)', 120]], { tags: ['vegan'], piece: { g: 120, label: 'Banane', plural: 'Bananen' }, eur: 0.22 }),
  F('f-apfel', 'Apfel', 'Obst & Gemüse', [54, 0.3, 11.4, 0.4, 2, 10.4, 0.1, 0], [['mittel (180 g)', 180]], { tags: ['vegan'], piece: { g: 180, label: 'Apfel', plural: 'Äpfel' }, eur: 0.3 }),
  F('f-blaubeeren', 'Blaubeeren', 'Obst & Gemüse', [42, 0.7, 7.4, 0.6, 4.9, 7.4, 0.1, 0], [['Handvoll (80 g)', 80], ['Schale (125 g)', 125]], { tags: ['vegan'], eur: 1.2 }),
  F('f-walnuesse', 'Walnüsse', 'Nüsse & Öle', [654, 15, 7, 65, 6.7, 2.7, 6, 0.01], [['Handvoll (30 g)', 30], ['EL gehackt (15 g)', 15]], { al: ['Schalenfrüchte'], tags: ['vegan'], eur: 1.4 }),
  F('f-mandeln', 'Mandeln', 'Nüsse & Öle', [576, 21, 5, 51, 12, 4, 4, 0.01], [['Handvoll (25 g)', 25], ['kleine Handvoll (15 g)', 15]], { al: ['Schalenfrüchte'], tags: ['vegan'], eur: 1.2 }),
  F('f-erdnussbutter', 'Erdnussbutter crunchy', 'Nüsse & Öle', [610, 25, 9, 50, 6, 5, 10, 0.7], [['EL (15 g)', 15], ['TL (8 g)', 8]], { brand: 'Peanut Co.', bc: '401700700071', al: ['Erdnüsse'], tags: ['vegan'], eur: 1.1 }),
  F('f-olivenoel', 'Olivenöl', 'Nüsse & Öle', [884, 0, 0, 100, 0, 0, 14, 0], [['EL (10 g)', 10], ['TL (5 g)', 5]], { tags: ['vegan'], eur: 1.2 }),
  F('f-honig', 'Honig', 'Süßes & Snacks', [306, 0.4, 75, 0, 0, 75, 0, 0], [['TL (7 g)', 7], ['EL (20 g)', 20]], { eur: 1 }),
  F('f-schoko', 'Zartbitterschokolade 70 %', 'Süßes & Snacks', [570, 8, 33, 42, 11, 24, 26, 0.02], [['2 Stücke (10 g)', 10], ['Rippe (25 g)', 25]], { al: ['Milch'], eur: 1.6 }),
  F('f-kokosmilch', 'Kokosmilch (Dose)', 'Konserven', [170, 1.6, 3, 17, 0, 2, 15, 0.05], [['Dose (400 ml)', 400], ['Portion (100 ml)', 100]], { unit: 'ml', tags: ['vegan'], piece: { g: 400, label: 'Dose', plural: 'Dosen' }, eur: 0.4 }),
  F('f-passata', 'Passierte Tomaten', 'Konserven', [29, 1.4, 4.5, 0.2, 1.2, 4.2, 0, 0.2], [['Packung (500 g)', 500], ['Portion (150 g)', 150]], { tags: ['vegan'], piece: { g: 500, label: 'Packung', plural: 'Packungen' }, eur: 0.2 }),
  F('f-currypaste', 'Currypaste rot', 'Konserven', [111, 2, 10, 7, 3, 3, 2.5, 6], [['TL (10 g)', 10]], { tags: ['vegan'], eur: 2.5 }),
  F('f-whey', 'Whey-Protein Vanille', 'Eiweiß & Supplements', [385, 76, 8, 6, 1, 6, 3, 0.9], [['Messlöffel (30 g)', 30]], { brand: 'ESN', bc: '421800800081', al: ['Milch', 'Soja'], tags: ['proteinreich'], fav: true, eur: 3.2 }),
  F('f-riegel', 'Protein-Riegel Cookie', 'Eiweiß & Supplements', [364, 36, 28, 14, 5, 2, 6, 0.5], [['Riegel (55 g)', 55]], { brand: 'Barebells', bc: '731900900091', al: ['Milch', 'Erdnüsse', 'Soja'], tags: ['proteinreich'], piece: { g: 55, label: 'Riegel', plural: 'Riegel' }, eur: 3.5 }),
  F('f-kaffee', 'Kaffee, schwarz', 'Getränke', [2, 0.1, 0, 0, 0, 0, 0, 0], [['Tasse (200 ml)', 200]], { unit: 'ml', eur: 0.1 }),
  F('f-bier', 'Bier (Pils)', 'Getränke', [43, 0.4, 3.1, 0, 0, 0, 0, 0], [['Glas (330 ml)', 330], ['Flasche (500 ml)', 500]], { unit: 'ml', al: ['Gluten'], eur: 0.1, alc: 3.8 }),
];
const FOOD = Object.fromEntries(nutFoods.map((f) => [f.id, f]));

// ------------------------------------------------------------------ Rezepte
const R = (id, title, subtitle, meal, o) => ({ id, title, subtitle, meal, servings: o.servings, prepMin: o.prep, cookMin: o.cook || 0, level: o.level || 'einfach', tags: o.tags, fav: !!o.fav, tone: o.tone, icon: o.icon,
  ingredients: o.ing.map(([foodId, g]) => ({ foodId, g })), steps: o.steps.map((s) => (typeof s === 'string' ? { text: s } : { text: s[0], minutes: s[1] })), source: 'Eigenes Rezept' });
export const nutRecipes = [
  R('r-skyr-bowl', 'Skyr-Bowl mit Blaubeeren', 'Frühstück in fünf Minuten', 'breakfast', { servings: 1, prep: 5, tags: ['vegetarisch', 'proteinreich', 'schnell'], fav: true, tone: 1, icon: 'milk',
    ing: [['f-skyr', 250], ['f-haferflocken', 50], ['f-blaubeeren', 80], ['f-walnuesse', 15], ['f-honig', 10]],
    steps: ['Skyr in eine Schüssel geben und glatt rühren.', 'Haferflocken unterheben und kurz quellen lassen.', 'Blaubeeren waschen und darauf verteilen.', 'Walnüsse grob hacken, mit dem Honig darüber geben.'] }),
  R('r-ruehrei', 'Rührei auf Vollkornbrot mit Avocado', 'Herzhaft, sättigend', 'breakfast', { servings: 1, prep: 5, cook: 5, tags: ['vegetarisch', 'schnell'], tone: 3, icon: 'egg',
    ing: [['f-ei', 174], ['f-vollkornbrot', 100], ['f-avocado', 80], ['f-butter', 5], ['f-tomate', 100]],
    steps: [['Brot rösten.', 3], 'Eier in einer Schüssel verquirlen und leicht salzen.', ['Butter in der Pfanne schmelzen, Eier bei mittlerer Hitze stocken lassen.', 4], 'Avocado zerdrücken und auf das Brot streichen.', 'Rührei und Tomatenscheiben darauf anrichten.'] }),
  R('r-pfannkuchen', 'Protein-Pfannkuchen', 'Mit Haferflocken und Quark', 'breakfast', { servings: 2, prep: 10, cook: 10, tags: ['vegetarisch', 'proteinreich'], tone: 4, icon: 'cookie',
    ing: [['f-haferflocken', 100], ['f-ei', 116], ['f-quark', 250], ['f-banane', 120], ['f-butter', 10]],
    steps: ['Haferflocken, Eier, Quark und Banane mit dem Stabmixer zu einem glatten Teig pürieren.', ['Teig 5 Minuten ruhen lassen.', 5], 'Butter in einer beschichteten Pfanne erhitzen.', ['Kleine Pfannkuchen bei mittlerer Hitze je 2 bis 3 Minuten pro Seite backen.', 8], 'Nach Belieben mit Obst oder Honig servieren.'] }),
  R('r-reis-bowl', 'Hähnchen-Reis-Bowl', 'Meal-Prep für vier Portionen', 'lunch', { servings: 4, prep: 15, cook: 25, tags: ['proteinreich', 'meal-prep'], fav: true, tone: 2, icon: 'drumstick',
    ing: [['f-haehnchen', 600], ['f-reis', 300], ['f-brokkoli', 600], ['f-paprika', 340], ['f-zwiebel', 80], ['f-olivenoel', 20], ['f-erdnussbutter', 40]],
    steps: [['Reis nach Packungsanleitung garen.', 15], 'Hähnchen in Würfel schneiden, Zwiebel und Paprika klein schneiden, Brokkoli in Röschen teilen.', ['Öl in einer großen Pfanne erhitzen, Hähnchen 6 Minuten kräftig anbraten.', 6], ['Gemüse zugeben und weitere 8 Minuten braten.', 8], 'Erdnussbutter mit etwas Wasser glatt rühren, über die Pfanne geben und kurz erhitzen.', 'Reis und Hähnchen-Gemüse auf vier Boxen verteilen.'] }),
  R('r-linsen-curry', 'Rotes Linsen-Curry', 'Vegan, cremig, aus einem Topf', 'dinner', { servings: 4, prep: 10, cook: 25, tags: ['vegan', 'meal-prep'], tone: 5, icon: 'soup',
    ing: [['f-linsen', 300], ['f-kokosmilch', 400], ['f-passata', 400], ['f-zwiebel', 160], ['f-currypaste', 30], ['f-spinat', 300], ['f-olivenoel', 20]],
    steps: ['Zwiebeln fein würfeln.', ['Öl erhitzen, Zwiebeln 4 Minuten glasig dünsten, Currypaste kurz mitrösten.', 5], 'Linsen, Tomaten und Kokosmilch zugeben, 150 ml Wasser angießen.', ['Bei mittlerer Hitze 15 Minuten köcheln, gelegentlich umrühren.', 15], ['Spinat unterheben und zusammenfallen lassen.', 2], 'Mit Salz und Pfeffer abschmecken.'] }),
  R('r-lachs', 'Lachs mit Ofengemüse', 'Ein Blech, wenig Aufwand', 'dinner', { servings: 2, prep: 10, cook: 25, tags: ['proteinreich', 'ohne Gluten'], fav: true, tone: 3, icon: 'fish',
    ing: [['f-lachs', 300], ['f-suesskartoffel', 400], ['f-brokkoli', 300], ['f-zucchini', 250], ['f-olivenoel', 20]],
    steps: ['Ofen auf 200 °C Ober-/Unterhitze vorheizen.', 'Süßkartoffeln und Zucchini in Stücke schneiden, Brokkoli in Röschen teilen.', 'Gemüse mit der Hälfte des Öls mischen und auf einem Blech verteilen.', ['Gemüse 15 Minuten im Ofen garen.', 15], 'Lachs mit dem restlichen Öl und Salz bestreichen, zum Gemüse legen.', ['Weitere 10 Minuten garen, bis der Lachs gerade durch ist.', 10]] }),
  R('r-pasta-thunfisch', 'Vollkornpasta mit Thunfisch-Tomatensauce', 'Schnell und eiweißreich', 'dinner', { servings: 2, prep: 5, cook: 20, tags: ['proteinreich', 'schnell'], tone: 1, icon: 'utensils',
    ing: [['f-nudeln', 200], ['f-thunfisch', 260], ['f-passata', 400], ['f-zwiebel', 80], ['f-olivenoel', 10], ['f-parmesan', 20]],
    steps: [['Nudeln in Salzwasser nach Packungsanleitung garen.', 10], 'Zwiebel fein würfeln und im Öl glasig dünsten.', ['Passierte Tomaten zugeben und 8 Minuten einkochen lassen.', 8], 'Thunfisch abtropfen, unterrühren und kurz erwärmen.', 'Nudeln mit der Sauce mischen, Parmesan darüber reiben.'] }),
  R('r-kichererbsen-salat', 'Kichererbsen-Feta-Salat', 'Frisch, ohne Kochen', 'lunch', { servings: 2, prep: 15, tags: ['vegetarisch', 'schnell'], tone: 2, icon: 'salad',
    ing: [['f-kichererbsen', 240], ['f-feta', 100], ['f-gurke', 300], ['f-tomate', 250], ['f-zwiebel', 40], ['f-olivenoel', 20], ['f-vollkornbrot', 100]],
    steps: ['Kichererbsen abspülen und abtropfen lassen.', 'Gurke und Tomaten würfeln, Zwiebel fein hacken.', 'Alles mit dem Öl mischen, Feta darüber bröseln.', 'Mit Salz, Pfeffer und etwas Zitronensaft abschmecken, mit Brot servieren.'] }),
];
// Alkohol je Eintrag aus dem Lebensmittel (g), damit Energie und Nährwerte zusammenpassen (Befund B8)
const REC = Object.fromEntries(nutRecipes.map((r) => [r.id, r]));
for (const r of nutRecipes) r.perServing = recipePerServing(r, nutFoods);

// ------------------------------------------------------------------ Tagebuch
let seq = 0;
const stamp = (e) => ({ ...e, id: `d${String(++seq).padStart(3, '0')}` });
const Fd = (date, meal, time, foodId, g, extra = {}) => stamp({ ...entryFromFood(FOOD[foodId], g, { meal, date, time, amount: extra.amount }), ...extra });
const Rc = (date, meal, time, rid, k = 1) => stamp(recipeToEntry(REC[rid], nutFoods, k, { meal, date, time }));
const Q = (date, meal, time, name, kcal, p, c, f, extra = {}) => stamp({ id: '', date, meal, time, foodId: null, name, amount: 'Schätzung', grams: null, kcal, protein: p, carbs: c, fat: f, fiber: 0, sugar: 0, salt: 0, source: 'quick', ...extra });

export const nutDiary = [
  // Mi 18.11. (Training)
  Rc(d(-6), 'breakfast', '08:00', 'r-ruehrei'), Fd(d(-6), 'snack', '10:30', 'f-apfel', 180), Fd(d(-6), 'snack', '10:30', 'f-mandeln', 25),
  Rc(d(-6), 'lunch', '12:45', 'r-kichererbsen-salat'), Fd(d(-6), 'snack', '16:30', 'f-riegel', 55), Rc(d(-6), 'dinner', '20:00', 'r-reis-bowl'),
  Fd(d(-6), 'snack', '21:15', 'f-whey', 30), Fd(d(-6), 'snack', '21:15', 'f-milch', 250),
  // Do 19.11.: nicht erfasst
  // Fr 20.11. (Janas Geburtstag)
  Rc(d(-4), 'breakfast', '07:50', 'r-skyr-bowl'), Rc(d(-4), 'lunch', '13:00', 'r-reis-bowl'), Fd(d(-4), 'snack', '16:00', 'f-riegel', 55),
  Q(d(-4), 'dinner', '20:00', 'Geburtstagsessen im Restaurant (geschätzt)', 1150, 42, 118, 52),
  // Sa 21.11.
  Rc(d(-3), 'breakfast', '09:15', 'r-pfannkuchen'), Fd(d(-3), 'breakfast', '09:15', 'f-kaffee', 200), Rc(d(-3), 'lunch', '13:30', 'r-pasta-thunfisch'),
  Fd(d(-3), 'snack', '16:30', 'f-banane', 120), Fd(d(-3), 'snack', '16:30', 'f-schoko', 20), Rc(d(-3), 'dinner', '19:30', 'r-lachs'), Fd(d(-3), 'snack', '21:00', 'f-bier', 330),
  // So 22.11.
  Rc(d(-2), 'breakfast', '09:30', 'r-ruehrei'), Fd(d(-2), 'breakfast', '09:30', 'f-kaffee', 200), Q(d(-2), 'lunch', '13:30', 'Sonntagsessen bei den Eltern (geschätzt)', 950, 48, 90, 42),
  Q(d(-2), 'snack', '16:00', 'Apfelkuchen, 1 Stück (geschätzt)', 320, 4, 46, 13), Rc(d(-2), 'dinner', '19:15', 'r-skyr-bowl'), Fd(d(-2), 'snack', '20:30', 'f-bier', 330), Fd(d(-2), 'snack', '21:30', 'f-bier', 330),
  // Mo 23.11. (Training)
  Rc(d(-1), 'breakfast', '07:40', 'r-skyr-bowl'), Fd(d(-1), 'breakfast', '07:40', 'f-hafermilch', 100), Fd(d(-1), 'snack', '10:00', 'f-banane', 120), Rc(d(-1), 'lunch', '12:30', 'r-linsen-curry'),
  Fd(d(-1), 'snack', '16:00', 'f-riegel', 55), Rc(d(-1), 'dinner', '20:00', 'r-pasta-thunfisch'), Fd(d(-1), 'snack', '21:20', 'f-whey', 30), Fd(d(-1), 'snack', '21:20', 'f-milch', 250),
  // Di 24.11. (heute, 09:30)
  Fd(TODAY, 'breakfast', '07:40', 'f-skyr', 250, { amount: '250 g · Schüssel' }), Fd(TODAY, 'breakfast', '07:40', 'f-haferflocken', 50), Fd(TODAY, 'breakfast', '07:40', 'f-blaubeeren', 80),
  Fd(TODAY, 'breakfast', '07:40', 'f-walnuesse', 15), Fd(TODAY, 'breakfast', '07:40', 'f-honig', 10), Fd(TODAY, 'breakfast', '07:55', 'f-kaffee', 200), Fd(TODAY, 'breakfast', '07:55', 'f-hafermilch', 100),
  Fd(TODAY, 'snack', '09:10', 'f-apfel', 180), Fd(TODAY, 'snack', '09:10', 'f-mandeln', 20),
  Q(TODAY, 'lunch', null, 'Quiche mit Salat · Café Moll (vorab geschätzt)', 720, 26, 52, 44, { prelogged: true, eventId: 'e5', amount: 'Schätzung · Mittag mit Jana' }),
];

for (const e of nutDiary) { const f = FOOD[e.foodId]; if (f?.alcohol && e.grams) e.alcohol = r1((f.alcohol * e.grams) / 100); }

// -------------------------------------------------------------------- Wasser
const wE = (id, time, ml, vessel) => ({ id, date: TODAY, time, ml, vessel });
export const nutWater = {
  goal: 2500,
  vessels: [{ id: 'v-schluck', label: 'Schluck', ml: 150, icon: 'droplet' }, { id: 'v-glas', label: 'Glas', ml: 250, icon: 'glass-water' }, { id: 'v-tasse', label: 'Tasse', ml: 200, icon: 'coffee' }, { id: 'v-flasche', label: 'Meine Flasche', ml: 750, icon: 'cup-soda' }],
  entries: [wE('w1', '07:20', 250, 'Glas'), wE('w2', '08:05', 500, 'Flasche'), wE('w3', '09:15', 250, 'Glas')],
  week: [{ date: d(-6), ml: 2200 }, { date: d(-5), ml: 1800 }, { date: d(-4), ml: 2600 }, { date: d(-3), ml: 2400 }, { date: d(-2), ml: 2750 }, { date: d(-1), ml: 2300 }],
};

// ------------------------------------------------------------------ Ziele
// Körperwerte kommen aus der Fitness-Welt (gemeinsames Profil: Größe, Gewicht, Zielgewicht)
const profileBase = { sex: 'm', age: 38, heightCm: fitnessProfile.heightCm, weightKg: bodySummary.weightKg, goalWeightKg: fitnessProfile.goalKg, activity: 'aktiv', goalType: 'abnehmen', pace: 0.27, preset: 'eiweiss' };
export const nutGoals = { kcal: 2400, protein: 140, carbs: 291, fat: 75, fiber: 30, water: 2500, trainingDays: trainingProgram.days.map((x) => x.weekdayLabel), trainingBonus: 150, useTrainingBonus: false, includeActivity: false, showNumbers: true, setOn: d(-21) };
const bodyTrend = trendOf([...bodyWeightLog].sort((a, b) => (a.date < b.date ? -1 : 1)));
export const nutProfile = { ...profileBase, bmr: bmr(profileBase), tdee: tdee(profileBase),
  weightTrend: [-49, -42, -35, -28, -21, -14, -7, 0].map((n) => d(n)).map((date) => ({ date, kg: r1(([...bodyTrend].filter((w) => w.date <= date).pop() || bodyTrend[0]).trend) })) }; // geglätteter Trend wie in Fitness (nicht die Tageszahl)

// ------------------------------------------------------------------ Plan
const P = (date, meal, rid, o = {}) => ({ id: `p-${date.slice(8)}-${meal}`, date, meal, kind: 'recipe', recipeId: rid, servings: 1, status: 'planned', ...o });
const PF = (date, meal, foodId, grams, o = {}) => ({ id: `p-${date.slice(8)}-${meal}${o.suffix || ''}`, date, meal, kind: 'food', foodId, grams, servings: 1, status: 'planned', ...o });
const PO = (date, meal, label, kcal, protein, o = {}) => ({ id: `p-${date.slice(8)}-${meal}`, date, meal, kind: 'out', label, kcal, protein, carbs: 0, fat: 0, servings: 1, status: 'planned', ...o });
export const nutPlan = [
  P(d(-1), 'breakfast', 'r-skyr-bowl', { status: 'done' }), P(d(-1), 'lunch', 'r-linsen-curry', { status: 'done' }), P(d(-1), 'dinner', 'r-pasta-thunfisch', { status: 'done' }),
  P(TODAY, 'breakfast', 'r-skyr-bowl', { status: 'done' }), PO(TODAY, 'lunch', 'Mittag mit Jana · Café Moll', 720, 26, { status: 'done', eventId: 'e5', note: 'Termin 12:30' }),
  P(TODAY, 'dinner', 'r-lachs'), PF(TODAY, 'snack', 'f-quark', 250, { note: 'mit Blaubeeren' }),
  P(d(1), 'breakfast', 'r-ruehrei'), P(d(1), 'lunch', 'r-reis-bowl'), P(d(1), 'dinner', 'r-pasta-thunfisch'), PF(d(1), 'snack', 'f-whey', 30, { note: 'nach dem Training' }),
  P(d(2), 'breakfast', 'r-skyr-bowl'), P(d(2), 'lunch', 'r-kichererbsen-salat'), P(d(2), 'dinner', 'r-linsen-curry'),
  P(d(3), 'breakfast', 'r-pfannkuchen'), P(d(3), 'lunch', 'r-reis-bowl', { note: 'Reste' }), PO(d(3), 'dinner', 'Abendessen auswärts', 800, 30),
  P(d(4), 'breakfast', 'r-ruehrei'), PO(d(4), 'lunch', 'Wochenend-Brunch', 750, 28), P(d(4), 'dinner', 'r-lachs'),
  P(d(5), 'breakfast', 'r-skyr-bowl'), PO(d(5), 'lunch', 'Wanderung Taunus · Picknick', 650, 25), P(d(5), 'dinner', 'r-linsen-curry', { note: 'Reste' }),
];
for (const p of nutPlan) {
  if (p.kind === 'recipe') p.label = REC[p.recipeId].title;
  if (p.kind === 'food') p.label = `${FOOD[p.foodId].name}${p.grams ? ` (${p.grams} g)` : ''}`;
  const n = planNutrition(p, nutRecipes, nutFoods); // Nährwerte am Planpunkt zwischenspeichern (Komponenten ohne Rezept-Daten)
  Object.assign(p, { kcal: n.kcal, protein: n.protein, carbs: n.carbs, fat: n.fat });
}

// Heute: erledigte Planpunkte (Frühstück, Snack) spiegeln das Tagebuch, damit Wochenplan und Übersicht dieselbe Tagessumme zeigen.
{
  const asEaten = (meal) => { const t = totals(dayEntries(nutDiary, TODAY).filter((e) => e.meal === meal && !e.prelogged)); return { kcal: t.kcal, protein: t.protein, carbs: t.carbs, fat: t.fat }; };
  Object.assign(nutPlan.find((p) => p.date === TODAY && p.meal === 'breakfast'), asEaten('breakfast'));
  const at = nutPlan.findIndex((p) => p.date === TODAY && p.meal === 'snack');
  nutPlan.splice(at, 0, { id: `p-${TODAY.slice(8)}-snack-done`, date: TODAY, meal: 'snack', kind: 'food', foodId: 'f-apfel', grams: 180, label: 'Apfel und Mandeln', servings: 1, status: 'done', ...asEaten('snack') });
}

// -------------------------------------------------------- Einkauf & Vorlagen
export const nutShopping = {
  rangeDays: 3, pantry: ['f-olivenoel', 'f-honig', 'f-haferflocken', 'f-reis'], checked: { 'f-zwiebel': true },
  manual: [{ id: 'm-1', name: 'Spülmittel', aisle: 'Sonstiges', qty: '1 Flasche' }], recipeAdds: [], budgetMonth: 450, spentMonth: Math.round(transactions.filter((t) => t.category === 'Lebensmittel' && t.date.startsWith('2026-11')).reduce((a, t) => a + Math.abs(t.amount), 0) * 100) / 100,
};
export const nutTemplates = [
  { id: 'tpl-bowl', name: 'Meine Skyr-Bowl', meal: 'breakfast', items: [['f-skyr', 250], ['f-haferflocken', 50], ['f-blaubeeren', 80], ['f-walnuesse', 15], ['f-honig', 10]] },
  { id: 'tpl-shake', name: 'Shake nach dem Training', meal: 'snack', items: [['f-whey', 30], ['f-milch', 250], ['f-banane', 120]] },
  { id: 'tpl-brot', name: 'Brotzeit mit Hummus', meal: 'dinner', items: [['f-vollkornbrot', 100], ['f-hummus', 50], ['f-gurke', 150], ['f-tomate', 100]] },
].map((t) => ({ ...t, items: t.items.map(([foodId, g]) => ({ foodId, g })), kcal: Math.round(t.items.reduce((a, [id, g]) => a + per(FOOD[id], g).kcal, 0)) }));

// ------------------------------------------------------ Verlauf (35 Tage)
const dayRow = (date) => { const t = totals(dayEntries(nutDiary, date)); return { date, kcal: t.kcal, protein: t.protein, carbs: t.carbs, fat: t.fat, fiber: t.fiber, logged: t.count > 0, partial: date === TODAY }; };
const synth = (i) => { // deterministische Vorgeschichte (vor dem Tagebuch-Zeitraum)
  const off = [4, 11, 17, 25].includes(i), we = [0, 6].includes(new Date(`${d(-35 + i)}T12:00:00`).getDay());
  const kcal = Math.round(2330 + 190 * Math.sin(i * 1.7) + (we ? 140 : 0));
  const protein = Math.round(126 + 13 * Math.sin(i * 2.3) + (we ? -8 : 0));
  return { date: d(-35 + i), kcal: off ? 0 : kcal, protein: off ? 0 : protein, carbs: off ? 0 : Math.round((kcal - protein * 4) * 0.58 / 4), fat: off ? 0 : Math.round((kcal - protein * 4) * 0.42 / 9), fiber: off ? 0 : Math.round(24 + 5 * Math.sin(i * 1.3)), logged: !off, partial: false };
};
export const nutHistory = [...Array.from({ length: 28 }, (_, i) => synth(i)), ...[-6, -5, -4, -3, -2, -1, 0].map((n) => dayRow(d(n)))];
for (const h of nutHistory) { const w = nutWater.week.find((x) => x.date === h.date); h.water = h.date === TODAY ? nutWater.entries.reduce((a, e) => a + e.ml, 0) : w ? w.ml : h.logged ? 2000 + Math.round(400 * Math.sin(h.kcal)) : 0; }

// -------------------------------------------------- Kurzüberblick für andere Module
const tToday = totals(dayEntries(nutDiary, TODAY));
const dinner = nutPlan.find((p) => p.date === TODAY && p.meal === 'dinner' && p.status === 'planned');
export const nutSummary = {
  date: TODAY, goalKcal: nutGoals.kcal, eatenKcal: tToday.kcal, leftKcal: nutGoals.kcal - tToday.kcal,
  protein: tToday.protein, proteinGoal: nutGoals.protein, waterMl: nutWater.entries.reduce((a, e) => a + e.ml, 0), waterGoal: nutGoals.water,
  nextMeal: dinner ? { meal: 'Abend', title: REC[dinner.recipeId]?.title, kcal: planNutrition(dinner, nutRecipes, nutFoods).kcal } : null,
  weightKg: nutProfile.weightKg, goalWeightKg: nutProfile.goalWeightKg, foodBudgetLeft: r1(nutShopping.budgetMonth - nutShopping.spentMonth),
};

/** Launchpad-Kennzahlen (Vertrag `<modul>Summary`): die erste Kennzahl steht auf der Modulkachel. Aus `nutSummary` abgeleitet. */
const nutKpis = (S) => [
  { label: 'übrig', value: num(S.leftKcal), unit: 'kcal', icon: 'flame', tone: 'accent', to: 'nutrition.home' },
  { label: 'Eiweiß', value: num(Math.round(S.protein)), unit: 'g', icon: 'beef', tone: 'info', to: 'nutrition.log' },
  { label: 'Wasser', value: num(S.waterMl), unit: 'ml', icon: 'droplet', tone: 'info', to: 'nutrition.water' },
];
export const nutritionSummary = { kpis: nutKpis(nutSummary) };
export const nutritionHints = [
  ...(nutSummary.nextMeal ? [{ id: 'h-nut-dinner', text: `Heute Abend steht „${nutSummary.nextMeal.title}“ auf dem Plan (${num(nutSummary.nextMeal.kcal)} kcal).`, source: 'nutPlan', module: 'nutrition', tone: 'info', to: 'nutrition.plan' }] : []),
  { id: 'h-nut-water', text: `Wasser heute: ${num(nutSummary.waterMl)} von ${num(nutSummary.waterGoal)} ml.`, source: 'nutWater', module: 'nutrition', tone: 'info', to: 'nutrition.water' },
];
export const nutritionSearch = nutTemplates.map((t) => ({ id: `template:${t.id}`, type: 'Vorlage', title: t.name, subtitle: `${num(t.kcal)} kcal · ${t.items.length} Zutaten`, module: 'nutrition', to: 'nutrition.log', params: { id: t.id } }));
export const nutritionNotifications = [
  { id: 'n-nut', title: `Wasser: ${num(nutSummary.waterMl)} von ${num(nutSummary.waterGoal)} ml`, text: 'Mit einem Tipp trägst du ein Glas ein.', module: 'nutrition', tone: 'neutral', priority: 'leise', time: '2026-11-24T08:30:00', to: 'nutrition.water' },
];

// --- Szenarien: Erster Start (nichts erfasst) und Stress-Tag (dreifaches Tagebuch, Summen folgen) --------------------------
const summaryFor = (diary, waterMl, spent) => {
  const t = totals(dayEntries(diary, TODAY));
  return { ...nutSummary, eatenKcal: t.kcal, leftKcal: nutGoals.kcal - t.kcal, protein: t.protein, waterMl, nextMeal: null, foodBudgetLeft: r1(nutShopping.budgetMonth - spent) };
};
const stressDiary = triple(nutDiary);
const stressWaterEntries = triple(nutWater.entries);
const stressWaterMl = stressWaterEntries.reduce((a, e) => a + e.ml, 0);
const stressSummary = { ...summaryFor(stressDiary, stressWaterMl, nutShopping.spentMonth), nextMeal: nutSummary.nextMeal };
const stressToday = totals(dayEntries(stressDiary, TODAY));
export const scenarios = {
  erststart: {
    nutWater: { goal: nutGoals.water, vessels: nutWater.vessels, entries: [], week: [] },
    nutShopping: { ...nutShopping, pantry: [], checked: {}, manual: [], recipeAdds: [], spentMonth: 0 },
    nutHistory: [],
    // Noch kein Trainingsprogramm (siehe Fitness-Erststart): keine Trainingstage, damit kein Hinweis „Morgen ist Trainingstag“ erscheint.
    nutGoals: { ...nutGoals, trainingDays: [] },
    nutSummary: { ...summaryFor([], 0, 0), foodBudgetLeft: nutShopping.budgetMonth },
    nutritionSummary: { kpis: [{ label: 'Tagesziel', value: num(nutGoals.kcal), unit: 'kcal', icon: 'flame', tone: 'accent', to: 'nutrition.goals' }] },
    nutritionHints: [], nutritionSearch: [], nutritionNotifications: [],
  },
  stress: {
    nutDiary: stressDiary,
    nutWater: { ...nutWater, entries: stressWaterEntries },
    nutHistory: nutHistory.map((h) => (h.date === TODAY ? { ...h, kcal: stressToday.kcal, protein: stressToday.protein, carbs: stressToday.carbs, fat: stressToday.fat, fiber: stressToday.fiber, water: stressWaterMl } : h)),
    nutSummary: stressSummary,
    nutritionSummary: { kpis: nutKpis(stressSummary) },
  },
};
