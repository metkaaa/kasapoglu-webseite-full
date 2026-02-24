/* ============================================================
   KASAPOGLU – Zentrale Konfiguration
   Alle Einstellungen an einer Stelle änderbar.
   ============================================================ */

var SITE_CONFIG = {

  /* --- Firmenname --- */
  name: 'Kasapoglu Schuh- & Schlüsseldienst',
  shortName: 'Kasapoglu',

  /* --- Kontaktdaten (Platzhalter anpassen) --- */
  phone: '+49 176 72995623',          // Telefonnummer
  email: 'info@kasapoglu-koblenz.de', // E-Mail
  whatsapp: '4917672995623',           // WhatsApp-Nummer (Landesvorwahl ohne +)

  /* --- Adresse --- */
  address: {
    street: 'Hohenfelderstraße 22',
    city: '56068 Koblenz',
    location: 'Löhr Center – ganz oben neben REWE',
    mapsUrl: 'https://maps.google.com/?q=Hohenfelderstraße+22+Koblenz',
    mapsEmbed: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2575.145!2d7.596!3d50.356!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNTDCsDIxJzIxLjYiTiA3wrAzNSc0NS42IkU!5e0!3m2!1sde!2sde!4v1234567890'
  },

  /* --- Öffnungszeiten (24h-Format) ---
     Tage: 0=Sonntag, 1=Montag, ... 6=Samstag
     Setze open/close auf null für geschlossene Tage */
  hours: {
    0: { open: null,  close: null,  label: 'Sonntag' },
    1: { open: '09:30', close: '20:00', label: 'Montag' },
    2: { open: '09:30', close: '20:00', label: 'Dienstag' },
    3: { open: '09:30', close: '20:00', label: 'Mittwoch' },
    4: { open: '09:30', close: '20:00', label: 'Donnerstag' },
    5: { open: '09:30', close: '20:00', label: 'Freitag' },
    6: { open: '09:30', close: '20:00', label: 'Samstag' }
  },

  /* --- Hintergrundbild (URL oder 'none') --- */
  backgroundImage: 'none',

  /* --- Supabase (Kontaktformular) ---
     ANON key is designed for public client-side usage. */
  supabase: {
    url: 'https://ttvrhjbuolemkqcbvmtx.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR0dnJoamJ1b2xlbWtxY2J2bXR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5NTY5NzIsImV4cCI6MjA4NzUzMjk3Mn0.scY_bgZcCMeWE9ZaRK6FirHaMm48C8v5ychNW8rFf9o'
  },

  /* --- Design Tokens --- */
  design: {
    primaryBlue: '#2563eb',
    primaryDark: '#1d4ed8',
    radius: '16px',
    font: "'Inter', sans-serif"
  }
};
