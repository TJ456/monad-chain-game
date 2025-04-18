import { GitHubLogoIcon, DiscordLogoIcon, TwitterLogoIcon } from "@radix-ui/react-icons"
import { Link } from "react-router-dom"
import { useEffect, useState } from "react"

const Footer = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Function to check if user has scrolled to the bottom
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;

      // Check if user is at the bottom of the page (with a small threshold)
      const isAtBottom = scrollPosition + windowHeight >= documentHeight - 20;

      // Check if user has scrolled back up significantly
      const hasScrolledUp = scrollPosition + windowHeight < documentHeight - 150;

      if (isAtBottom) {
        setIsVisible(true);
      } else if (hasScrolledUp && isVisible) {
        // Hide the footer when user scrolls back up
        setIsVisible(false);
      }
    };

    // Add scroll event listener
    window.addEventListener('scroll', handleScroll);

    // Clean up event listener
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isVisible]);

  return (
    <footer
      className={`border-t border-emerald-500/20 bg-black/30 backdrop-blur-sm mt-auto fixed bottom-0 left-0 right-0 transform transition-all duration-500 ease-out ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`}
    >
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <div className="h-6 w-6 rounded-full bg-emerald-500/40 animate-pulse" />
              </div>
              <span className="text-xl font-bold text-white">
                MONAD<span className="text-emerald-400">Chain-Games</span>
              </span>
            </div>
            <p className="text-sm text-gray-400">
              Next-gen gaming powered by MONAD blockchain technology
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-emerald-400 font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/game" className="text-gray-400 hover:text-emerald-400 transition-colors">
                  Play Game
                </Link>
              </li>
              <li>
                <Link to="/marketplace" className="text-gray-400 hover:text-emerald-400 transition-colors">
                  Marketplace
                </Link>
              </li>
              <li>
                <Link to="/leaderboard" className="text-gray-400 hover:text-emerald-400 transition-colors">
                  Leaderboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-emerald-400 font-semibold mb-4">Resources</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="text-gray-400 hover:text-emerald-400 transition-colors">
                  Documentation
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-emerald-400 transition-colors">
                  Whitepaper
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-emerald-400 transition-colors">
                  API Reference
                </a>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="text-emerald-400 font-semibold mb-4">Community</h4>
            <div className="flex space-x-4">
              <a href="#" className="p-2 rounded-full bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors">
                <DiscordLogoIcon className="h-5 w-5" />
              </a>
              <a href="#" className="p-2 rounded-full bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors">
                <TwitterLogoIcon className="h-5 w-5" />
              </a>
              <a href="#" className="p-2 rounded-full bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors">
                <GitHubLogoIcon className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-4 border-t border-emerald-500/10">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-400">
              © {new Date().getFullYear()} MONADChain. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-xs text-gray-400 hover:text-emerald-400 transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="text-xs text-gray-400 hover:text-emerald-400 transition-colors">
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer