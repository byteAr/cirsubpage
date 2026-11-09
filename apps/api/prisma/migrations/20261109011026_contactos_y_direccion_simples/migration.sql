-- La dirección ya no se valida contra Google Maps.
ALTER TABLE "filiales" DROP COLUMN "place_id";

-- Solo quedan WhatsApp, teléfono fijo y correo. Un celular cargado antes pasa a
-- teléfono; sitios web y redes sociales se quitan.
UPDATE "filiales" SET "contactos" = COALESCE(
  (
    SELECT jsonb_agg(
      CASE WHEN c->>'tipo' = 'celular' THEN jsonb_set(c, '{tipo}', '"telefono"') ELSE c END
    )
    FROM jsonb_array_elements("contactos") AS c
    WHERE c->>'tipo' IN ('whatsapp', 'telefono', 'celular', 'email')
  ),
  '[]'::jsonb
);
