import React, { createContext, useContext, useState, useCallback } from 'react';
import { THEME } from './theme';

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

let idCounter = 0;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success') => {
    const id = ++idCounter;
    setToasts(prev => [...prev, { id, message, type }]);
    
    // Auto dismiss after 3 seconds
    setTimeout(() => {
      setToasts(prev => prev.map(t => t.id === id ? { ...t, fadingOut: true } : t));
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 300); // 300ms for fade out animation
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div style={{
        position: 'fixed',
        top: 20,
        right: 20,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        pointerEvents: 'none'
      }}>
        {toasts.map(toast => {
          let bg, border, color, icon;
          
          if (toast.type === "success") {
            bg = `${THEME.GOLD}15`; // ~15% opacity wrapper
            border = `${THEME.GOLD}40`;
            color = THEME.GOLD;
            icon = "✓";
          } else if (toast.type === "delete") {
            bg = `${THEME.RED}15`;
            border = `${THEME.RED}40`;
            color = THEME.RED;
            icon = "✕";
          } else if (toast.type === "info") {
            bg = `${THEME.BLUE}15`;
            border = `${THEME.BLUE}40`;
            color = THEME.BLUE;
            icon = "ℹ";
          } else if (toast.type === "error") {
            bg = `${THEME.RED}15`;
            border = `${THEME.RED}40`;
            color = THEME.RED;
            icon = "⚠";
          } else {
            bg = `${THEME.GOLD}15`;
            border = `${THEME.GOLD}40`;
            color = THEME.GOLD;
            icon = "✓";
          }

          return (
            <div
              key={toast.id}
              style={{
                padding: "14px 22px",
                borderRadius: 12,
                background: bg,
                border: `1px solid ${border}`,
                color: color,
                fontSize: 13,
                fontWeight: 600,
                fontFamily: "'Space Grotesk', sans-serif",
                backdropFilter: "blur(20px)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                animation: toast.fadingOut ? "toastOut 0.3s forwards" : "toastIn 0.3s ease-out",
                display: "flex",
                alignItems: "center",
                gap: 8,
                pointerEvents: 'auto'
              }}
            >
              {icon} {toast.message}
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};
