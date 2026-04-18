-- Stripe yerine iyzico ödeme referansları (sütun yeniden adlandırma)
alter table offices rename column stripe_customer_id to iyzico_customer_id;
alter table offices rename column stripe_subscription_id to iyzico_payment_id;

comment on column offices.iyzico_customer_id is 'iyzico alıcı/kart referansı (varsa)';
comment on column offices.iyzico_payment_id is 'Başarılı ödeme sonrası iyzico paymentId';
