import React from 'react';
import { TopNavigation } from './editor/toolbar/TopNavigation';
import { ToolBar } from './editor/toolbar/ToolBar';
import { LeftSidebar } from './editor/panels/LeftSidebar';
import { RightSidebar } from './editor/panels/RightSidebar';
import { CanvasEditor } from './editor/canvas/CanvasEditor';
import { PrototypeViewerModal } from './components/PrototypeViewerModal';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useAutosave } from './hooks/useAutosave';
import { useCollaboration } from './hooks/useCollaboration';

export const App: React.FC = () => {
  useKeyboardShortcuts();
  useAutosave();
  useCollaboration();

  return (
    <div className="w-screen h-screen flex flex-col bg-[#121214] text-zinc-200 overflow-hidden">
      <TopNavigation />
      <ToolBar />
      <div className="flex-1 flex relative overflow-hidden">
        <LeftSidebar />
        <CanvasEditor />
        <RightSidebar />
      </div>
      <PrototypeViewerModal />
    </div>
  );
};

export default App;
