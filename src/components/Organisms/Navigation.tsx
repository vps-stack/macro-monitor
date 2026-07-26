import { Link } from "react-router-dom";
import cog from "../../assets/images/cogwheel.png";
import styles from "./Navigation.module.scss";
import { logout } from "../../services/api";

export default function Navigation() {
   const handleLogout = () => {
      logout();
   };

   return (
      <nav>
         <ul className={styles.desktopMenu}>
            <li>
               <Link to="/balance">Balance</Link>
            </li>
            <li>
               <Link to="/products">Products</Link>
            </li>
            <li>
               <Link to="/archive">Archive</Link>
            </li>
            <li>
               <Link className={styles.cogwheel} to="/options">
                  <img className={styles.cog} src={cog} alt="cog wheel icon" />
               </Link>
            </li>
            <li>
               <Link to="/account">Account</Link>
            </li>
            <li onClick={handleLogout}>
               <Link to="#">Logout</Link>
            </li>
         </ul>
      </nav>
   );
}
