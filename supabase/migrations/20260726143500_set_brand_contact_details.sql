update public.site_settings set
  value='{"support_email":"","whatsapp":"+234 704 984 1931","phone":"+234 704 984 1931","support_hours":"24/7"}'::jsonb,
  updated_at=now() where key='contact';
update public.site_settings set
  value='{"instagram":"https://www.instagram.com/afro.fashionstyle?igsh=MTc5cjZndjJqZXJjbw==","facebook":"https://www.facebook.com/afro.fashionstyles","tiktok":"https://tiktok.com/@afrofashionstyle","pinterest":""}'::jsonb,
  updated_at=now() where key='socials';
update public.site_settings set
  value=jsonb_set(jsonb_set(value,'{return_address}','"Lekki, Lagos, Nigeria"'::jsonb),'{business_address}','"Lekki, Lagos, Nigeria"'::jsonb),
  updated_at=now() where key='business';
