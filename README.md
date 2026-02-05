# ViewerOBJ

Visor web interactivo de modelos 3D fotogrametricos en formato OBJ. Construido con Three.js, permite cargar, visualizar y manipular mallas de alta resolucion directamente en el navegador.

## Tecnologias

- **Three.js** (r128) - Renderizado WebGL
- **OBJLoader / MTLLoader** - Carga de modelos OBJ con materiales y texturas
- **OrbitControls** - Control de camara orbital
- **HTML5 / CSS3 / JavaScript** vanilla, sin frameworks

## Estructura del proyecto

```
ViewerOBJ/
├── index.html    # Documento principal
├── styles.css    # Sistema de estilos
├── app.js        # Logica de la aplicacion
└── README.md
```

## Funcionalidades

### Modos de visualizacion

| Modo | Tecla | Descripcion |
|------|-------|-------------|
| Textured | `1` | Renderizado con materiales y texturas originales |
| Wireframe | `2` | Malla de alambre |
| Solid | `3` | Material solido sin texturas |

### Controles de camara

**Raton:**
- Click izquierdo + arrastrar: Rotar
- Scroll: Zoom
- Click derecho + arrastrar: Paneo

**Tactil:**
- 1 dedo: Rotar
- 2 dedos (pinch): Zoom
- 2 dedos (arrastrar): Paneo

### Vistas predefinidas

| Tecla | Vista |
|-------|-------|
| `F` | Ajustar modelo a la vista |
| `T` | Vista superior |
| `Y` | Vista frontal |
| `G` | Mostrar/ocultar grilla |

### Panel de controles

- **Rotacion** - Ejes X, Y, Z con rango de -180 a +180 grados
- **Iluminacion** - Luz ambiental, direccional, exposicion y modo sin iluminacion
- **Ajuste de imagen** - Opacidad, saturacion, contraste y brillo via filtros CSS
- **Estadisticas** - Vertices, triangulos y texturas del modelo cargado

## Configuracion

El modelo se carga desde un bucket de Cloudflare R2. Para apuntar a otro modelo, editar el objeto `CONFIG` al inicio de `app.js`:

```js
const CONFIG = {
    baseUrl: 'https://tu-bucket.r2.dev/ruta/',
    objFile: 'Mesh.obj',
    mtlFile: 'Mesh.mtl',
    modelSizeMB: 278,
    // ...
};
```

## Uso

Abrir `index.html` en un navegador o servir los archivos con cualquier servidor estatico:

```bash
npx serve .
```

## Diseno

- Tema oscuro con acento verde neon (`#1ef2b2`)
- Paneles con efecto glassmorphism (backdrop blur)
- Responsive con breakpoints para escritorio, tablet y movil
- Soporte para dispositivos tactiles y accesibilidad (ARIA labels, atajos de teclado)
