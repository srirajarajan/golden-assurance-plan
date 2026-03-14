import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, LogIn, LogOut, Shield, User } from 'lucide-react';
import { useState } from 'react';
import logo from '@/assets/logo.png';
import { Button } from '@/components/ui/button';

const Header = () => {
  const { language, setLanguage, t } = useLanguage();
  const { user, isAdmin, signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { path: '/', label: t.nav.home },
    { path: '/apply', label: t.nav.apply },
    { path: '/benefits', label: t.nav.benefits },
    { path: '/contact', label: t.nav.contact },
  ];

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex h-20 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <img src={logo} alt="William Carey Insurance" className="h-14 w-14 object-contain" />
            <span className="hidden sm:block font-display text-lg font-semibold text-secondary">
              {language === 'ta' ? 'வில்லியம் கேரி' : 'William Carey'}
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  location.pathname === item.path ? 'text-primary' : 'text-foreground/80'
                }`}
              >
                {item.label}
              </Link>
            ))}
            {isAdmin && (
              <Link
                to="/admin"
                className={`text-sm font-medium transition-colors hover:text-primary flex items-center gap-1 ${
                  location.pathname === '/admin' ? 'text-primary' : 'text-foreground/80'
                }`}
              >
                <Shield className="h-4 w-4" />
                {language === 'ta' ? 'நிர்வாகி' : 'Admin'}
              </Link>
            )}
          </nav>

          {/* Auth & Language */}
          <div className="flex items-center gap-4">
            {/* Language Switch */}
            <div className="flex items-center bg-muted rounded-full p-1">
              <button
                onClick={() => setLanguage('ta')}
                className={`px-3 py-1.5 text-sm font-medium rounded-full transition-all ${
                  language === 'ta'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                தமிழ்
              </button>
              <button
                onClick={() => setLanguage('en')}
                className={`px-3 py-1.5 text-sm font-medium rounded-full transition-all ${
                  language === 'en'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                EN
              </button>
            </div>

            {/* Auth Buttons - Desktop */}
            <div className="hidden md:flex items-center gap-2">
              {user ? (
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  {language === 'ta' ? 'வெளியேறு' : 'Logout'}
                </Button>
              ) : (
                <Link to="/login">
                  <Button variant="outline" size="sm">
                    <LogIn className="mr-2 h-4 w-4" />
                    {language === 'ta' ? 'உள்நுழைக' : 'Login'}
                  </Button>
                </Link>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-foreground"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="md:hidden py-4 border-t border-border animate-fade-in">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMenuOpen(false)}
                className={`block py-3 text-sm font-medium transition-colors hover:text-primary ${
                  location.pathname === item.path ? 'text-primary' : 'text-foreground/80'
                }`}
              >
                {item.label}
              </Link>
            ))}
            {isAdmin && (
              <Link
                to="/admin"
                onClick={() => setIsMenuOpen(false)}
                className={`block py-3 text-sm font-medium transition-colors hover:text-primary flex items-center gap-1 ${
                  location.pathname === '/admin' ? 'text-primary' : 'text-foreground/80'
                }`}
              >
                <Shield className="h-4 w-4" />
                {language === 'ta' ? 'நிர்வாகி' : 'Admin'}
              </Link>
            )}
            <div className="pt-4 border-t border-border mt-4">
              {user ? (
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center gap-2 text-sm font-medium text-foreground/80 hover:text-primary"
                >
                  <LogOut className="h-4 w-4" />
                  {language === 'ta' ? 'வெளியேறு' : 'Logout'}
                </button>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-2 text-sm font-medium text-foreground/80 hover:text-primary"
                >
                  <LogIn className="h-4 w-4" />
                  {language === 'ta' ? 'உள்நுழைக' : 'Login'}
                </Link>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;
