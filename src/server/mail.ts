import nodemailer from "nodemailer";
import { BRAND } from "@/lib/data";
import { STATUS_LABELS, paymentLabel } from "@/lib/constants";
import { dateRange, price } from "@/lib/format";
import { prisma } from "@/server/prisma";

type SiteMailSettings = {
  name: string;
  phone: string;
  email: string;
};

export type MailMessage = {
  subject: string;
  text: string;
  html: string;
};

export type BookingMailData = {
  reference: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  destination: string;
  country: string;
  offerTitle: string;
  totalPrice: number;
  travellers: number;
  insurance: boolean;
  paymentMethodLabel: string;
  instalments: number;
  departureDateLabel: string;
  notes: string;
  statusLabel?: string;
  paidAmount?: number;
  remainingAmount?: number;
  paidDelta?: number;
  sourceLabel?: string;
};

type NewsletterMailData = {
  email: string;
  interests: string[];
};

type SendMailInput = MailMessage & {
  to: string | string[];
};

let transporterCache: nodemailer.Transporter | null = null;

function toInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : fallback;
}

function toBool(value: string | undefined, fallback: boolean): boolean {
  if (!value) return fallback;
  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatSender(name: string, address: string): string {
  if (address.includes("<") && address.includes(">")) return address;
  return `${name} <${address}>`;
}

function paymentHint(instalments: number): string {
  return instalments > 1 ? `${instalments} fois sans frais` : "En une fois à la confirmation";
}

function defaultSiteSettings(): SiteMailSettings {
  return {
    name: BRAND.name,
    phone: BRAND.phone,
    email: BRAND.email,
  };
}

async function readSiteMailSettings(): Promise<SiteMailSettings> {
  const rows = await prisma.setting.findMany({
    where: { key: { in: ["site.name", "site.phone", "site.email"] } },
    select: { key: true, value: true },
  });
  const values = Object.fromEntries(rows.map((row) => [row.key, row.value]));
  return {
    name: values["site.name"] || BRAND.name,
    phone: values["site.phone"] || BRAND.phone,
    email: values["site.email"] || BRAND.email,
  };
}

export function getMailerSummary() {
  const host = process.env.SMTP_HOST?.trim() || "";
  const port = toInt(process.env.SMTP_PORT, 465);
  const secure = toBool(process.env.SMTP_SECURE, port === 465);
  const user = process.env.SMTP_USER?.trim() || "";
  const pass = process.env.SMTP_PASSWORD?.trim() || "";
  const from = process.env.SMTP_FROM?.trim() || "";
  const notificationEmail = process.env.BOOKING_NOTIFICATION_EMAIL?.trim() || "";
  const imapHost = process.env.IMAP_HOST?.trim() || "";

  return {
    enabled: Boolean(host && user && pass),
    host,
    port,
    secure,
    user,
    from,
    notificationEmail,
    imapHost,
  };
}

export function mailConfigured(): boolean {
  return getMailerSummary().enabled;
}

function getTransporter() {
  if (transporterCache) return transporterCache;

  const summary = getMailerSummary();
  if (!summary.enabled) {
    throw new Error("Messagerie SMTP non configurée.");
  }

  transporterCache = nodemailer.createTransport({
    host: summary.host,
    port: summary.port,
    secure: summary.secure,
    auth: {
      user: summary.user,
      pass: process.env.SMTP_PASSWORD,
    },
    tls: {
      servername: summary.host,
    },
  });

  return transporterCache;
}

export async function verifyMailer() {
  if (!mailConfigured()) {
    return { ok: false as const, reason: "disabled" };
  }

  await getTransporter().verify();
  return { ok: true as const };
}

async function sendMail(input: SendMailInput) {
  if (!mailConfigured()) return { skipped: true as const };

  const site = await readSiteMailSettings();
  const summary = getMailerSummary();
  const from = summary.from || formatSender(site.name, site.email || summary.user);

  const info = await getTransporter().sendMail({
    from,
    to: input.to,
    replyTo: site.email || summary.user,
    subject: input.subject,
    text: input.text,
    html: input.html,
  });

  return { skipped: false as const, messageId: info.messageId };
}

async function sendMailSafe(label: string, input: SendMailInput) {
  try {
    return await sendMail(input);
  } catch (error) {
    console.error(`[mail] ${label}`, error);
    return { skipped: false as const, error: true as const };
  }
}

function renderDefinitionRows(lines: Array<{ label: string; value: string }>) {
  return lines
    .map(
      (line) =>
        `<tr><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#64748b;">${escapeHtml(line.label)}</td><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#0f172a;font-weight:600;">${escapeHtml(line.value)}</td></tr>`,
    )
    .join("");
}

function contactBlock(site: SiteMailSettings) {
  return `Contact : ${site.email} • ${site.phone}`;
}

function renderMailShell(site: SiteMailSettings, title: string, intro: string, body: string) {
  return [
    `<div style="font-family:Arial,sans-serif;background:#f8fafc;padding:24px;color:#0f172a;">`,
    `<div style="max-width:680px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:18px;overflow:hidden;">`,
    `<div style="background:#0f245e;color:#ffffff;padding:20px 24px;">`,
    `<div style="font-size:12px;letter-spacing:0.08em;text-transform:uppercase;opacity:0.8;">${escapeHtml(site.name)}</div>`,
    `<h1 style="margin:10px 0 0;font-size:24px;line-height:1.3;">${escapeHtml(title)}</h1>`,
    `</div>`,
    `<div style="padding:24px;">`,
    `<p style="margin:0 0 16px;line-height:1.6;">${escapeHtml(intro)}</p>`,
    body,
    `<p style="margin:24px 0 0;line-height:1.6;">${escapeHtml(contactBlock(site))}</p>`,
    `</div></div></div>`,
  ].join("");
}

export function renderBookingCustomerMessage(
  booking: BookingMailData,
  site: SiteMailSettings = defaultSiteSettings(),
): MailMessage {
  const subject = `${booking.reference} · demande bien enregistrée`;
  const destination = [booking.destination, booking.country].filter(Boolean).join(", ");
  const rows = renderDefinitionRows([
    { label: "Référence", value: booking.reference },
    { label: "Séjour", value: booking.offerTitle },
    { label: "Destination", value: destination || "À confirmer" },
    { label: "Voyageurs", value: String(booking.travellers) },
    { label: "Dates souhaitées", value: booking.departureDateLabel },
    { label: "Paiement", value: booking.paymentMethodLabel },
    { label: "Échéancier", value: paymentHint(booking.instalments) },
    { label: "Montant", value: price(booking.totalPrice) },
  ]);

  const notes = booking.notes
    ? `<p style="margin:18px 0 0;line-height:1.6;"><strong>Précisions transmises :</strong> ${escapeHtml(booking.notes)}</p>`
    : "";

  return {
    subject,
    text: [
      `Bonjour ${booking.customerName},`,
      "",
      `Votre demande ${booking.reference} a bien été reçue pour ${booking.offerTitle}.`,
      `Destination : ${destination || "À confirmer"}`,
      `Dates souhaitées : ${booking.departureDateLabel}`,
      `Montant estimé : ${price(booking.totalPrice)}`,
      `Paiement choisi : ${booking.paymentMethodLabel} (${paymentHint(booking.instalments)})`,
      "",
      "Un conseiller vérifie maintenant les disponibilités et vous recontacte sous 24 h.",
      "",
      contactBlock(site),
    ].join("\n"),
    html: renderMailShell(
      site,
      "Demande bien enregistrée",
      `Bonjour ${booking.customerName}, votre demande ${booking.reference} a bien été enregistrée.`,
      [
        `<table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">${rows}</table>`,
        notes,
        `<p style="margin:18px 0 0;line-height:1.6;">Un conseiller vérifie les disponibilités et vous recontacte sous 24 h. Aucun montant n'est débité à cette étape.</p>`,
      ].join(""),
    ),
  };
}

export function renderBookingAdminMessage(
  booking: BookingMailData,
  site: SiteMailSettings = defaultSiteSettings(),
): MailMessage {
  const subject = `${booking.reference} · nouvelle demande ${booking.sourceLabel || "site"}`;
  const destination = [booking.destination, booking.country].filter(Boolean).join(", ");
  const rows = renderDefinitionRows([
    { label: "Référence", value: booking.reference },
    { label: "Origine", value: booking.sourceLabel || "site" },
    { label: "Client", value: booking.customerName },
    { label: "E-mail", value: booking.customerEmail },
    { label: "Téléphone", value: booking.customerPhone || "Non renseigné" },
    { label: "Séjour", value: booking.offerTitle },
    { label: "Destination", value: destination || "À confirmer" },
    { label: "Dates", value: booking.departureDateLabel },
    { label: "Voyageurs", value: String(booking.travellers) },
    { label: "Montant", value: price(booking.totalPrice) },
    { label: "Paiement", value: `${booking.paymentMethodLabel} · ${paymentHint(booking.instalments)}` },
  ]);

  const notes = booking.notes
    ? `<p style="margin:18px 0 0;line-height:1.6;"><strong>Notes client :</strong> ${escapeHtml(booking.notes)}</p>`
    : "";

  return {
    subject,
    text: [
      `Nouvelle demande ${booking.reference}`,
      `Origine : ${booking.sourceLabel || "site"}`,
      `Client : ${booking.customerName}`,
      `E-mail : ${booking.customerEmail}`,
      `Téléphone : ${booking.customerPhone || "Non renseigné"}`,
      `Séjour : ${booking.offerTitle}`,
      `Destination : ${destination || "À confirmer"}`,
      `Dates : ${booking.departureDateLabel}`,
      `Voyageurs : ${booking.travellers}`,
      `Montant : ${price(booking.totalPrice)}`,
      `Paiement : ${booking.paymentMethodLabel} (${paymentHint(booking.instalments)})`,
      booking.notes ? `Notes : ${booking.notes}` : "",
      "",
      contactBlock(site),
    ]
      .filter(Boolean)
      .join("\n"),
    html: renderMailShell(
      site,
      "Nouvelle demande à traiter",
      `Une nouvelle demande ${booking.reference} vient d'être enregistrée.`,
      `<table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">${rows}</table>${notes}`,
    ),
  };
}

export function renderNewsletterWelcomeMessage(
  data: NewsletterMailData,
  site: SiteMailSettings = defaultSiteSettings(),
): MailMessage {
  const interests = data.interests.length ? data.interests.join(", ") : "toutes nos inspirations";
  return {
    subject: "Votre inscription GoSéjour est confirmée",
    text: [
      `Bonjour,`,
      "",
      `Votre inscription à la newsletter ${site.name} est confirmée pour ${data.email}.`,
      `Centres d'intérêt : ${interests}.`,
      "",
      `Vous recevrez uniquement nos alertes utiles, sans surcharge.`,
      "",
      contactBlock(site),
    ].join("\n"),
    html: renderMailShell(
      site,
      "Inscription confirmée",
      `Votre inscription à la newsletter ${site.name} est bien active pour ${data.email}.`,
      `<p style="margin:0;line-height:1.6;">Centres d'intérêt retenus : <strong>${escapeHtml(interests)}</strong>.</p>`,
    ),
  };
}

export function renderBookingStatusMessage(
  booking: BookingMailData,
  site: SiteMailSettings = defaultSiteSettings(),
): MailMessage {
  const subject = `${booking.reference} · statut mis à jour : ${booking.statusLabel || "en cours"}`;
  return {
    subject,
    text: [
      `Bonjour ${booking.customerName},`,
      "",
      `Le statut de votre dossier ${booking.reference} a été mis à jour : ${booking.statusLabel || "en cours"}.`,
      `Séjour : ${booking.offerTitle}`,
      `Destination : ${[booking.destination, booking.country].filter(Boolean).join(", ") || "À confirmer"}`,
      "",
      contactBlock(site),
    ].join("\n"),
    html: renderMailShell(
      site,
      "Statut de dossier mis à jour",
      `Le dossier ${booking.reference} est maintenant au statut « ${booking.statusLabel || "en cours"} ».`,
      `<p style="margin:0;line-height:1.6;"><strong>${escapeHtml(booking.offerTitle)}</strong><br/>${escapeHtml([booking.destination, booking.country].filter(Boolean).join(", ") || "À confirmer")}</p>`,
    ),
  };
}

export function renderPaymentReceiptMessage(
  booking: BookingMailData,
  site: SiteMailSettings = defaultSiteSettings(),
): MailMessage {
  const subject = `${booking.reference} · paiement enregistré`;
  return {
    subject,
    text: [
      `Bonjour ${booking.customerName},`,
      "",
      `Nous avons enregistré un paiement de ${price(booking.paidDelta || 0)} pour votre dossier ${booking.reference}.`,
      `Déjà réglé : ${price(booking.paidAmount || 0)}`,
      `Reste à régler : ${price(booking.remainingAmount || 0)}`,
      "",
      contactBlock(site),
    ].join("\n"),
    html: renderMailShell(
      site,
      "Paiement enregistré",
      `Nous avons bien enregistré un paiement sur votre dossier ${booking.reference}.`,
      `<table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">${renderDefinitionRows([
        { label: "Paiement reçu", value: price(booking.paidDelta || 0) },
        { label: "Déjà réglé", value: price(booking.paidAmount || 0) },
        { label: "Reste à régler", value: price(booking.remainingAmount || 0) },
      ])}</table>`,
    ),
  };
}

async function loadBookingMailData(bookingId: string): Promise<BookingMailData | null> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      reference: true,
      customerName: true,
      customerEmail: true,
      customerPhone: true,
      travellers: true,
      insurance: true,
      totalPrice: true,
      notes: true,
      paymentMethod: true,
      instalments: true,
      departureDate: true,
      returnDate: true,
      paidAmount: true,
      status: true,
      offer: {
        select: {
          title: true,
          destination: true,
          country: true,
        },
      },
    },
  });

  if (!booking) return null;

  return {
    reference: booking.reference,
    customerName: booking.customerName,
    customerEmail: booking.customerEmail,
    customerPhone: booking.customerPhone,
    destination: booking.offer?.destination || "",
    country: booking.offer?.country || "",
    offerTitle: booking.offer?.title || "Offre retirée du catalogue",
    totalPrice: booking.totalPrice,
    travellers: booking.travellers,
    insurance: booking.insurance,
    paymentMethodLabel: paymentLabel(booking.paymentMethod),
    instalments: booking.instalments,
    departureDateLabel: dateRange(booking.departureDate, booking.returnDate),
    notes: booking.notes,
    statusLabel: STATUS_LABELS[booking.status] ?? booking.status,
    paidAmount: booking.paidAmount,
    remainingAmount: Math.max(0, booking.totalPrice - booking.paidAmount),
  };
}

function adminRecipient(site: SiteMailSettings) {
  const summary = getMailerSummary();
  return summary.notificationEmail || site.email || summary.user;
}

export async function sendBookingCreatedEmails(bookingId: string, sourceLabel: string) {
  if (!mailConfigured()) return;
  const booking = await loadBookingMailData(bookingId);
  if (!booking) return;

  const site = await readSiteMailSettings();
  const customerMessage = renderBookingCustomerMessage(booking, site);
  const adminMessage = renderBookingAdminMessage({ ...booking, sourceLabel }, site);

  await Promise.allSettled([
    sendMailSafe(`booking-customer:${booking.reference}`, {
      to: booking.customerEmail,
      ...customerMessage,
    }),
    sendMailSafe(`booking-admin:${booking.reference}`, {
      to: adminRecipient(site),
      ...adminMessage,
    }),
  ]);
}

export async function sendNewsletterWelcomeEmail(data: NewsletterMailData) {
  if (!mailConfigured()) return;
  const site = await readSiteMailSettings();
  const message = renderNewsletterWelcomeMessage(data, site);
  await sendMailSafe(`newsletter:${data.email}`, {
    to: data.email,
    ...message,
  });
}

export async function sendBookingStatusUpdateEmail(bookingId: string) {
  if (!mailConfigured()) return;
  const booking = await loadBookingMailData(bookingId);
  if (!booking || !booking.statusLabel) return;

  const site = await readSiteMailSettings();
  const message = renderBookingStatusMessage(booking, site);
  await sendMailSafe(`booking-status:${booking.reference}`, {
    to: booking.customerEmail,
    ...message,
  });
}

export async function sendPaymentReceiptEmail(bookingId: string, paidDelta: number) {
  if (!mailConfigured()) return;
  const booking = await loadBookingMailData(bookingId);
  if (!booking) return;

  const site = await readSiteMailSettings();
  const message = renderPaymentReceiptMessage({ ...booking, paidDelta }, site);
  await sendMailSafe(`booking-payment:${booking.reference}`, {
    to: booking.customerEmail,
    ...message,
  });
}
