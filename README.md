# 🍺 Brouwgilde Breda — Digitaal Proefplatform

Een volledig proefplatform voor bierbeoordelingen, beerswaps en kampioenschappen.

---

## 🚀 Live zetten in 4 stappen

### Stap 1 — Supabase project aanmaken

1. Ga naar [supabase.com](https://supabase.com) en maak een **gratis account** aan
2. Klik **"New project"**
   - Kies een naam: `brouwgilde-breda`
   - Kies een sterk wachtwoord (bewaar dit!)
   - Regio: **West EU (Frankfurt)** is het dichtst bij Nederland
3. Wacht ~2 minuten tot het project klaar is

### Stap 2 — Database schema aanmaken

1. In je Supabase project, ga naar **SQL Editor** (linkermenu)
2. Klik **"New query"**
3. Kopieer de volledige inhoud van `supabase/schema.sql`
4. Plak het in de editor en klik **"Run"** (▶)
5. Je ziet: *"Success. No rows returned"* — dat is goed!

### Stap 3 — Eerste superuser instellen

1. Registreer jezelf via de app (zie stap 4 eerst)
   **OF** maak alvast een account aan via Supabase:
   - Ga naar **Authentication → Users → Add user**
   - Vul je e-mail en wachtwoord in
2. Voer daarna in de SQL Editor uit:
   ```sql
   UPDATE public.profiles
   SET role = 'superuser'
   WHERE id = (
     SELECT id FROM auth.users WHERE email = 'jouw@email.nl'
   );
   ```

### Stap 4 — Code op GitHub zetten

```bash
# In de map van dit project:
git init
git add .
git commit -m "Brouwgilde Breda — eerste versie"

# Maak een nieuwe repo op github.com, dan:
git remote add origin https://github.com/JOUWGEBRUIKERSNAAM/brouwgilde.git
git push -u origin main
```

### Stap 5 — Deployen op Vercel

1. Ga naar [vercel.com](https://vercel.com) en log in met je GitHub account
2. Klik **"Add New → Project"**
3. Selecteer je `brouwgilde` repository
4. Bij **"Environment Variables"** voeg je toe:

   | Name | Value |
   |------|-------|
   | `VITE_SUPABASE_URL` | `https://xxxxx.supabase.co` |
   | `VITE_SUPABASE_ANON_KEY` | `eyJ...` (lange key) |

   Je vindt deze waarden in Supabase onder **Project Settings → API**

5. Klik **"Deploy"**
6. Na ~1 minuut krijg je een URL zoals `https://brouwgilde.vercel.app` 🎉

---

## ⚙️ Lokaal ontwikkelen

```bash
# 1. Installeer dependencies
npm install

# 2. Maak .env.local aan (kopieer van .env.example)
cp .env.example .env.local
# Vul je Supabase URL en anon key in

# 3. Start de dev server
npm run dev
# → http://localhost:5173
```

---

## 👥 Gebruikersrollen

| Rol | Kan |
|-----|-----|
| **brouwer** | Bieren toevoegen, beoordelingen invullen |
| **admin** | + Proefsessies aanmaken en beheren |
| **superuser** | Alles, altijd, ook vergrendelde formulieren bewerken |

Nieuwe gebruikers krijgen automatisch de rol **brouwer**.
Rollen wijzig je via **Beheer → Gebruikers** (admin/superuser).

---

## 📧 E-mailbevestiging uitschakelen (optioneel voor dev)

Voor een interne club-app is e-mailbevestiging soms onhandig.
Uitschakelen via Supabase: **Authentication → Providers → Email → Confirm email: OFF**

---

## 🔒 Supabase e-mail instellen (productie)

Voor echte e-mails (wachtwoord vergeten, bevestiging):
**Project Settings → Auth → SMTP Settings**
Gebruik bv. [Resend](https://resend.com) (gratis tier: 3.000 mails/maand).

---

## 📁 Projectstructuur

```
brouwgilde/
├── supabase/
│   └── schema.sql          ← Database schema + RLS policies
├── src/
│   ├── lib/
│   │   ├── supabase.js     ← Supabase client + alle database functies
│   │   └── AuthContext.jsx ← Auth state management
│   ├── components/
│   │   ├── UI.jsx          ← Gedeelde UI componenten
│   │   ├── TastingFormModal.jsx
│   │   └── LeaderboardModal.jsx
│   ├── pages/
│   │   ├── LoginPage.jsx
│   │   ├── Dashboard.jsx
│   │   ├── BeersPage.jsx
│   │   ├── SessionsPage.jsx
│   │   ├── MyPages.jsx     ← Mijn beoordelingen + Mijn brouwerij
│   │   └── AdminPage.jsx
│   ├── App.jsx             ← Hoofdapp + navigatie
│   ├── main.jsx
│   └── index.css
├── .env.example
├── vercel.json
├── vite.config.js
└── package.json
```

---

## 🔄 Updates deployen

Na elke `git push` naar `main` deployt Vercel automatisch.
Je hoeft niets extra te doen.

---

## 💾 Data backup

Supabase heeft automatische backups op betaalde plannen.
Op het gratis plan: handmatig exporteren via **Database → Backups** of via pg_dump.
