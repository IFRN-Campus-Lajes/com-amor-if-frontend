"use client";

import React from "react";

const Modal = ({ title, children, isOpen, onClose, onSave }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-gray-900 bg-opacity-50">
      <div className="max-h-[calc(100vh-2rem)] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-lg bg-white shadow-lg">
        <div className="px-4 py-2 border-b">
          <h2 className="text-lg font-semibold text-gray-700">{title}</h2>
        </div>
        <div className="p-4">{children}</div>
        <div className="flex justify-end px-4 py-2 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 mr-2 text-sm font-medium text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
          >
            Cancelar
          </button>
          <button
            onClick={onSave}
            className="px-4 py-2 text-sm font-medium text-white bg-green-500 rounded hover:bg-green-600"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;
