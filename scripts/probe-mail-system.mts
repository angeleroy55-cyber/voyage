import assert from "node:assert/strict";
import {
  getMailerSummary,
  renderBookingAdminMessage,
  renderBookingCustomerMessage,
  renderNewsletterWelcomeMessage,
} from "../src/server/mail";

const summary = getMailerSummary();
assert.equal(typeof summary.enabled, "boolean");

const booking = {
  reference: "GS-TEST01",
  customerName: "Jean Dupont",
  customerEmail: "jean@example.com",
  customerPhone: "0102030405",
  destination: "Marrakech",
  country: "Maroc",
  offerTitle: "Riad & spa",
  totalPrice: 1299,
  travellers: 2,
  insurance: true,
  paymentMethod: "cb",
  paymentMethodLabel: "Carte bancaire",
  instalments: 4,
  departureDateLabel: "12 - 19 octobre 2026",
  notes: "Chambre calme",
};

const customerMessage = renderBookingCustomerMessage(booking);
assert.match(customerMessage.subject, /GS-TEST01/);
assert.match(customerMessage.html, /Marrakech/);

const adminMessage = renderBookingAdminMessage(booking);
assert.match(adminMessage.subject, /GS-TEST01/);
assert.match(adminMessage.text, /Jean Dupont/);

// Virement : les coordonnées bancaires doivent apparaître dans l'e-mail
// client, avec la référence en motif, et nulle part quand aucun IBAN n'est
// renseigné (cas `booking` ci-dessus, sans `bankDetails`).
const bookingSepa = {
  ...booking,
  paymentMethod: "sepa",
  paymentMethodLabel: "Virement bancaire (sans frais)",
  bankDetails: { holder: "Jean XIBERRAS", iban: "FR7616598000014000111233071", bic: "FPELFR21XXX" },
};
const sepaMessage = renderBookingCustomerMessage(bookingSepa);
assert.match(sepaMessage.html, /FR7616598000014000111233071/);
assert.match(sepaMessage.html, /GS-TEST01/);
assert.match(sepaMessage.text, /FPELFR21XXX/);
assert.doesNotMatch(customerMessage.html, /IBAN/);

const newsletterMessage = renderNewsletterWelcomeMessage({
  email: "jean@example.com",
  interests: ["Circuits", "Croisières"],
});
assert.match(newsletterMessage.subject, /inscription/i);
assert.match(newsletterMessage.html, /Circuits/);

console.log("mail system ok");
