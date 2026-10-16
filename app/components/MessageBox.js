import { useState, useEffect } from "react";
import clsx from "clsx";

const MessageBox = ({ message, color = "detail", onClose, timeout = 5000 }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const interval = 10; // Atualizações frequentes para a barra
    const step = (100 / timeout) * interval;

    const timer = setInterval(() => {
      setProgress((prev) => Math.max(0, prev - step));
    }, interval);

    const autoCloseTimer = setTimeout(() => {
      setIsVisible(false);
      if (onClose) onClose();
      clearInterval(timer);
    }, timeout);

    return () => {
      clearInterval(timer);
      clearTimeout(autoCloseTimer);
    };
  }, [timeout, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    if (onClose) onClose();
  };

  if (!isVisible) return null;

  return (
    <div
      className={clsx(
        "fixed top-4 left-1/2 transform -translate-x-1/2 max-w-sm w-full p-4 shadow-lg rounded-md z-[90]",
        `bg-${color}`,
        `border-${color}`
      )}
    >
      <div
        className="absolute top-0 left-0 h-1 w-full bg-gray-400 bg-opacity-50"
        style={{ width: `${progress}%`, transition: "width 0.1s linear" }}
      />
      <div className="flex items-start">
        <div className="flex-grow">
          <p className="text-sm leading-relaxed break-words max-h-40 overflow-y-auto">
            {message}
          </p>
        </div>
        <button
          onClick={handleClose}
          className={clsx(
            "ml-4",
            `hover:text-${color}-dark`,
            "focus:outline-none"
          )}
          aria-label="Close"
        >
          ✖
        </button>
      </div>
    </div>
  );
};

export default MessageBox;
