import React, { createContext, useContext, useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { cn } from "./lib/utils";
import { useLanguage } from "./context/LanguageContext";

type NotificationType = "success" | "error" | "info";

interface Notification {
  id: string;
  type: NotificationType;
  message: string;
}

interface NotificationContextType {
  showNotification: (type: NotificationType, message: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error("useNotification must be used within NotificationProvider");
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { isRTL } = useLanguage();

  const showNotification = useCallback((type: NotificationType, message: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 4000);
  }, []);

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      <div className={cn(
        "fixed bottom-6 z-[100] flex flex-col gap-3 w-full max-w-sm px-6",
        isRTL ? "left-0" : "right-0"
      )}>
        <AnimatePresence>
          {notifications.map((n) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, x: isRTL ? -100 : 100, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className={cn(
                "p-4 rounded-2xl border shadow-2xl flex items-center gap-4 backdrop-blur-md",
                n.type === "success" && "bg-green-500/10 border-green-500/20 text-green-500",
                n.type === "error" && "bg-red-500/10 border-red-500/20 text-red-500",
                n.type === "info" && "bg-primary/10 border-primary/20 text-primary"
              )}
              dir={isRTL ? "rtl" : "ltr"}
            >
              <div className="shrink-0">
                {n.type === "success" && <CheckCircle2 size={24} />}
                {n.type === "error" && <AlertCircle size={24} />}
                {n.type === "info" && <Info size={24} />}
              </div>
              <p className="text-sm font-black uppercase italic tracking-tight flex-1">
                {n.message}
              </p>
              <button 
                onClick={() => removeNotification(n.id)}
                className="p-1 hover:bg-white/5 rounded-full transition-colors"
              >
                <X size={16} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  );
};
