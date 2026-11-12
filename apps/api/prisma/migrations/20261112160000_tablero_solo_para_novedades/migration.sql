-- El rol usuario deja de traer el tablero: quien mantiene una filial o el
-- simulador entra directo a lo suyo.
DELETE FROM "rol_permisos"
WHERE "rol_id" IN (SELECT "id" FROM "roles" WHERE "slug" = 'usuario')
  AND "permiso_id" IN (SELECT "id" FROM "permisos" WHERE "slug" = 'tablero.ver');

-- Quien ya redacta novedades lo conserva, con el mismo alcance que su función.
INSERT INTO "usuario_permisos" ("usuario_id", "permiso_id", "alcance", "concedido")
SELECT up."usuario_id", t."id", up."alcance", true
FROM "usuario_permisos" up
JOIN "permisos" p ON p."id" = up."permiso_id" AND p."slug" = 'novedades.crear'
JOIN "usuarios" u ON u."id" = up."usuario_id"
JOIN "roles" r ON r."id" = u."rol_id" AND r."slug" = 'usuario'
CROSS JOIN (SELECT "id" FROM "permisos" WHERE "slug" = 'tablero.ver') t
WHERE up."concedido"
ON CONFLICT DO NOTHING;
