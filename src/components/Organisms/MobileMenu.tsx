import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import styles from "./MobileMenu.module.scss";
import { logout } from "../../services/api";

export default function MobileMenu() {
   const [isOpen, setIsOpen] = useState(false);
   const menuRef = useRef<HTMLElement>(null); // ✅ Properly typed ref
   const location = useLocation();

   // Close menu on route change
   useEffect(() => {
      setIsOpen(false);
   }, [location.pathname]);

   // Handle ESC key and body scroll
   useEffect(() => {
      const handleEscape = (e: KeyboardEvent) => {
         // ✅ Typed event
         if (e.key === "Escape") setIsOpen(false);
      };

      if (isOpen) {
         document.addEventListener("keydown", handleEscape);
         document.body.style.overflow = "hidden";
      }

      return () => {
         document.removeEventListener("keydown", handleEscape);
         document.body.style.overflow = "unset";
      };
   }, [isOpen]);

   // Focus trap
   useEffect(() => {
      if (isOpen && menuRef.current) {
         const focusableElements = menuRef.current.querySelectorAll(
            "a[href], button:not([disabled])"
         );
         (focusableElements[0] as HTMLElement)?.focus();
      }
   }, [isOpen]);

   const handleLogout = () => {
      logout();
   };

   const menuItems = [
      { to: "/balance", label: "Balance" },
      { to: "/products", label: "Products" },
      { to: "/archive", label: "Archive" },
      { to: "/options", label: "Options" },
      { to: "/account", label: "Account" },
   ];

   return (
      <div className={styles.mobileWrapper}>
         {/* Hamburger Button */}
         <button
            className={`${styles.hamburger} ${isOpen ? styles.active : ""}`}
            onClick={() => setIsOpen(!isOpen)}
            aria-label={isOpen ? "Close menu" : "Open menu"}
            aria-expanded={isOpen}
            aria-controls="mobile-navigation"
         >
            <span></span>
            <span></span>
            <span></span>
         </button>

         {/* Backdrop */}
         <div
            className={`${styles.backdrop} ${isOpen ? styles.visible : ""}`}
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
         />

         {/* Menu */}
         <nav
            id="mobile-navigation"
            ref={menuRef}
            className={`${styles.mobileMenu} ${isOpen ? styles.open : ""}`}
            aria-label="Mobile navigation"
         >
            <div className={styles.menuHeader}>
               <h2>Menu</h2>
               <button
                  className={styles.closeBtn}
                  onClick={() => setIsOpen(false)}
                  aria-label="Close menu"
               >
               </button>
            </div>

            <ul className={styles.menuList}>
               {menuItems.map((item, index) => (
                  <li
                     key={item.to}
                     style={{ "--item-index": index } as React.CSSProperties}
                     className={styles.menuItem}
                  >
                     <Link
                        to={item.to}
                        className={location.pathname === item.to ? styles.active : ""}
                     >
                        {/* <span className={styles.icon}>{item.icon}</span> */}
                        <span>{item.label}</span>
                     </Link>
                  </li>
               ))}

               <li
                  style={{ "--item-index": menuItems.length } as React.CSSProperties}
                  className={`${styles.menuItem} ${styles.settings}`}
                  onClick={handleLogout}
               >
                  <Link to="#">
                     <span>Logout</span>
                  </Link>
               </li>
            </ul>

            <div className={styles.menuFooter}>
               <p>v1.0.0</p>
            </div>
         </nav>
      </div>
   );
}
