// Vorexa handles plan upgrades manually over WhatsApp rather than a self-serve billing flow —
// keep the number/message in one place so it's a one-line change if it ever needs to update.
const WHATSAPP_NUMBER = '2347017470501';
const WHATSAPP_MESSAGE = "Hi! I'd like to upgrade my Vorexa plan.";

export const upgradeWhatsAppUrl = () =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;
