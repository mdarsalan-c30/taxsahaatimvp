"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import { AddClientModal } from "./AddClientModal";

export function AddClientHeader() {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button 
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm"
      >
        <UserPlus className="size-4" />
        Add Client
      </button>
      
      {showModal && <AddClientModal onClose={() => setShowModal(false)} />}
    </>
  );
}
