-- La migración anterior solo reconocía los teléfonos de relleno 400-0001 a 400-0009
-- y dejó pasar los demás (400-0010 en adelante). Ninguno es de la filial.
UPDATE "filiales" SET "contactos" = COALESCE(
  (
    SELECT jsonb_agg(c)
    FROM jsonb_array_elements("contactos") AS c
    WHERE NOT (c->>'tipo' = 'telefono' AND c->>'valor' ~ '40{2,3}-0[0-9]{3}$')
  ),
  '[]'::jsonb
);
