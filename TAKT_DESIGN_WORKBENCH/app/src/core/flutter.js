// ============================================================================
// FLUTTER-BRÜCKE – Umsetzungsvorlagen für das TAKT-Flutter-Projekt (rein, auch Node).
//  * tokensToDart(): Design-Tokens als Dart (ThemeExtension + ColorScheme je Theme)
//  * LAYOUT_FLUTTER / COMPONENT_FLUTTER: Abbildung Layout/Komponente → Flutter-Widgets
// Die Spezifikation je Feature erzeugt core/spec.js.
// ============================================================================
import { base, themes, THEME_IDS, COLOR_ROLES, parseColor, TOKENS_VERSION } from '../design-system/tokens.js';

const hex2 = (n) => Math.round(n).toString(16).padStart(2, '0').toUpperCase();
/** CSS-Farbe → Dart `Color(0xAARRGGBB)` */
export function dartColor(css) {
  const c = parseColor(css); if (!c) return 'Color(0x00000000)';
  return `Color(0x${hex2((c.a ?? 1) * 255)}${hex2(c.r)}${hex2(c.g)}${hex2(c.b)})`;
}
const camel = (s) => s.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());
const dartNum = (v) => (Number.isInteger(v) ? `${v}.0` : String(v));

export function tokensToDart() {
  const roles = COLOR_ROLES;
  const cls = 'TaktColors';
  const lines = [];
  lines.push(`// GENERIERT von der TAKT Design Workbench (Tokens v${TOKENS_VERSION}). Nicht von Hand ändern –`);
  lines.push('// Werte in app/src/design-system/tokens.js pflegen und neu exportieren.');
  lines.push("import 'package:flutter/material.dart';", '');
  lines.push('/// Abstände, Radien, Größen und Typografie (theme-unabhängig).');
  lines.push('abstract final class TaktSpace {');
  for (const [k, v] of Object.entries(base.space)) lines.push(`  static const double s${k} = ${dartNum(v)};`);
  lines.push('}', '', 'abstract final class TaktRadius {');
  for (const [k, v] of Object.entries(base.radius)) lines.push(`  static const double ${k === 'pill' ? 'pill' : k} = ${dartNum(v)};`);
  lines.push('}', '', 'abstract final class TaktSize {');
  for (const [k, v] of Object.entries(base.size)) lines.push(`  static const double ${camel(k)} = ${dartNum(v)};`);
  lines.push('}', '', 'abstract final class TaktFontSize {');
  for (const [k, v] of Object.entries(base.font.size)) lines.push(`  static const double ${k === '2xl' ? 'xxl' : k === '3xl' ? 'xxxl' : k === '4xl' ? 'display' : k} = ${dartNum(v)};`);
  lines.push('}', '', 'abstract final class TaktBreakpoint {');
  for (const [k, v] of Object.entries(base.breakpoint)) lines.push(`  static const double ${k} = ${dartNum(v)};`);
  lines.push('}', '', 'abstract final class TaktMotion {');
  for (const [k, v] of Object.entries(base.motion)) if (k !== 'ease') lines.push(`  static const Duration ${k} = Duration(milliseconds: ${parseInt(v, 10)});`);
  lines.push('  static const Curve ease = Cubic(0.2, 0.7, 0.2, 1.0);', '}', '');
  lines.push(`/// Farbrollen als ThemeExtension – Zugriff: Theme.of(context).extension<${cls}>()!.accent`);
  lines.push(`@immutable\nclass ${cls} extends ThemeExtension<${cls}> {`);
  lines.push(`  const ${cls}({${roles.map((r) => `required this.${r}`).join(', ')}, required this.chart});`);
  for (const r of roles) lines.push(`  final Color ${r};`);
  lines.push('  final List<Color> chart;', '');
  for (const id of THEME_IDS) {
    const t = themes[id];
    lines.push(`  /// ${t.label}: ${t.note}`);
    lines.push(`  static const ${id} = ${cls}(`);
    for (const r of roles) lines.push(`    ${r}: ${dartColor(t.color[r])},`);
    lines.push(`    chart: [${t.chart.map(dartColor).join(', ')}],`, '  );');
  }
  lines.push('', '  @override');
  lines.push(`  ${cls} copyWith({${roles.map((r) => `Color? ${r}`).join(', ')}, List<Color>? chart}) => ${cls}(${roles.map((r) => `${r}: ${r} ?? this.${r}`).join(', ')}, chart: chart ?? this.chart);`);
  lines.push('', '  @override');
  lines.push(`  ${cls} lerp(ThemeExtension<${cls}>? other, double t) {`, `    if (other is! ${cls}) return this;`);
  lines.push(`    return ${cls}(${roles.map((r) => `${r}: Color.lerp(${r}, other.${r}, t)!`).join(', ')}, chart: [for (var i = 0; i < chart.length; i++) Color.lerp(chart[i], other.chart[i], t)!]);`, '  }', '}', '');
  lines.push('/// Fertige ThemeData je TAKT-Theme (Material 3).');
  lines.push('abstract final class TaktThemes {');
  for (const id of THEME_IDS) {
    const t = themes[id]; const dark = t.scheme === 'dark';
    lines.push(`  static ThemeData get ${id} => ThemeData(`);
    lines.push(`    useMaterial3: true, brightness: Brightness.${dark ? 'dark' : 'light'},`);
    lines.push(`    scaffoldBackgroundColor: ${dartColor(t.color.bg)},`);
    lines.push(`    colorScheme: ColorScheme.${dark ? 'dark' : 'light'}(`);
    lines.push(`      primary: ${dartColor(t.color.accent)}, onPrimary: ${dartColor(t.color.textOnAccent)}, secondary: ${dartColor(t.color.accent2)},`);
    lines.push(`      surface: ${dartColor(t.color.surface)}, onSurface: ${dartColor(t.color.text)}, error: ${dartColor(t.color.danger)},`);
    lines.push(`      surfaceContainerLow: ${dartColor(t.color.surface2)}, surfaceContainerHigh: ${dartColor(t.color.surface3)}, outline: ${dartColor(t.color.borderStrong)}, outlineVariant: ${dartColor(t.color.border)},`);
    lines.push('    ),');
    lines.push(`    extensions: const [TaktColors.${id}],`, '  );');
  }
  lines.push('}', '');
  return lines.join('\n');
}

/** Layout-Typ → Flutter-Umsetzung */
export const LAYOUT_FLUTTER = {
  stack: 'CustomScrollView/ListView mit Abschnitten; `narrow` → ConstrainedBox(maxWidth: 760) zentriert.',
  split: 'LayoutBuilder: ≥ 1024 → Row(Expanded(flex: 2) Haupt, Expanded(flex: 1) Seite); darunter Column (Seite nach Haupt, `asideFirstOnMobile` → vorher).',
  sidebar: 'LayoutBuilder: ≥ 600 → Row(SizedBox(width: 260/220) Panel, Expanded Inhalt); Mobile → ExpansionTile/Bottom-Sheet für das Panel.',
  grid: 'LayoutBuilder + Wrap/SliverGrid mit 12er-Raster: Breite je Block = span/12 (Tablet spanTablet, Mobile volle Breite).',
  tabs: 'DefaultTabController + TabBar + TabBarView (je Reiter eine ListView der Blöcke).',
};
export const REGION_FLUTTER = {
  header: 'Kopfbereich (SliverAppBar/SliverToBoxAdapter über dem Inhalt)',
  main: 'Hauptinhalt', aside: 'Seitenspalte (siehe split)', panel: 'Seitenleiste (siehe sidebar)',
  footer: 'Fußbereich am Ende der Liste', bottom: 'Fixiert unten: Scaffold.bottomSheet/persistentFooterButtons bzw. Positioned über der NavigationBar',
};

/** Bekannte Komponenten → Flutter-Widgets (Startpunkt; Komponenten können `flutter` im Vertrag selbst setzen). */
export const COMPONENT_FLUTTER = {
  'page-header': 'Eigenes TaktPageHeader (Text titleLarge + Untertitel + FilledButton/IconButton auf Mobile)',
  'view-switcher': 'SegmentedButton<String>',
  'search-filter': 'SearchBar + Wrap(FilterChip) / horizontale ListView auf Mobile',
  'action-bar': 'Wrap(FilledButton.tonal) bzw. GridView für Kacheln',
  'notice-banner': 'MaterialBanner-ähnliche Card mit Icon, Text, TextButton, Schließen',
  'metric-row': 'GridView/Wrap aus TaktMetricCard (Wert, Einheit, Trend, Sparkline via fl_chart)',
  'item-list': 'Card + ListView.separated(ListTile, Checkbox optional), Gruppen als Sticky-Header',
  'card-grid': 'SliverGrid (maxCrossAxisExtent ≈ minWidth) aus Card',
  'detail-panel': 'Card mit Titel, DataTable-artigen Zeilen (Row Label/Wert), IconButtons Bearbeiten/Löschen',
  'data-table': 'Desktop: DataTable/PaginatedDataTable mit Sortierung; Mobile: ListView aus Karten',
  'activity-feed': 'ListView mit Timeline-Zeilen (Icon-Container + Linie)',
  'progress-list': 'Column aus Zeilen mit LinearProgressIndicator (Farbe bei Überschreitung = danger)',
  chart: 'fl_chart: BarChart / LineChart / PieChart (Touch-Tooltips)',
  'form-card': 'Form + TextFormField/DropdownButtonFormField mit Validator; Mobile einspaltig',
  'quick-add': 'TextField(onSubmitted) + FilledButton.icon; als bottom-Region fixiert',
};

/** Flutter-Hinweis für eine Komponente (eigene Angabe im Vertrag > Tabelle > generisch). */
export const flutterHintFor = (def) => def?.flutter || COMPONENT_FLUTTER[def?.id] || `Eigenes Widget „Takt${(def?.id || 'Komponente').replace(/(^|-)([a-z])/g, (_, __, c) => c.toUpperCase())}“ nach Vorbild der Library-Komponente`;
