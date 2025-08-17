import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Target, 
  TrendingUp, 
  CheckCircle, 
  Award, 
  BookOpen, 
  Clock,
  Users,
  Star
} from 'lucide-react';

interface NewStudentGuideProps {
  onGetStarted?: () => void;
}

export const NewStudentGuide: React.FC<NewStudentGuideProps> = ({ onGetStarted }) => {
  const features = [
    {
      icon: <TrendingUp className="w-4 h-4 text-green-600" />,
      title: "Progression en temps réel",
      description: "Suivez votre avancement leçon par leçon"
    },
    {
      icon: <CheckCircle className="w-4 h-4 text-blue-600" />,
      title: "Suivi personnalisé",
      description: "Recommandations adaptées à votre rythme"
    },
    {
      icon: <Award className="w-4 h-4 text-purple-600" />,
      title: "Certificats à l'issue",
      description: "Validez vos compétences officiellement"
    },
    {
      icon: <Clock className="w-4 h-4 text-orange-600" />,
      title: "Apprentissage flexible",
      description: "Apprenez à votre propre rythme"
    }
  ];

  const tips = [
    "Commencez par les cours marqués 'Débutant' pour une progression optimale",
    "Prenez votre temps pour bien comprendre chaque concept avant de passer au suivant",
    "Utilisez les discussions pour poser vos questions et échanger avec d'autres étudiants",
    "Pratiquez régulièrement, même 15 minutes par jour font la différence"
  ];

  return (
    <Card className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-blue-900/20 dark:via-purple-900/20 dark:to-pink-900/20 border-0 shadow-lg">
      <CardContent className="p-6">
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
            <Target className="w-6 h-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">
                🎯 Nouveau sur la plateforme ?
              </h3>
              <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                Guide débutant
              </Badge>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Bienvenue dans votre parcours d'apprentissage ! Nous avons conçu cette plateforme 
              pour vous accompagner pas à pas dans votre progression.
            </p>
          </div>
        </div>

        {/* Fonctionnalités */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {features.map((feature, index) => (
            <div key={index} className="flex items-start gap-3 p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
              <div className="mt-0.5">{feature.icon}</div>
              <div>
                <h4 className="font-medium text-gray-800 dark:text-gray-200 text-sm">
                  {feature.title}
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Conseils */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Star className="w-4 h-4 text-yellow-500" />
            <h4 className="font-semibold text-gray-800 dark:text-gray-200">
              Conseils pour bien commencer
            </h4>
          </div>
          <div className="space-y-2">
            {tips.map((tip, index) => (
              <div key={index} className="flex items-start gap-2 text-sm">
                <span className="text-blue-500 mt-1.5 text-xs">•</span>
                <span className="text-gray-600 dark:text-gray-400">{tip}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Statistiques motivantes */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <BookOpen className="w-4 h-4 text-blue-600" />
              <span className="text-lg font-bold text-gray-800 dark:text-gray-200">50+</span>
            </div>
            <span className="text-xs text-gray-600 dark:text-gray-400">Cours disponibles</span>
          </div>
          <div className="text-center p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Users className="w-4 h-4 text-green-600" />
              <span className="text-lg font-bold text-gray-800 dark:text-gray-200">1000+</span>
            </div>
            <span className="text-xs text-gray-600 dark:text-gray-400">Étudiants actifs</span>
          </div>
          <div className="text-center p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Award className="w-4 h-4 text-purple-600" />
              <span className="text-lg font-bold text-gray-800 dark:text-gray-200">95%</span>
            </div>
            <span className="text-xs text-gray-600 dark:text-gray-400">Taux de réussite</span>
          </div>
        </div>

        {/* Bouton d'action */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            onClick={onGetStarted}
            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-2.5"
          >
            <BookOpen className="w-4 h-4 mr-2" />
            Commencer mon premier cours
          </Button>
          <Button 
            variant="outline" 
            className="flex-1 border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-900/20"
          >
            <Users className="w-4 h-4 mr-2" />
            Rejoindre la communauté
          </Button>
        </div>

        {/* Message d'encouragement */}
        <div className="mt-4 p-3 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <p className="text-sm text-green-800 dark:text-green-200 text-center">
            💡 <strong>Astuce :</strong> Chaque expert était autrefois un débutant. 
            Votre parcours d'apprentissage commence maintenant !
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
