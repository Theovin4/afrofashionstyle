update public.site_settings
set value=jsonb_set(value,'{support_email}','"afrofashionclub@gmail.com"'::jsonb),updated_at=now()
where key='contact';
