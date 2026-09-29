"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import React, { useRef } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "../../providers/AuthProvider";
import { getIFRNUrl } from "../../utils/getIFRNUrl";
import { canManageOlympiads, isFromCategory } from "../../utils/role";

const MobileNavbar = ({ isLoggedIn, isMenuOpen, toggleMenu }) => {
  const menuRef = useRef(null);
  const pathname = usePathname();
  const { logout, user } = useAuth();
  const router = useRouter();
  const from = pathname || "/profile";

  const handleLogout = (e) => {
    e.preventDefault();
    toggleMenu(false);
    logout();
  };

  const handleLinkClick = () => {
    toggleMenu(false);
  };

  return (
    <div className="md:hidden z-30" ref={menuRef}>
      {!isMenuOpen ? (
        <button
          onClick={() => toggleMenu(true)}
          className="text-white text-2xl"
          aria-label="Abrir menu"
        >
          ☰
        </button>
      ) : (
        <button
          onClick={() => toggleMenu(false)}
          className="text-white text-2xl"
          aria-label="Fechar menu"
        >
          ✖
        </button>
      )}
      {isMenuOpen && (
        <div className="absolute top-16 right-0 bg-white p-4 rounded-lg shadow-lg w-48">
          <ul>
            <li>
              <Link
                onClick={handleLinkClick}
                href="/"
                className="block py-2 text-black hover:bg-gray-100 px-4 rounded-lg transition duration-200 ease-in-out"
              >
                Home
              </Link>
            </li>
            <li>
              <Link
                onClick={handleLinkClick}
                href="/reports"
                className="block py-2 text-black hover:bg-gray-100 px-4 rounded-lg transition duration-200 ease-in-out"
              >
                Relatórios
              </Link>
            </li>
            <li>
              <Link
                onClick={handleLinkClick}
                href="/#ranking"
                className="block py-2 text-black hover:bg-gray-100 px-4 rounded-lg transition duration-200 ease-in-out"
              >
                Ranking
              </Link>
            </li>
            <li>
              <Link
                onClick={handleLinkClick}
                href="/#about"
                className="block py-2 text-black hover:bg-gray-100 px-4 rounded-lg transition duration-200 ease-in-out"
              >
                Sobre
              </Link>
            </li>
            <li>
              <Link
                onClick={handleLinkClick}
                href="/#regiment"
                className="block py-2 text-black hover:bg-gray-100 px-4 rounded-lg transition duration-200 ease-in-out"
              >
                Regulamento
              </Link>
            </li>
            {!isLoggedIn ? (
              <li>
                <a
                  href={getIFRNUrl(from)}
                  className="block py-2 text-black hover:bg-gray-100 px-4 rounded-lg transition duration-200 ease-in-out"
                >
                  Login
                </a>
              </li>
            ) : (
              <>
                {isFromCategory(user, "Admin") && (
                  <>
                    <li>
                      <a
                        onClick={handleLinkClick}
                        href="/groups"
                        className="block py-2 text-black hover:bg-gray-100 px-4 rounded-lg transition duration-200 ease-in-out"
                      >
                        Turmas
                      </a>
                    </li>
                    <li>
                      <a
                        onClick={handleLinkClick}
                        href="/years"
                        className="block py-2 text-black hover:bg-gray-100 px-4 rounded-lg transition duration-200 ease-in-out"
                      >
                        Anos Letivos
                      </a>
                    </li>
                    <li>
                      <a
                        onClick={handleLinkClick}
                        href="/validate"
                        className="block py-2 text-black hover:bg-gray-100 px-4 rounded-lg transition duration-200 ease-in-out"
                      >
                        Validar Pontos
                      </a>
                    </li>
                  </>
                )}
                {isFromCategory(user, "Aval") ||
                isFromCategory(user, "Admin") ? (
                  <li>
                    <a
                      onClick={handleLinkClick}
                      href="/points"
                      className="block py-2 text-black hover:bg-gray-100 px-4 rounded-lg transition duration-200 ease-in-out"
                    >
                      Lançar Pontos
                    </a>
                  </li>
                ) : null}
                {canManageOlympiads(user) && (
                  <li>
                    <a
                      onClick={handleLinkClick}
                      href="/olympiads"
                      className="block py-2 text-black hover:bg-gray-100 px-4 rounded-lg transition duration-200 ease-in-out"
                    >
                      Olimpíadas
                    </a>
                  </li>
                )}
                <li>
                  <a
                    href="#"
                    onClick={handleLogout}
                    className="block py-2 text-black hover:bg-gray-100 px-4 rounded-lg transition duration-200 ease-in-out"
                  >
                    Logout
                  </a>
                </li>
              </>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default MobileNavbar;
