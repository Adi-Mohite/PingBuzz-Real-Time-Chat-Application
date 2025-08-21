import React, { useEffect, useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Link } from "react-router-dom";
import { LogOut, User, Sun, Moon  } from "lucide-react";


const Navbar = () => {
  const { logout, authUser } = useAuthStore();

  const [theme, setTheme] = useState(
    localStorage.getItem("theme") || "light"
  );

  // Apply theme to document on mount & theme change
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Toggle between light & dark
  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };
  return (
    <header className="bg-base-100 border-b border-base-300 fixed w-full top-0 z-40 backdrop-blur-lg">
      <div className="container mx-auto px-4 h-16">
        <div className="flex items-center justify-between h-full">
          <Link
            className="flex items-center gap-2.5 hover:opacity-80 transition-all"
            to="/"
          >
            <div className="size-9 rounded-lg bg-transparent flex items-center justify-center">
              <img src="/PingBuzzIcons.png" className="w-10 h-10 text-primary" />
            </div>
            <h1 className="flex items-center text-lg font-bold">
              Ping
              <span className="flex items-center text-yellow-500">
                Buzz
              </span>
            </h1>
          </Link>

          <div className="flex items-center gap-2">
             <button
              onClick={toggleTheme}
              className="btn flex btn-sm gap-2 transition-colors"
            >
              {theme === "light" ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">
                {theme === "light" ? "Light" : "Dark"}
              </span>
            </button>
            {authUser && (
              <>
                <Link to={"/profile"} className={`btn flex btn-sm gap-2`}>
                  <User className="size-5" />
                  <span className="hidden sm:inline">Profile</span>
                </Link>

                <button className="flex gap-2 items-center" onClick={logout}>
                  <LogOut className="size-5" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
