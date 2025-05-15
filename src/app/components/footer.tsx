export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-gray-800 text-white py-4">
      <div className="container mx-auto px-6">
        {/* Top section with disclaimer */}
        <div className="text-center mb-3">
          <p className="text-sm md:text-base">
            Disclaimer: This system is for educational purposes only.
          </p>
        </div>
        
        {/* Links centered in the middle to avoid message overlay */}
        <div className="flex justify-center mb-3">
          <div className="flex space-x-4 sm:space-x-8">
            <a href="/privacy-policy" className="text-sm text-gray-300 hover:text-white transition-colors">
              Privacy Policy
            </a>
            <a href="/terms-of-service" className="text-sm text-gray-300 hover:text-white transition-colors">
              Terms of Service
            </a>
            <a href="/contact-us" className="text-sm text-gray-300 hover:text-white transition-colors">
              Contact Us
            </a>
          </div>
        </div>
        
        {/* Copyright at bottom */}
        <div className="text-center border-t border-gray-700 pt-3">
          <p className="text-xs sm:text-sm text-gray-400">
            &copy; {currentYear} SkillConnect. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}