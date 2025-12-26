"use client";

import React from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export default function Modal({ isOpen, onClose, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Modal box */}
      <div className="relative z-50 w-full max-w-sm rounded-xl p-6 px-12 shadow-xl bg-[#003200]/30">
        {/* Close button */}

        {children}
      </div>
    </div>
  );
}
