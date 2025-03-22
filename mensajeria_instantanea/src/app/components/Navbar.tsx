import Link from "next/link"

function LeftNavbar() {
    return (
        <nav className="w-1/5 p-3">
            <input type="text" className="border-2 border-gray-200 rounded-md p-1 w-1/1 focus:border-black" placeholder="Search chat"></input>
            <h2 className="mt-3 p-2 ps-2 font-semibold text-center">Chats</h2>
            <ul>
                <li className="p-2 ps-2 border-b border-gray-200 hover:bg-gray-600 hover:text-white hover:rounded-md">
                    <Link className="block w-full h-full" href={'/Espana'}>España</Link>
                </li>
                <li className="p-2 ps-2 border-b border-gray-200 hover:bg-gray-600 hover:text-white hover:rounded-md">
                    <Link className="block w-full h-full" href={'/Latam'}>LATAM</Link>
                </li>
            </ul>
        </nav>
    )
}

export default LeftNavbar;