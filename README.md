# DANverse ScriptForge — Groq edition

Web app móvil con generador de scripts, biblioteca, reparador y analizador Luau. Incluye un backend Cloudflare Pages Function para llamar a Groq sin exponer la clave API en el navegador.

## Estructura
- `public/index.html`: aplicación web.
- `functions/api/chat.js`: endpoint seguro que consulta Groq usando `env.GROQ_API_KEY`.
- `functions/api/health.js`: comprueba si el secreto está configurado sin revelar su valor.

## Importante
No pongas la clave de Groq en `index.html`, en GitHub ni en mensajes. Si ya la publicaste en algún lugar, revócala y crea otra. El frontend llama a `/api/chat`; la clave solo existe como secreto del backend.

Este proyecto usa Groq, por lo que no es completamente local/offline: los prompts se envían a Groq para generar respuestas. Revisa las condiciones y límites de tu cuenta. La interfaz no incluye pagos ni garantiza que el plan gratuito sea ilimitado.

## Instalación gratuita desde iPhone (Cloudflare Pages + GitHub)
1. En GitHub, crea un repositorio nuevo, por ejemplo `danverse-scriptforge`. Déjalo privado si quieres mantener privado el código.
2. Sube la carpeta `public` y la carpeta `functions` conservando esta estructura en la raíz del repositorio:
   - `public/index.html`
   - `functions/api/chat.js`
   No subas ninguna clave API.
3. Entra en Cloudflare Dashboard y abre **Workers & Pages**.
4. Crea una aplicación **Pages** y conecta el repositorio GitHub.
5. Configuración de build:
   - Framework preset: `None`
   - Build command: déjalo vacío
   - Build output directory: `public`
6. Despliega el proyecto.
7. En el proyecto de Pages abre **Settings → Variables and Secrets** (la etiqueta puede variar según la interfaz).
8. Añade una variable secreta:
   - Name: `GROQ_API_KEY`
   - Value: tu clave de Groq
   Selecciona el tipo **Secret**, no una variable pública.
9. Vuelve a desplegar el proyecto para que la función reciba el secreto.
10. Abre la URL de Pages. El indicador superior debe mostrar `Groq conectado`. Prueba el generador con una solicitud pequeña.

## Si falla
- `Falta configurar el secreto`: revisa que el nombre sea exactamente `GROQ_API_KEY` y vuelve a desplegar.
- Error 401/403: revisa que la clave sea válida; no la compartas.
- Error 429: alcanzaste un límite de uso o velocidad de Groq; espera y vuelve a probar.
- Error de modelo: usa `openai/gpt-oss-20b`, que es el modelo predeterminado, o comprueba la lista actual de modelos admitidos por Groq.
- Si el frontend carga pero `/api/health` no funciona, confirma que se desplegó como Cloudflare Pages con la carpeta `functions` en la raíz del repositorio.

## Privacidad y seguridad
La app manda al modelo el texto que escribas o el código que pegues en Generador/Reparador/Compatibilidad. No pegues contraseñas, tokens, claves privadas ni datos personales. El backend no guarda el contenido de las solicitudes en una base de datos; aun así, la solicitud se procesa en Groq y se aplican sus políticas y registros de servicio.

## Alcance
El análisis es asistido por IA y no ejecuta Luau. La compatibilidad con Delta u otros ejecutores puede variar según la versión y las APIs disponibles. Utiliza los scripts en proyectos propios o pruebas autorizadas.
