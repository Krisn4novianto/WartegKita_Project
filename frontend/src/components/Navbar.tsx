import {
  Home,
  Search,
  ShoppingBag,
  User,
  MessageCircle
} from "lucide-react";


import {
  NavLink
} from "react-router-dom";


import "../styles/navbar.css";



export default function Navbar() {


  return (

    <header className="navbar">


      <div className="navbar-inner">


        {/* BRAND */}

        <NavLink
          to="/"
          className="brand"
        >

          <span>
            WartegKita
          </span>

        </NavLink>





        {/* MENU */}

        <nav className="navbar-menu">


          <NavLink
            to="/"
            end
          >

            <Home size={18} />

            Home

          </NavLink>





          <NavLink
            to="/explore"
          >

            <Search size={18} />

            Explore

          </NavLink>





          <NavLink
            to="/orders"
          >

            <ShoppingBag size={18} />

            Orders

          </NavLink>





          {/* CHAT */}

          <NavLink
            to="/chat"
          >

            <MessageCircle size={18} />

            Chat

          </NavLink>





          <NavLink
            to="/profile"
          >

            <User size={18} />

            Profile

          </NavLink>


        </nav>


      </div>


    </header>

  );

}