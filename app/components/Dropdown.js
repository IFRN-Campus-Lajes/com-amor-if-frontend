"use client";

import React, { useState, useEffect, useRef } from "react";
import { FaUserCircle } from "react-icons/fa"; // Importando o ícone
import { useRouter } from "next/navigation";

import { useAuth } from "../../providers/AuthProvider";
import { canManageOlympiads, isFromCategory } from "../../utils/role";

const Dropdown = ({ username }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { logout, user } = useAuth();
  const router = useRouter();

  const handleLogout = (e) => {
    e.preventDefault();
    logout();
  };

  const toggleDropdown = () => setIsOpen(!isOpen);

  const handleClickOutside = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={toggleDropdown}
        className="flex items-center gap-2 text-white px-4 py-2 rounded-lg hover:bg-black/50 hover:shadow-lg transition duration-300 ease-in-out"
      >
        <FaUserCircle size={20} /> {/* Ícone ao lado do nome */}
        {username}
      </button>
      {isOpen && (
        <ul className="absolute right-0 mt-2 bg-white text-black p-2 rounded-lg shadow-lg w-48">
          {isFromCategory(user, "Admin") && (
            <>
              <li>
                <a
                  href="/groups"
                  className="block py-1 px-4 hover:bg-gray-200 transition duration-200 ease-in-out"
                >
                  Turmas
                </a>
              </li>
              <li>
                <a
                  href="/years"
                  className="block py-1 px-4 hover:bg-gray-200 transition duration-200 ease-in-out"
                >
                  Anos
                </a>
              </li>
              <li>
                <a
                  href="/validate"
                  className="block py-1 px-4 hover:bg-gray-200 transition duration-200 ease-in-out"
                >
                  Validar Pontos
                </a>
              </li>
            </>
          )}
          {(isFromCategory(user, "Aval") || isFromCategory(user, "Admin")) && (
            <>
              {" "}
              <li>
                <a
                  href="/points"
                  className="block py-1 px-4 hover:bg-gray-200 transition duration-200 ease-in-out"
                >
                  Lançar Pontos
                </a>
              </li>
            </>
          )}
          {canManageOlympiads(user) && (
            <li>
              <a
                href="/olympiads"
                className="block py-1 px-4 hover:bg-gray-200 transition duration-200 ease-in-out"
              >
                Olimpíadas
              </a>
            </li>
          )}
          <li>
            <a
              href="#"
              onClick={handleLogout}
              className="block py-1 px-4 hover:bg-gray-200 transition duration-200 ease-in-out"
            >
              Logout
            </a>
          </li>
        </ul>
      )}
    </div>
  );
};

export default Dropdown;
