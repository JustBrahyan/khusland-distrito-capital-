Khusland — Panel de Gestión (misma web)
=======================================

Este paquete añade un panel en /admin y almacenamiento de pedidos usando GitHub como base de datos (JSON).
Funciona dentro del mismo proyecto Vercel sin Node local ni servidores externos.

ARCHIVOS NUEVOS
---------------
- admin/index.html      → Panel con login (contraseña única), tabla de pedidos y acciones (Aceptar/Rechazar/Pendiente).
- api/order.js          → (Actualizado) Además de enviar el embed a Discord, guarda el pedido en data/orders.json (GitHub).
- api/orders.js         → API del panel: GET lista y PATCH estado, protegido por contraseña.
- data/orders.json      → Archivo JSON con la lista de pedidos (base vacía).

VARIABLES DE ENTORNO EN VERCEL (Settings → Environment Variables)
-----------------------------------------------------------------
Ya deberías tener:
- DISCORD_WEBHOOK_URL = (tu webhook)

Agrega estas NUEVAS:
- ADMIN_PASSWORD       = (la contraseña del panel, p.ej. Khusland2025)
- GITHUB_TOKEN         = (PAT con permiso 'repo' desde https://github.com/settings/tokens )
- GITHUB_REPO          = JustBrahyan/khusland-distrito-capital   (o el tuyo)
- GITHUB_BRANCH        = main
- GITHUB_FILE_PATH     = data/orders.json

PASOS
-----
1) Sube estos archivos a tu repositorio (en la raíz):
   - Carpeta admin/ (con index.html)
   - Carpeta api/   (con order.js y orders.js, reemplaza tu order.js anterior)
   - Carpeta data/  (con orders.json)

2) En Vercel → tu proyecto → Settings → Environment Variables: agrega las variables de arriba.
   Guarda.

3) En Vercel → Deployments → Redeploy  (o "Deploy again").

4) Prueba la tienda normal: un nuevo pedido ahora llegará a Discord y quedará guardado en data/orders.json.

5) Abre: https://TU-PROYECTO.vercel.app/admin
   - Ingresa la contraseña del panel (ADMIN_PASSWORD).
   - Verás los pedidos y podrás cambiar estado.

NOTAS IMPORTANTES
-----------------
- Los botones Aceptar/Rechazar del PANEL cambian el estado en el JSON (para control interno).
- En Discord los mensajes seguirán mostrando "Pendiente" (no se editan por no usar bot). El staff puede reaccionar ✅/❌.
- Si quieres que el mensaje de Discord cambie automáticamente al aceptar/rechazar, se requiere un bot (opcional futuro).

Seguridad
---------
- La API /api/orders exige el header 'x-admin-key' igual a ADMIN_PASSWORD para leer/actualizar.
- No expongas tu GITHUB_TOKEN. Déjalo solo como variable de entorno en Vercel.
