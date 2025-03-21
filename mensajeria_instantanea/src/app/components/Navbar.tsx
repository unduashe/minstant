import Link from "next/link"

function Navbar() {
    return (
        <nav>
            <ul>
                <li>
                    <Link href={'/Espana'}>España</Link>
                </li>
                <li>
                    <Link href={'/Latam'}>LATAM</Link>
                </li>
            </ul>
        </nav>
    )
}

export default Navbar;