import { BookOpen, Video, Award, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useRecommendations } from '@/hooks/useRecommendations';
import type { Recommendation } from '@/services/recommendation.service';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const getRecommendationType = (rec: Recommendation): 'course' | 'video' | 'exercise' | 'article' => {
  // Logique pour déterminer le type de recommandation
  if ('similarity' in rec) return 'video';
  if ('popularity' in rec) return 'course';
  return 'course'; // Par défaut
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.16, 1, 0.3, 1]
    }
  },
  exit: { 
    opacity: 0, 
    y: -20,
    transition: {
      duration: 0.2,
      ease: [0.4, 0, 1, 1]
    }
  }
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

export function RecommendationsSection() {
  const { data: recommendations, loading, error, refresh } = useRecommendations({ 
    limit: 3,
    type: 'personalized'
  });

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="border-destructive/20 bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-destructive">Erreur de chargement</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-destructive/80 mb-4">
              Impossible de charger les recommandations. Veuillez réessayer.
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => refresh()}
              className="text-destructive border-destructive/20 hover:bg-destructive/5"
            >
              Réessayer
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="h-full"
    >
      <Card className="h-full">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Recommandations pour vous</CardTitle>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={() => refresh()}
              disabled={loading}
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                className={cn(
                  "h-4 w-4 transition-transform",
                  loading && "animate-spin"
                )}
              >
                <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
                <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                <path d="M16 16h5v5" />
              </svg>
              <span className="sr-only">Actualiser</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div 
                key="loading"
                initial="hidden"
                animate="show"
                variants={containerVariants}
                className="space-y-4"
              >
                {[1, 2, 3].map((i) => (
                  <motion.div 
                    key={i} 
                    variants={itemVariants}
                    className="flex items-center space-x-3"
                  >
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-1 flex-1">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            ) : recommendations && recommendations.length > 0 ? (
              <motion.div 
                key="recommendations"
                initial="hidden"
                animate="show"
                variants={containerVariants}
                className="space-y-4"
              >
                <AnimatePresence>
                  {recommendations.map((rec) => {
                    const recommendation = rec as any; // Type assertion temporaire
                    const type = getRecommendationType(rec);
                    
                    return (
                      <motion.div
                        key={recommendation.id || recommendation.course.id}
                        variants={itemVariants}
                        layout
                        className="group flex items-center space-x-3 rounded-lg p-2 transition-colors hover:bg-muted/50"
                      >
                        <motion.div 
                          className={cn(
                            "flex h-10 w-10 items-center justify-center rounded-full bg-muted group-hover:bg-primary/10",
                            type === 'course' && "text-blue-500",
                            type === 'video' && "text-purple-500",
                            type === 'exercise' && "text-green-500"
                          )}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {type === 'course' && <BookOpen className="h-4 w-4" />}
                          {type === 'video' && <Video className="h-4 w-4" />}
                          {type === 'exercise' && <Award className="h-4 w-4" />}
                        </motion.div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium leading-none truncate">
                            {recommendation.course?.title || 'Titre non disponible'}
                          </h3>
                          <p className="text-xs text-muted-foreground truncate">
                            {recommendation.reason || 'Recommandé pour vous'}
                          </p>
                        </div>
                        <motion.div whileHover={{ x: 2 }}>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            asChild
                          >
                            <a href={`/courses/${recommendation.course?.id}`}>
                              <ArrowRight className="h-4 w-4" />
                              <span className="sr-only">Voir</span>
                            </a>
                          </Button>
                        </motion.div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
                <motion.div variants={itemVariants}>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full mt-2 text-muted-foreground hover:text-foreground"
                    asChild
                  >
                    <a href="/recommendations">
                      Voir toutes les recommandations
                    </a>
                  </Button>
                </motion.div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="rounded-md border border-dashed p-6 text-center"
              >
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <BookOpen className="h-5 w-5 text-muted-foreground" />
                </div>
                <h3 className="mt-4 text-sm font-medium text-foreground">
                  Aucune recommandation
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Consultez plus de cours pour obtenir des recommandations personnalisées.
                </p>
                <div className="mt-6">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="rounded-full"
                    onClick={() => refresh()}
                  >
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      width="16" 
                      height="16" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                      className="mr-2 h-4 w-4"
                    >
                      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                      <path d="M3 3v5h5" />
                      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                      <path d="M16 16h5v5" />
                    </svg>
                    Actualiser
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}
