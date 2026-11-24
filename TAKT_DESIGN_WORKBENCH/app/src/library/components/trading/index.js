// Komponentenbereich "trading" – Trading (Übersicht, Watchlist, Depot, Wertpapier, Order, Alarme, Dividenden, Transaktionen, Aufteilung, Wertentwicklung).
// Gemeinsame Helfer: _calc.js (Rechnen, rein) · _trd.js (UI-Bausteine, Datenslots, Basis-CSS) · _order*.js (Order-Logik und -Bausteine)
// · _seeddata.js (fiktive Kursverläufe und Demo-Bestände) · _example.js (Galerie-Daten aus der Welt) · _text.js (zentrale Texte).
import depotHero from './depot-hero.js';
import movers from './movers.js';
import watchlist from './watchlist.js';
import positions from './positions.js';
import alerts from './alerts.js';
import dividends from './dividends.js';
import history from './history.js';
import allocation from './allocation.js';
import performance from './performance.js';
import securityHead from './security-head.js';
import securityInfo from './security-info.js';
import upcoming from './upcoming.js';
import hints from './hints.js';
import marketStatus from './market-status.js';
import orderList from './order-list.js';
import positionFocus from './position-focus.js';

export default [...depotHero, ...movers, ...watchlist, ...positions, ...alerts, ...dividends, ...history, ...allocation, ...performance, ...securityHead, ...securityInfo, ...upcoming, ...hints, ...marketStatus, ...orderList, ...positionFocus];
