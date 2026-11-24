// Domänen-Komponenten "insights" – Vertrieb, Trading, Fitness (Referenz), Finanzen (Referenz).
import channelCards from './channel-cards.js';
import orderPipeline from './order-pipeline.js';
import priceChart from './price-chart.js';
import portfolioSummary from './portfolio-summary.js';
import orderTicket from './order-ticket.js';
import activityRings from './activity-rings.js';
import workoutCard from './workout-card.js';
import accountCards from './account-cards.js';
import transactionList from './transaction-list.js';

export default [...channelCards, ...orderPipeline, ...priceChart, ...portfolioSummary, ...orderTicket, ...activityRings, ...workoutCard, ...accountCards, ...transactionList];
