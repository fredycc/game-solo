import { PhaserGame } from './game/PhaserGame';
import { ConnectionStatus } from './components/ConnectionStatus';
import { QRManager } from './components/QRManager';
import { Controller } from './Controller';

function App() {
  const isController = window.location.pathname === '/controller';

  if (isController) {
    return <Controller />;
  }

  return (
    <div className="App" id="game-root" style={{ position: 'relative', width: '100%', height: '100%' }}>
      <PhaserGame />
      <ConnectionStatus />
      <QRManager />
    </div>
  );
}

export default App;
