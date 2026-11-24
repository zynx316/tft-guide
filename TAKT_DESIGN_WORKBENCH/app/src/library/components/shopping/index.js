// Komponentenbereich "shopping": Einkauf & Haushalt (Listen, Laden-Modus, Vorräte, Wartung, Plan-Import, Budget). CSS-Präfix tk-shp…
// Logik ohne UI in _logic.js (testbar), geteilte UI-Hilfen und CSS in _shopping.js (das CSS steht in shop-lists).
import shopLists from './shop-lists.js';
import shopList from './shop-list.js';
import shopQuickAdd from './shop-quick-add.js';
import shopStoreMode from './shop-store-mode.js';
import shopPantry from './shop-pantry.js';
import shopHousehold from './shop-household.js';
import shopPlanImport from './shop-plan-import.js';
import shopBudget from './shop-budget.js';
import shopNextTrip from './shop-next-trip.js';
import shopNextUp from './shop-next-up.js';
import shopStores from './shop-stores.js';

export default [shopLists, shopList, shopQuickAdd, shopStoreMode, shopPantry, shopHousehold, shopPlanImport, shopBudget, shopNextTrip, shopNextUp, shopStores];
