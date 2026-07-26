import { Outlet } from "react-router-dom";

export default function CustomerLayout() {
    return (
        <div className="customer-layout">

            <header className="navbar">

                <a href="/">
                    WartegKita
                </a>

                <nav>

                    <a href="/">
                        Home
                    </a>

                    <a href="/explore">
                        Explore
                    </a>

                    <a href="/cart">
                        Keranjang
                    </a>

                </nav>

            </header>


            <main className="main-content">

                <Outlet />

            </main>

        </div>
    );
}