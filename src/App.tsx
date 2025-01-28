
import React, { useState, useRef, useEffect } from "react";
import Editor, { OnChange } from "@monaco-editor/react";
import Split from "react-split";
import { Play, Trash2, FileCode } from "lucide-react";

const defaultCode = `import React, { useEffect } from 'react';
function App() {
  useEffect(() => {
    console.log('Component mounted!');
    console.info('This is an info message');
    console.warn('This is a warning');
    console.error('This is an error');
  }, []);

  const handleClick = () => {
    console.log('Button clicked!');
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Hello React!</h1>
      <p>Check the console for messages!</p>
      <button 
        onClick={handleClick}
        style={{
          marginTop: '20px',
          padding: '10px 20px',
          backgroundColor: '#007bff',
          color: '#fff',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
        }}
      >
        Click me
      </button>
    </div>
  );
}
export default App;`;

type ConsoleMessage = {
  type: "log" | "info" | "warn" | "error";
  content: string;
};

const App: React.FC = () => {
  const [code, setCode] = useState<string>(defaultCode);
  const [consoleOutput, setConsoleOutput] = useState<ConsoleMessage[]>([]);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const clearConsole = () => setConsoleOutput([]);

  const appendToConsole = (type: ConsoleMessage["type"], args: any[]) => {
    setConsoleOutput((prev) => [
      ...prev,
      {
        type,
        content: args
          .map((arg) =>
            typeof arg === "object" ? JSON.stringify(arg, null, 2) : String(arg)
          )
          .join(" "),
      },
    ]);
  };

  const handleRunClick = () => {
    if (iframeRef.current) {
      const iframe = iframeRef.current;
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) return;

      const codeToRender = `
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <title>React Preview</title>
            <script crossorigin src="https://unpkg.com/react@17/umd/react.development.js"></script>
            <script crossorigin src="https://unpkg.com/react-dom@17/umd/react-dom.development.js"></script>
          </head>
          <body>
            <div id="root"></div>
            <script>
              window.addEventListener('error', function(event) {
                parent.postMessage({ type: 'error', args: [event.message] }, '*');
              });

              window.console.log = (...args) => parent.postMessage({ type: 'log', args }, '*');
              window.console.info = (...args) => parent.postMessage({ type: 'info', args }, '*');
              window.console.warn = (...args) => parent.postMessage({ type: 'warn', args }, '*');
              window.console.error = (...args) => parent.postMessage({ type: 'error', args }, '*');

              try {
                ${code}
                const App = window.React.createElement(window.default);
                window.ReactDOM.render(App, document.getElementById('root'));
              } catch (e) {
                console.error(e.message);
              }
            </script>
          </body>
        </html>
      `;

      iframeDoc.open();
      iframeDoc.write(codeToRender);
      iframeDoc.close();
    }
  };

  const handleEditorChange: OnChange = (value) => {
    if (value) setCode(value);
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type) {
        appendToConsole(event.data.type, event.data.args);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  return (
    <div className="h-screen bg-[#1e1e1e] text-white flex flex-col">
      <header className="h-12 border-b border-gray-700 flex items-center px-4">
        <div className="flex items-center space-x-2">
          <FileCode className="w-5 h-5 text-green-400" />
          <span className="font-semibold">React Playground</span>
        </div>
        <div className="ml-auto flex items-center space-x-4">
          <button
            onClick={handleRunClick}
            className="flex items-center space-x-2 px-3 py-1 rounded bg-gray-700 hover:bg-gray-600"
          >
            <Play className="w-4 h-4" />
            <span>Run</span>
          </button>
          <button
            onClick={clearConsole}
            className="flex items-center space-x-2 px-3 py-1 rounded bg-gray-700 hover:bg-gray-600"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear</span>
          </button>
        </div>
      </header>

      <div className="flex-1 flex">
        <Split
          className="flex-1 flex"
          sizes={[50, 50]}
          minSize={100}
          gutterSize={8}
          gutterStyle={() => ({ backgroundColor: "#2d2d2d" })}
        >
          <Editor
            height="100%"
            defaultLanguage="javascript"
            value={code}
            theme="vs-dark"
            onChange={handleEditorChange}
          />
          <div className="flex flex-col">
            <iframe
              ref={iframeRef}
              title="Preview"
              sandbox="allow-scripts allow-same-origin"
              className="flex-1 bg-white"
            ></iframe>
            <div className="h-48 bg-[#1e1e1e] overflow-auto text-sm p-2 font-mono">
              {consoleOutput.length === 0 ? (
                <div className="text-gray-500 italic">No console output yet...</div>
              ) : (
                consoleOutput.map((log, i) => (
                  <div
                    key={i}
                    className={
                      log.type === "error"
                        ? "text-red-500"
                        : log.type === "warn"
                        ? "text-yellow-500"
                        : "text-gray-300"
                    }
                  >
                    {log.content}
                  </div>
                ))
              )}
            </div>
          </div>
        </Split>
      </div>
    </div>
  );
};

export default App;
