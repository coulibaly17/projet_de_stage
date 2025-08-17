import { Link } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';

export function Footer() {

  return ( <footer className="bg-gray-900 text-white pt-16 pb-8">
    <div className="container mx-auto px-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
        <div>
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center">
              <GraduationCap className="text-white text-xl" />
            </div>
            <span className="ml-3 text-xl font-bold text-white">AbloSmart</span>
          </div>
          <p className="text-gray-400 mb-4">
            La plateforme d'apprentissage intelligente qui s'adapte à votre rythme et à vos objectifs.
          </p>
          <div className="flex space-x-4">
            <a href="#" className="text-gray-400 hover:text-white transition-colors" aria-label="Facebook">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
              </svg>
            </a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors" aria-label="Twitter">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
              </svg>
            </a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors" aria-label="LinkedIn">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd" />
              </svg>
            </a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors" aria-label="YouTube">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M19.812 5.418c.861.23 1.538.907 1.768 1.768C21.998 8.746 22 12 22 12s0 3.255-.418 4.814a2.504 2.504 0 01-1.768 1.768c-1.56.419-7.814.419-7.814.419s-6.255 0-7.814-.419a2.505 2.505 0 01-1.768-1.768C2 15.255 2 12 2 12s0-3.255.417-4.814a2.507 2.507 0 011.768-1.768C5.744 5 11.998 5 11.998 5s6.255 0 7.814.418zM14 12l-5-3v6l5-3z" clipRule="evenodd" />
              </svg>
            </a>
          </div>
        </div>

        <div>
          <h4 className="text-lg font-semibold text-white mb-4">Navigation</h4>
          <ul className="space-y-3">
            <li><Link to="/" className="text-gray-400 hover:text-white transition-colors">Accueil</Link></li>
            <li><Link to="/cours" className="text-gray-400 hover:text-white transition-colors">Cours</Link></li>
            <li><Link to="/parcours" className="text-gray-400 hover:text-white transition-colors">Parcours</Link></li>
            <li><Link to="/ressources" className="text-gray-400 hover:text-white transition-colors">Ressources</Link></li>
            <li><Link to="/blog" className="text-gray-400 hover:text-white transition-colors">Blog</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-lg font-semibold text-white mb-4">Ressources</h4>
          <ul className="space-y-3">
            <li><Link to="/documentation" className="text-gray-400 hover:text-white transition-colors">Documentation</Link></li>
            <li><Link to="/guides" className="text-gray-400 hover:text-white transition-colors">Guides</Link></li>
            <li><Link to="/faq" className="text-gray-400 hover:text-white transition-colors">FAQ</Link></li>
            <li><Link to="/support" className="text-gray-400 hover:text-white transition-colors">Support</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-lg font-semibold text-white mb-4">Entreprise</h4>
          <ul className="space-y-3">
            <li><Link to="/a-propos" className="text-gray-400 hover:text-white transition-colors">À propos</Link></li>
            <li><Link to="/carrieres" className="text-gray-400 hover:text-white transition-colors">Carrières</Link></li>
            <li><Link to="/contact" className="text-gray-400 hover:text-white transition-colors">Contact</Link></li>
            <li><Link to="/presse" className="text-gray-400 hover:text-white transition-colors">Presse</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-gray-800 pt-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 mb-4 md:mb-0">
            &copy; {new Date().getFullYear()} AbloSmart. Tous droits réservés.
          </p>
          <div className="flex space-x-6">
            <Link to="/conditions" className="text-gray-400 hover:text-white transition-colors text-sm">Conditions d'utilisation</Link>
            <Link to="/confidentialite" className="text-gray-400 hover:text-white transition-colors text-sm">Politique de confidentialité</Link>
            <Link to="/mentions-legales" className="text-gray-400 hover:text-white transition-colors text-sm">Mentions légales</Link>
          </div>
        </div>
      </div>
    </div>
  </footer>
  );
}
