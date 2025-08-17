import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Brain, Lightbulb, LineChart, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ReactNode } from 'react';

const features = [
  {
    name: 'Parcours personnalisés',
    description: 'Des parcours adaptés à votre niveau et vos objectifs.',
    icon: Brain,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100',
  },
  {
    name: 'Suggestions intelligentes',
    description: 'Des recommandations basées sur vos progrès.',
    icon: Lightbulb,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  {
    name: 'Suivi des progrès',
    description: 'Analysez votre avancement en temps réel.',
    icon: LineChart,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100',
  },
  {
    name: 'Ressources variées',
    description: 'Accédez à des vidéos, articles, et exercices.',
    icon: BookOpen,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
  },
];

// Props du composant AnimatedCard
interface AnimatedCardProps {
  children: ReactNode;
  delay?: number;
  className?: string;
}

// Composant pour les cartes avec animation
const AnimatedCard = ({ children, delay = 0, className = '' }: AnimatedCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay }}
    className={className}
  >
    {children}
  </motion.div>
);

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Navigation */}
      

      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-gradient-to-r from-indigo-600 to-blue-700 text-white">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-12 md:mb-0">
            <AnimatedCard>
              <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                Des parcours d'apprentissage personnalisés par IA
              </h1>
              <p className="text-xl mb-8 opacity-90 max-w-xl">
                EduSmart s'adapte à votre style d'apprentissage, identifie vos forces et faiblesses, et vous recommande les meilleures ressources pour maîtriser n'importe quel sujet.
              </p>
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <Button className="bg-white text-indigo-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-100 transition-colors">
                  Commencer maintenant
                </Button>
                <Button variant="outline" className="border-2 border-white text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-white hover:text-indigo-600 transition-colors">
                  Voir la démo
                </Button>
              </div>
            </AnimatedCard>
          </div>
          
          <div className="md:w-1/2 flex justify-center">
            <AnimatedCard delay={0.2}>
              <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md relative">
                <div className="flex justify-between items-center mb-4">
                  <div className="text-gray-800 font-bold">Votre parcours d'apprentissage</div>
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                    <Brain className="text-indigo-600 w-4 h-4" />
                  </div>
                </div>
                
                <div className="mb-6">
                  <div className="text-sm text-gray-600 mb-1">Fondamentaux du Machine Learning</div>
                  <div className="h-2 bg-gray-200 rounded-full mb-1">
                    <div className="h-full bg-indigo-600 rounded-full" style={{ width: '75%' }}></div>
                  </div>
                  <div className="text-xs text-gray-500">75% complété</div>
                </div>
                
                <div className="mb-6">
                  <div className="text-sm text-gray-600 mb-1">Visualisation de données</div>
                  <div className="h-2 bg-gray-200 rounded-full mb-1">
                    <div className="h-full bg-blue-400 rounded-full" style={{ width: '40%' }}></div>
                  </div>
                  <div className="text-xs text-gray-500">40% complété</div>
                </div>
                
                <div className="bg-indigo-50 rounded-xl p-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                      <Lightbulb className="text-indigo-600 w-5 h-5" />
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">Astuce du jour</div>
                      <div className="text-xs text-gray-500">Pratiquez 15 minutes par jour pour de meilleurs résultats</div>
                    </div>
                  </div>
                </div>
              </div>
            </AnimatedCard>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <AnimatedCard>
            <div className="text-center mb-16">
              <span className="inline-block px-4 py-1 text-sm font-semibold text-indigo-600 bg-indigo-100 rounded-full mb-4">
                Fonctionnalités
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Une expérience d'apprentissage unique
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Découvrez comment notre plateforme révolutionne votre façon d'apprendre avec des outils intelligents et personnalisés.
              </p>
            </div>
          </AnimatedCard>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <AnimatedCard key={feature.name} delay={0.1 * (index + 1)}>
                <div className={`p-6 rounded-xl ${feature.bgColor} dark:bg-opacity-20 h-full transition-all duration-300 hover:shadow-lg`}>
                  <div className={`w-12 h-12 ${feature.color} bg-opacity-20 rounded-lg flex items-center justify-center mb-4`}>
                    <feature.icon className={`w-6 h-6 ${feature.color}`} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    {feature.name}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    {feature.description}
                  </p>
                  <div className="mt-4">
                    <a href="#" className="inline-flex items-center text-indigo-600 dark:text-indigo-400 font-medium hover:underline">
                      En savoir plus
                      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                      </svg>
                    </a>
                  </div>
                </div>
              </AnimatedCard>
            ))}
          </div>

          <div className="mt-16 text-center">
            <AnimatedCard delay={0.5}>
              <div className="bg-indigo-50 dark:bg-indigo-900 dark:bg-opacity-30 rounded-2xl p-8 max-w-4xl mx-auto">
                <div className="flex flex-col md:flex-row items-center">
                  <div className="md:w-2/3 md:pr-8 mb-6 md:mb-0">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Prêt à commencer votre voyage d'apprentissage ?</h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">Rejoignez des milliers d'apprenants qui ont déjà choisi notre plateforme pour atteindre leurs objectifs.</p>
                    <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                      S'inscrire gratuitement
                    </Button>
                  </div>
                  <div className="md:w-1/3">
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md">
                      <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">+95%</div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">de réussite aux examens</div>
                    </div>
                  </div>
                </div>
              </div>
            </AnimatedCard>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-indigo-600 to-blue-700 py-20 text-white text-center">
        <div className="container mx-auto px-4">
          <AnimatedCard>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Prêt à transformer votre apprentissage ?</h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Rejoignez EduSmart dès aujourd'hui et accédez à une expérience d'apprentissage personnalisée.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button
                size="lg"
                className="bg-white text-indigo-600 hover:bg-indigo-50 text-lg px-8 py-6 font-semibold"
                asChild
              >
                <Link to="/inscription">Commencer gratuitement</Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-2 border-white text-white hover:bg-white/10 text-lg px-8 py-6 font-semibold"
                asChild
              >
                <Link to="/contact">Voir une démo</Link>
              </Button>
            </div>
          </AnimatedCard>
        </div>
      </section>

      {/* Footer */}
     
    </div>
  );
}
