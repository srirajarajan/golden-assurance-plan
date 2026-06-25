CREATE OR REPLACE FUNCTION public.generate_invoice_number()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  next_seq INT;
BEGIN
  SELECT COALESCE(MAX(CAST(split_part(invoice_number, '-', 2) AS INT)), 0) + 1
    INTO next_seq
    FROM public.invoices
   WHERE invoice_number ~ '^WC-[0-9]+$';

  RETURN 'WC-' || lpad(next_seq::text, 4, '0');
END;
$function$;