# Tellal — Full Stack Gayrimenkul Büyüme Platformu

## Ürün Nedir?
Gayrimenkul ofisleri için hepsi bir arada büyüme platformu.
İki temel katman:
1. REKLAM KATMANI: Meta ve Google Ads kampanyalarını
   AI destekli sihirbazla otomatik kur ve yönet
2. LEAD KATMANI: Gelen her leadi puanla, 5 dakikada
   WhatsApp ile temas kur, otomatik takip sekansı çalıştır

Müşteriye söylenen tek cümle:
"Reklamını kurarız, leadini kaçırmazsın, sen sadece sat."

## Hedef Müşteri
- 2-20 kişilik emlak ofisleri
- Türkiye pazarı (başlangıç)
- Zaten Meta Ads kullanan veya kullanmak isteyen ofisler
- Aylık $300-1500 ödemeye hazır

## Fiyatlandırma
- Starter: $300/ay (sadece lead otomasyonu)
- Growth: $700/ay (otomasyon + kampanya kurulum)
- Full Stack: $1200-1500/ay (reklam yönetimi +
  otomasyon + raporlama)

## Tech Stack
- Framework: Next.js 14 (App Router, TypeScript)
- Styling: Tailwind CSS
- Veritabanı: Supabase (PostgreSQL + Realtime + Auth)
- AI: Claude API (claude-sonnet-4-6)
- Mesajlaşma: Twilio (WhatsApp + SMS)
- Email: Resend
- Ödeme: iyzico (checkout form + callback)
- Reklam: Meta Marketing API + Google Ads API
- Görsel üretim: Fal.ai
- Deploy: Vercel

## AjansAI Referans Projesi
Mevcut bir AjansAI projem var. Sıfırdan yazıyoruz
ama şu kısımları AjansAI'den referans alarak kur:

### Doğrudan Kopyalanacaklar:
- Stripe entegrasyonu (webhook handler, subscription
  oluşturma, portal linki, fiyat ID yapısı)
- Claude API bağlantısı (/lib/claude/ yapısı,
  error handling, stream yapısı)
- Supabase client kurulumu (client.ts, server.ts,
  middleware.ts — sadece bağlantı, şema değil)
- Supabase Auth yapısı (email login, session yönetimi,
  middleware route koruması)
- Resend email entegrasyonu
- Vercel deploy konfigürasyonu (vercel.json,
  environment variable yapısı)
- Fal.ai görsel üretim bağlantısı

### Kullanılmayacaklar (AjansAI'ye özel):
- İçerik üretim mantığı
- Sosyal medya takvimi
- SEO modülü
- Mevcut veritabanı şeması (tamamen farklı)
- Mevcut sayfa yapısı

### Önemli Not:
AjansAI kodunu incele, çalışan entegrasyonları
anla, sonra Tellal için temiz şekilde uygula.
Eski kodu kopyala yapıştır yapma — mantığı al,
temiz yaz.

## Klasör Yapısı
/app
  /api
    /leads
      /ingest
      /score
      /assign
    /messages
      /send
      /sequence
    /campaigns
      /wizard
      /create
      /optimize
      /performance
    /webhooks
      /meta-leads
      /twilio
      /iyzico
    /reports
      /generate
      /send
  /dashboard
  /leads
  /campaigns
  /agents
  /reports
  /settings
  /onboarding
/lib
  /supabase
  /claude
  /twilio
  /meta
  /google-ads
  /fal
  /scoring
  /sequences
  /iyzico
/types
/hooks

## Veritabanı Tabloları
offices (
  id, name, plan_type, meta_account_id,
  google_account_id, meta_access_token,
  google_access_token, whatsapp_number,
  webhook_secret, iyzico_customer_id,
  iyzico_payment_id, settings jsonb,
  created_at
)

agents (
  id, office_id fk, name, phone,
  regions text[], is_available bool,
  active_lead_count int, conversion_rate decimal,
  created_at
)

leads (
  id, office_id fk, agent_id fk nullable,
  name, phone, source, interest, budget,
  ai_score int, ai_reasoning text,
  recommended_tone text, status,
  first_contact_at, closed_at,
  sale_value decimal, created_at
)

messages (
  id, lead_id fk, channel, content,
  status, sequence_step int, sent_at
)

sequences (
  id, office_id fk, name,
  steps jsonb, is_active bool, created_at
)

campaigns (
  id, office_id fk, platform,
  external_id, name, status,
  daily_budget decimal, spent decimal,
  leads_count int, performance jsonb,
  created_at
)

analytics (
  id, office_id fk, date,
  leads_count int, contacted_count int,
  response_rate decimal, conversion_rate decimal,
  ad_spend decimal, revenue_generated decimal
)

## İş Kuralları
1. Lead gelince MAX 5 dakika içinde temas
2. AI skoru: 70+ hot, 40-69 warm, 40 altı cold
3. Hot → anında WA + danışmana push bildirim
4. Warm → 5dk bekle → WA
5. Cold → 60dk bekle → SMS
6. Danışman ataması: bölge > yük > dönüşüm oranı
7. Takip: T+0, T+24s, T+3g, T+7g, T+14g, T+30g
8. T+30g yanıt yoksa soğuk segmente taşı
9. Danışman müdahale ederse sekansı durdur
10. Kampanya optimizasyonu haftada bir
11. CTR %1 altına düşerse Claude yeni metin önerir
12. Reklam 7 gün aynı kitleye gittiyse yenile

## Claude API Prompt Şablonları

### Lead Puanlama:
Sen bir gayrimenkul lead analisti'sin.
Aşağıdaki lead verisini analiz et ve JSON döndür.

Lead: {lead_data}
Ofis portföyü: {portfolio}
Son 30 kapanan lead profili: {history}

Yanıt formatı (sadece JSON, başka hiçbir şey):
{
  "score": 0-100,
  "category": "hot|warm|cold",
  "reasoning": "max 2 cümle Türkçe gerekçe",
  "recommended_tone": "urgent|informative|casual",
  "priority_rank": 1-5
}

### WhatsApp Mesaj Üretimi:
Türkçe, doğal, samimi bir WhatsApp mesajı yaz.
Emlak danışmanı adına yazılıyor.
Uzun olmasın, max 3 cümle.
Soru ile bitir.

Lead adı: {name}
İlgi: {interest}
Bütçe: {budget}
Ton: {tone}
Ofis adı: {office_name}

### Kampanya Metin Üretimi:
Türkiye'deki {city} bölgesinde faaliyet gösteren
{office_name} emlak ofisi için Meta reklam metni yaz.

Hedef: {target} (alıcı/satıcı/kiralık)
Bütçe aralığı: {budget_range}
Öne çıkan özellik: {feature}

3 farklı versiyon yaz (kısa/orta/uzun).
Her versiyon için başlık ve açıklama ayrı olsun.
Türkçe, samimi, güven verici ton.

## Kod Kuralları
- TypeScript strict, any yasak
- Her API route try/catch zorunlu
- Supabase hataları logla, kullanıcıya generic mesaj
- Twilio fail → SMS fallback → email fallback
- Environment variable hardcode yasak
- KVKK: müşteri ham verisi loglanmaz
- Supabase service key sadece server tarafında
- Her fonksiyon tek iş yapar
- Async/await kullan, promise chain kullanma

## Environment Variables
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_NUMBER=
TWILIO_SMS_NUMBER=
RESEND_API_KEY=
IYZICO_API_KEY=
IYZICO_SECRET_KEY=
IYZICO_BASE_URL=
META_APP_ID=
META_APP_SECRET=
GOOGLE_ADS_CLIENT_ID=
GOOGLE_ADS_CLIENT_SECRET=
GOOGLE_ADS_DEVELOPER_TOKEN=
FAL_API_KEY=
NEXT_PUBLIC_APP_URL=

## Test Kuralları
- Her modül bitmeden sonraki modüle geçme
- Her API endpoint için test senaryosu çalıştır
- Twilio sandbox kullan başlangıçta
- Meta test ad account kullan
- iyzico sandbox kullan
- Supabase RLS her tablo için test et

## Marka & UI
- Proje adı: Tellal
- Logo font: Inter Black veya Geist Bold
  (lowercase, "tellal." noktalı)
- UI font: Inter (zaten Next.js default)
- Renk paleti: henüz belirlenmedi

## İlerleme Durumu
- [ ] Proje kurulumu ve auth
- [ ] Veritabanı şeması ve RLS
- [ ] Onboarding wizard
- [ ] Lead ingest + puanlama
- [ ] WhatsApp otomasyonu
- [ ] Takip sekansı
- [ ] Lead dashboard
- [ ] Kampanya sihirbazı
- [ ] Meta Ads entegrasyonu
- [ ] Google Ads entegrasyonu
- [ ] Reklam yönetimi dashboard
- [ ] Raporlama modülü
- [ ] iyzico ödeme / abonelik akışı
- [ ] Final test ve deploy

## Çalışma Kuralları
- Her adımı bitirince ✅ de ve özetle
- Test etmemi istediğin şeyi açıkça söyle
- Onayım olmadan sonraki adıma geçme
- Bir hata varsa çöz, üstüne yığma
- Emin olmadığın bir şey varsa yap değil, sor
