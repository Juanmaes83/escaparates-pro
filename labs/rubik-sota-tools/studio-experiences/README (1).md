# RS·PLATFORM — RUBIK SOTA EXPERIENCES
**Plataforma de creación de webs personalizables para clientes**
Versión 1.0 · 629 554 870 · Alicante, España

---

## ESTRUCTURA DEL SISTEMA

```
rs-platform/
├── studio.html          ← TU HERRAMIENTA (acceso privado con contraseña)
├── template/
│   ├── index.html       ← La web del cliente (deployar en GitHub Pages)
│   └── config.json      ← Configuración del cliente (exportada desde Studio)
└── README.md
```

---

## FLUJO DE TRABAJO

### 1. Abres RS·STUDIO (studio.html)
- Contraseña por defecto: `rubik2025` (cámbiala en Ajustes)
- Panel de todos tus clientes
- Stats: total, en vivo, facturación estimada

### 2. Creas un nuevo cliente
- Nombre, sector, ciudad, precio
- Se genera automáticamente un proyecto con la plantilla base

### 3. Editas la web desde el Studio
- **Tab Slides**: añadir/eliminar/reordenar diapositivas, subir imágenes, escribir textos, vídeos
- **Tab Tema**: colores primario/secundario, tipografía de títulos y cuerpo, filtros de imagen
- **Tab Footer**: features del footer, botón CTA (WhatsApp, reservas, etc.), logo del cliente
- **Tab Info**: datos del cliente, GitHub URL, precio, estado, notas internas
- **Preview**: desktop / tablet / móvil en tiempo real

### 4. Exportas el config.json
- Botón "config.json" en la barra inferior del editor
- O desde la tarjeta del cliente en el dashboard

### 5. Publicas en GitHub Pages
- Crea un repo desde el template: `github.com/rubiksota/experiences-template`
  - Botón "Use this template" → nombre: `nombre-cliente`
- Sube el `config.json` exportado al repo (reemplaza el existente)
- Settings → Pages → Branch: main → Save
- ✅ Web online en `usuario.github.io/nombre-cliente`

### 6. El cliente puede editar (opcional)
- Dale la URL con `?edit` al final
- Puede cambiar textos, subir imágenes, cambiar colores
- Descarga su `config.json` y te lo manda → tú lo subes al repo

---

## CONTRASEÑA
Por defecto: `rubik2025`
Para cambiarla: Studio → Ajustes → Seguridad

---

## TEMPLATE DEL CLIENTE

La plantilla `template/index.html` es autónoma:
- Lee `config.json` del mismo directorio (o localStorage si hay versión guardada)
- Activa el editor con `?edit` en la URL
- Compatible 100% con GitHub Pages (sin backend)
- Responsive: móvil, tablet, desktop

---

## DATOS QUE SE GUARDAN

Todo en `localStorage` del navegador donde usas el Studio:
- Todos los clientes y sus configuraciones
- Las imágenes subidas (en base64)
- La contraseña de acceso (si la has cambiado)

> ⚠️ No borres el localStorage del navegador o perderás los datos.
> Usa el botón "Exportar config.json" regularmente como backup.

---

## GITHUB SETUP RECOMENDADO

```
github.com/rubiksota/
├── experiences-template    ← Template master (nunca editar directamente)
├── chiringuito-embarcadero ← Fork del template para este cliente
├── restaurante-sol         ← Fork del template para este cliente
├── winsails-nautica        ← Fork del template para este cliente
└── ...
```

Para crear nuevo repo de cliente (GitHub CLI):
```bash
gh repo create chiringuito-embarcadero --template rubiksota/experiences-template --public
```

Para subir config actualizado:
```bash
git add config.json && git commit -m "update config chiringuito" && git push
```

---

## RUBIK SOTA · 629 554 870 · Alicante, España
