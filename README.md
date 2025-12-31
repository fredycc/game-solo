# Apple Tree Game

Juego interactivo desarrollado con React y Phaser 3.90.0.

## Requisitos
- Node.js (v14+)
- NPM

## Instalación
1. Clonar el repositorio o descargar el código.
2. Instalar dependencias:
   ```bash
   npm install
   ```

## Ejecución (Desarrollo)
Para iniciar el servidor de desarrollo:
```bash
npm run dev
```
Abre tu navegador en `http://localhost:5173`.

## Build (Producción)
Para generar la versión optimizada para producción:
```bash
npm run build
```
Los archivos se generarán en la carpeta `dist`.

## Estructura del Proyecto
- `src/game/PhaserGame.tsx`: Componente React que inicializa el juego.
- `src/game/scenes/`: Contiene las escenas del juego (Boot, Intro, Main).
- `src/game/AudioManager.ts`: Sistema de audio sintetizado (Web Audio API).
- `index.html`: Punto de entrada que incluye Phaser vía CDN.

## Controles
- **PC**: Presiona `ENTER` para hacer caer manzanas.
- **Móvil**: Toca la pantalla para interactuar.

## Características Técnicas
- **Phaser 3.90.0**: Instalado como dependencia npm.
- **Vite/React**: Base para el desarrollo y hot-reloading.
- **Gráficos**: Generados proceduralmente usando `Phaser.Graphics` (estilo vectorial plano).
- **Audio**: Sintetizado en tiempo real (sin assets externos pesados).
- **Responsive**: Se adapta a cualquier tamaño de pantalla.
