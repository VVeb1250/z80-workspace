import Dock from "./Dock";
import Toolbar from "./Toolbar";
import { AppStateProvider } from "./state/AppState";
import "./App.css";

export default function App() {
  return (
    <AppStateProvider>
      <div className="app">
        <Toolbar />
        <div className="dock-host">
          <Dock />
        </div>
      </div>
    </AppStateProvider>
  );
}
