import { useState, useEffect } from 'react';
import { BsInstagram, BsSearch, BsList, BsX, BsMoon, BsSun } from "react-icons/bs";
import { FaFacebook, FaYoutube } from "react-icons/fa";
import { useNavigate } from 'react-router-dom';

function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isSticky, setIsSticky] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const handleScroll = () => {
            setIsSticky(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navItems = [
        {
            name: 'Home',
            onClick: () => navigate('/')
        },
        { name: 'Matches', href: '/matches' ,onclick: (navigate)=>navigate('/matches')},
        { name: 'Live', href: '/score', onClick: (navigate) => navigate('/score') },
        { name: 'Series', href: '/' },
        { name: 'Contact', href: '#contact' }
    ];

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
    const toggleTheme = () => setIsDarkMode(!isDarkMode);

    const handleSearch = (e) => {
        e.preventDefault();
        console.log('Searching for:', searchQuery);
    };

    return (
        <div className={isDarkMode ? 'dark-mode' : 'light-mode'}>
            <div className="bg-black py-2">
                <div className="max-w-7xl mx-auto px-4 flex justify-end items-center gap-4">
                    <a href="#" className="hover:opacity-80 transition-opacity">
                        <FaYoutube color="#fff" size={20} />
                    </a>
                    <a href="#" className="hover:opacity-80 transition-opacity">
                        <FaFacebook color="#fff" size={20} />
                    </a>
                    <a href="#" className="hover:opacity-80 transition-opacity">
                        <BsInstagram color="#fff" size={20} />
                    </a>
                </div>
            </div>

            <nav className={`border-b border-silver-500  p-1 ${isSticky ? 'fixed p-2  top-0 left-0 right-0 shadow-lg z-50' : 'relative'} ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-800'} transition-all duration-300`}>
                <div className="max-w-7xl mx-auto px-4 ">
                    <div className="flex justify-between items-center h-16">

                        <div className="flex-shrink-0" onClick={()=>navigate('/')}>
                         <img src=".\assets\logo_cric.png" alt="logo_cruc" className="img-fluid h-[90px]" />
                        </div>

                        <div className="hidden lg:flex items-center space-x-6">
                            {navItems.map((item) => (
                                <a
                                    key={item.name}
                                    href={item.href}
                                    className="hover:text-green-600 cursor-pointer transition-colors font-medium"
                                >
                                    {item.name}
                                </a>
                            ))}
                        </div>

                        {/* Search Bar & Theme Toggle */}
                        <div className="hidden md:flex items-center gap-3">
                            <form onSubmit={handleSearch} className="relative">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search posts..."
                                    className={`pl-4 pr-10 py-2 rounded-full border-2 ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-100 border-gray-300 text-gray-800'} focus:outline-none focus:border-green-600 transition-colors w-48`}
                                />
                                <button
                                    type="submit"
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-green-600"
                                >
                                    <BsSearch size={18} />
                                </button>
                            </form>

                            {/* Theme Toggle */}
                            <button
                                onClick={toggleTheme}
                                className={`p-2 rounded-full ${isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-200 hover:bg-gray-300'} transition-colors`}
                                aria-label="Toggle theme"
                            >
                                {isDarkMode ? <BsSun size={20} /> : <BsMoon size={20} />}
                            </button>
                        </div>

                        {/* Mobile Menu Button */}
                        <div className="lg:hidden flex items-center gap-2">
                            <button
                                onClick={toggleTheme}
                                className={`p-2 rounded-full ${isDarkMode ? 'bg-gray-800' : 'bg-gray-200'}`}
                            >
                                {isDarkMode ? <BsSun size={18} /> : <BsMoon size={18} />}
                            </button>
                            <button
                                onClick={toggleMenu}
                                className="p-2"
                                aria-label="Toggle menu"
                            >
                                {isMenuOpen ? <BsX size={28} /> : <BsList size={28} />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu */}
                <div className={`lg:hidden ${isMenuOpen ? 'block' : 'hidden'} ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'} border-t`}>
                    <div className="px-4 py-4 space-y-3">
                        {/* Mobile Search */}
                        <form onSubmit={handleSearch} className="relative mb-4">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search posts..."
                                className={`w-full pl-4 pr-10 py-2 rounded-full border-2 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'} focus:outline-none focus:border-green-600`}
                            />
                            <button
                                type="submit"
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-green-600"
                            >
                                <BsSearch size={18} />
                            </button>
                        </form>

                        {/* Mobile Nav Links */}
                        {navItems.map((item) => (
                            <a
                                key={item.name}
                                href={item.href}
                                className="block py-2 px-4 hover:bg-green-600 hover:text-white rounded transition-colors"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                {item.name}
                            </a>
                        ))}
                    </div>
                </div>
            </nav>


        </div>
    );
}

export default Header;