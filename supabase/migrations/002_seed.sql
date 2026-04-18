-- =============================================
-- TELLAL — Seed Data (Test Verisi)
-- =============================================

do $$
declare
  v_office_id uuid;
  v_agent1_id uuid;
  v_agent2_id uuid;
  v_agent3_id uuid;
  v_lead1_id uuid;
  v_lead3_id uuid;
  v_lead5_id uuid;
  v_lead8_id uuid;
  v_lead10_id uuid;
  v_test_user_id uuid;
begin
  select id into v_test_user_id from auth.users limit 1;

  if v_test_user_id is null then
    raise notice 'Kullanıcı bulunamadı. Önce kayıt ol, sonra seed çalıştır.';
    return;
  end if;

  -- 1 OFİS (İzmir, Growth plan)
  insert into offices (id, name, plan_type, whatsapp_number, user_id, settings)
  values (
    uuid_generate_v4(),
    'Ege Gayrimenkul',
    'growth',
    '+905551234567',
    v_test_user_id,
    '{"city": "İzmir", "timezone": "Europe/Istanbul"}'
  )
  returning id into v_office_id;

  -- 3 DANIŞMAN
  insert into agents (id, office_id, name, phone, regions, is_available, conversion_rate)
  values (uuid_generate_v4(), v_office_id, 'Mehmet Yılmaz', '+905551111111', ARRAY['Bornova', 'Karşıyaka'], true, 32.5)
  returning id into v_agent1_id;

  insert into agents (id, office_id, name, phone, regions, is_available, conversion_rate)
  values (uuid_generate_v4(), v_office_id, 'Ayşe Kaya', '+905552222222', ARRAY['Alsancak', 'Konak', 'Buca'], true, 28.0)
  returning id into v_agent2_id;

  insert into agents (id, office_id, name, phone, regions, is_available, conversion_rate)
  values (uuid_generate_v4(), v_office_id, 'Can Demir', '+905553333333', ARRAY['Çiğli', 'Menemen', 'Balçova'], false, 41.2)
  returning id into v_agent3_id;

  -- 10 LEAD

  -- HOT - atanmış
  insert into leads (id, office_id, agent_id, name, phone, source, interest, budget, ai_score, ai_reasoning, recommended_tone, status, first_contact_at)
  values (uuid_generate_v4(), v_office_id, v_agent1_id, 'Fatma Şahin', '+905554444444', 'meta_ads', '3+1 daire Bornova', '3-4M TL', 85, 'Bütçesi net belirlenmiş, bölge talebi spesifik. Acil ihtiyaç sinyali var.', 'urgent', 'contacted', now() - interval '2 hours')
  returning id into v_lead1_id;

  -- HOT - atanmış
  insert into leads (id, office_id, agent_id, name, phone, source, interest, budget, ai_score, ai_reasoning, recommended_tone, status)
  values (uuid_generate_v4(), v_office_id, v_agent2_id, 'Ali Koç', '+905555555555', 'google_ads', 'Satılık villa Çeşme', '8-10M TL', 78, 'Yüksek bütçe, premium segment. Hızlı karar verme eğilimi gösteriyor.', 'urgent', 'new');

  -- WARM - atanmış
  insert into leads (id, office_id, agent_id, name, phone, source, interest, budget, ai_score, ai_reasoning, recommended_tone, status)
  values (uuid_generate_v4(), v_office_id, v_agent1_id, 'Zeynep Arslan', '+905556666666', 'web_form', '2+1 kiralık Karşıyaka', '15-20K TL/ay', 65, 'Kiralık arayışı, orta vadeli karar. Bilgi toplama aşamasında.', 'informative', 'responded')
  returning id into v_lead3_id;

  -- WARM - atanmamış
  insert into leads (id, office_id, name, phone, source, interest, budget, ai_score, ai_reasoning, recommended_tone, status)
  values (uuid_generate_v4(), v_office_id, 'Hasan Öztürk', '+905557777777', 'referral', '4+1 daire Alsancak', '5-6M TL', 58, 'Referans üzerinden gelmiş, güven seviyesi yüksek. Acelesi yok.', 'informative', 'new');

  -- WARM - atanmış
  insert into leads (id, office_id, agent_id, name, phone, source, interest, budget, ai_score, ai_reasoning, recommended_tone, status, first_contact_at)
  values (uuid_generate_v4(), v_office_id, v_agent3_id, 'Elif Yıldız', '+905558888888', 'meta_ads', 'Satılık dükkan Çiğli', '2-3M TL', 52, 'Ticari mülk arayışı, bütçesi kısıtlı. Seçeneklere açık.', 'informative', 'appointment', now() - interval '1 day')
  returning id into v_lead5_id;

  -- COLD - atanmamış
  insert into leads (id, office_id, name, phone, source, interest, budget, ai_score, ai_reasoning, recommended_tone, status)
  values (uuid_generate_v4(), v_office_id, 'Murat Çelik', '+905559999999', 'google_ads', 'Arsa Menemen', '1-2M TL', 35, 'Çok genel talep, bütçe belirsiz. Uzun vadeli aday.', 'casual', 'new');

  -- COLD - atanmamış
  insert into leads (id, office_id, name, phone, source, interest, budget, ai_score, ai_reasoning, recommended_tone, status)
  values (uuid_generate_v4(), v_office_id, 'Selin Aktaş', '+905550000001', 'web_form', 'Kiralık ofis Konak', '10-15K TL/ay', 28, 'Bütçe düşük, talep geniş. Ön araştırma aşamasında.', 'casual', 'cold');

  -- CLOSED - kapandı
  insert into leads (id, office_id, agent_id, name, phone, source, interest, budget, ai_score, ai_reasoning, recommended_tone, status, first_contact_at, closed_at, sale_value)
  values (uuid_generate_v4(), v_office_id, v_agent2_id, 'Burak Güneş', '+905550000002', 'meta_ads', '3+1 daire Buca', '2.5-3M TL', 72, 'Hızlı karar verdi, bütçesi uygundu.', 'urgent', 'closed', now() - interval '10 days', now() - interval '3 days', 2750000)
  returning id into v_lead8_id;

  -- HOT - atanmamış
  insert into leads (id, office_id, name, phone, source, interest, budget, ai_score, ai_reasoning, recommended_tone, status)
  values (uuid_generate_v4(), v_office_id, 'Canan Polat', '+905550000003', 'meta_ads', '1+1 daire Alsancak yatırım', '1.5-2M TL', 80, 'Yatırım amaçlı, nakit alım sinyali. Çok spesifik bölge talebi.', 'urgent', 'new');

  -- WARM - atanmış
  insert into leads (id, office_id, agent_id, name, phone, source, interest, budget, ai_score, ai_reasoning, recommended_tone, status, first_contact_at)
  values (uuid_generate_v4(), v_office_id, v_agent1_id, 'Tarık Ersoy', '+905550000004', 'referral', '5+1 dubleks Karşıyaka', '7-9M TL', 61, 'Büyük aile, geniş mekan arayışı. Karar süreci uzun olabilir.', 'informative', 'contacted', now() - interval '5 hours')
  returning id into v_lead10_id;

  -- 5 MESAJ
  insert into messages (lead_id, channel, content, status, sequence_step, sent_at)
  values
    (v_lead1_id, 'whatsapp', 'Merhaba Fatma Hanım! Bornova''da 3+1 daire arayışınız için size özel harika seçeneklerimiz var. Hangi özellikleri öncelikli arıyorsunuz?', 'read', 1, now() - interval '2 hours'),
    (v_lead3_id, 'whatsapp', 'Merhaba Zeynep Hanım! Karşıyaka''da kiralık 2+1 daire talebinizi aldık. Bütçenize uygun birkaç güzel dairemiz var, görmek ister misiniz?', 'delivered', 1, now() - interval '1 day'),
    (v_lead5_id, 'sms', 'Elif Hanım merhaba, Çiğli bölgesinde dükkan talebiniz için randevunuzu hatırlatmak istedik. Yarın 14:00 uygun mu?', 'sent', 2, now() - interval '12 hours'),
    (v_lead10_id, 'whatsapp', 'Tarık Bey merhaba! Karşıyaka''da 5+1 dubleks arayışınız için portföyümüzde çok güzel seçenekler var. Ne zaman görüşebiliriz?', 'sent', 1, now() - interval '5 hours'),
    (v_lead8_id, 'whatsapp', 'Burak Bey, Buca''daki daireniz için tebrikler! Tapu işlemleri için gerekli belgeler hakkında bilgi verebilir miyim?', 'read', 0, now() - interval '3 days');

  -- Analytics (son 7 gün)
  insert into analytics (office_id, date, leads_count, contacted_count, response_rate, conversion_rate, ad_spend, revenue_generated)
  values
    (v_office_id, current_date - 6, 3, 2, 66.7, 0, 1500, 0),
    (v_office_id, current_date - 5, 5, 4, 80.0, 0, 1500, 0),
    (v_office_id, current_date - 4, 2, 2, 100.0, 0, 1500, 0),
    (v_office_id, current_date - 3, 4, 3, 75.0, 33.3, 1500, 2750000),
    (v_office_id, current_date - 2, 6, 5, 83.3, 0, 2000, 0),
    (v_office_id, current_date - 1, 3, 2, 66.7, 0, 2000, 0),
    (v_office_id, current_date, 2, 1, 50.0, 0, 2000, 0);

  raise notice 'Seed data başarıyla eklendi. Office ID: %', v_office_id;
end $$;
