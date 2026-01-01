# Apple Tree Game - Solo & Pro Mode

Juego interactivo desarrollado con **React**, **Phaser 3.90** y **Node.js**.  
Cuenta con un modo "Pro" experimental que permite usar un dispositivo móvil como control remoto mediante **WebSockets** y **WebRTC** (PeerJS).

## 🚀 Características Principales

- **Juego Base**: Mecánica simple de física donde caen manzanas.
- **Gráficos Procedurales**: Uso de `Phaser.Graphics` para assets vectoriales ligeros.
- **Modo Pro (Control Remoto)**:
  - Escaneo de QR para conectar móvil.
  - Comunicación en tiempo real (P2P vía WebRTC con fallback a WebSockets).
  - Interfaz de control dedicada en el móvil.
- **Arquitectura Híbrida**: Frontend en React + Phaser, Backend en Express + Socket.io + PeerJS.

## 🛠️ Requisitos

- Node.js (v18+ recomendado)
- NPM

## 💻 Instalación y Desarrollo Local

1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Iniciar en modo desarrollo (Requiere 2 terminales):**

   *Terminal 1 - Servidor de Señalización y API:*
   ```bash
   npm run server
   ```
   *Terminal 2 - Cliente Vite (Hot Reload):*
   ```bash
   npm run dev
   ```

3. Abrir `http://localhost:5173` en el navegador.

## 📦 Despliegue en Producción (Docker)

El proyecto incluye un `Dockerfile` optimizado que sirve tanto el frontend (construido estáticamente) como el backend de señalización en un solo puerto.

### Opción A: Construir y Correr Localmente

```bash
# 1. Construir imagen
docker build -t game-solo .

# 2. Correr contenedor (Mapeando puerto 3005)
docker run -p 3005:3005 game-solo
```
Accede a `http://localhost:3005`.

### Opción B: Despliegue en Nube (Recomendado para WebRTC)

Para que el **Modo Pro (WebRTC)** funcione correctamente entre dispositivos en redes distintas (o móvil y PC), es **CRÍTICO** que la aplicación se sirva sobre **HTTPS**.

1. Despliega este repositorio en servicios como **Render**, **Railway** o **Fly.io** usando el `Dockerfile`.
2. Estos servicios te proporcionarán una URL segura (ej: `https://mi-juego.onrender.com`).
3. El juego detectará automáticamente el entorno HTTPS y usará puertos seguros (443) para WebRTC.

## 📱 Solución de Problemas con WebRTC

**¿Por qué no conecta mi móvil en red local (192.168.x.x)?**
Los navegadores modernos (Chrome, Safari) bloquean el acceso a WebRTC y giroscopio en sitios "inseguros" (HTTP), excepto en `localhost`.
- **Solución temporal:** Usa un túnel como `ngrok` o `localtunnel` para exponer tu puerto 3005 local a una URL HTTPS.
- **Solución real:** Despliega la imagen Docker en un hosting con SSL (HTTPS).

## 📂 Estructura del Proyecto

- `src/game/`: Lógica de Phaser y Gestores (Audio, Conexión).
- `src/components/`: Interfaz UI de React (QR, Status, Mobile Controller).
- `server.js`: Servidor Express dual (Sirve la app + Socket.io + PeerServer).
- `src/game/ConnectionManager.ts`: Módulo central de comunicación P2P/Socket.

## 🎮 Controles

- **PC**: Clic o `ENTER` para lanzar manzanas.
- **Modo Pro**: Escanea el QR, espera la conexión y usa el botón "DROP" en tu móvil.
