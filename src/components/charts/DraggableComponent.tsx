import React, { useEffect, useRef } from "react";
import { Trash2, Settings } from "lucide-react";
import { Button } from "../../shared/components/ui/Button";

interface DraggableComponentProps {
  id: string;
  name: string;
  htmlContent: string;
  cssContent?: string;
  jsContent?: string;
  data?: any[] | null;
  error?: string;
  isLoading?: boolean;
  onRemove?: (id: string) => void;
  onSettings?: (id: string) => void;
  height?: number;
}

export const DraggableComponent: React.FC<DraggableComponentProps> = ({
  id,
  name,
  htmlContent,
  cssContent,
  jsContent,
  data,
  error,
  isLoading,
  onRemove,
  onSettings,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!iframeRef.current) return;

    const dataScript = data ? `window.componentData = ${JSON.stringify(data)};` : 'window.componentData = null;';
    
    const iframeContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              background: transparent;
              font-family: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif;
              color: #f0f0f5;
              padding: 12px;
              height: 100%;
              overflow: auto;
            }
            ${cssContent || ''}
          </style>
        </head>
        <body>
          ${htmlContent}
          <script>
            ${dataScript}
            try {
              ${jsContent || ''}
            } catch(e) {
              console.error('Component JS Error:', e);
            }
          </script>
        </body>
      </html>
    `;

    const blob = new Blob([iframeContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    iframeRef.current.src = url;

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [htmlContent, cssContent, jsContent, data]);

  return (
    <div className="h-full w-full flex flex-col bg-[#12121a] rounded-lg overflow-hidden border border-[#2a2a3a] hover:border-[#7b2cbf]/50 transition-colors">
      {/* Component Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#1a1a25] border-b border-[#2a2a3a]">
        <div className="flex items-center gap-2">
          <span className="text-sm">🧩</span>
          <span className="text-sm font-medium text-[#f0f0f5] truncate">{name}</span>
        </div>
        <div className="flex items-center gap-1">
          {onSettings && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSettings(id)}
              className="text-[#a0a0b0] hover:text-[#f0f0f5] p-1 h-auto"
            >
              <Settings size={14} />
            </Button>
          )}
          {onRemove && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRemove(id)}
              className="text-[#ff4757] hover:text-[#ff4757] p-1 h-auto"
            >
              <Trash2 size={14} />
            </Button>
          )}
        </div>
      </div>

      {/* Component Content */}
      <div className="flex-1 min-h-0">
        {error ? (
          <p className="text-[#ff4757] text-sm p-4">{error}</p>
        ) : isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="spinner" />
          </div>
        ) : (
          <iframe
            ref={iframeRef}
            sandbox="allow-scripts"
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              background: '#12121a',
            }}
            title={name}
          />
        )}
      </div>
    </div>
  );
};
