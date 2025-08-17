-- Script SQL simple pour corriger la progression des leçons
-- Exécuter ce script directement dans phpMyAdmin ou votre client MySQL

-- 1. Nettoyer les anciennes données (optionnel)
-- DELETE FROM user_progress;

-- 2. Insérer les progressions pour toutes les leçons de tous les cours inscrits
INSERT INTO user_progress (user_id, course_id, lesson_id, is_completed, completion_percentage, last_accessed, created_at, updated_at)
SELECT 
    cs.student_id as user_id,
    l.course_id,
    l.id as lesson_id,
    -- Vérifier si la leçon est complétée via lesson_completions
    CASE 
        WHEN lc.lesson_id IS NOT NULL THEN 1 
        ELSE 0 
    END as is_completed,
    -- Progression : 100% si complétée, sinon progression aléatoire ou 0
    CASE 
        WHEN lc.lesson_id IS NOT NULL THEN 100.0
        -- Donner une progression partielle à quelques leçons non complétées (optionnel)
        WHEN RAND() < 0.2 THEN ROUND(RAND() * 80 + 10, 2)  -- 20% des leçons ont 10-90% de progression
        ELSE 0.0
    END as completion_percentage,
    -- Date d'accès : date de completion si complétée, sinon maintenant
    COALESCE(lc.completed_at, NOW()) as last_accessed,
    NOW() as created_at,
    CASE 
        WHEN lc.lesson_id IS NOT NULL THEN lc.completed_at
        ELSE NULL
    END as updated_at
FROM course_student cs
JOIN lessons l ON cs.course_id = l.course_id
JOIN users u ON cs.student_id = u.id
LEFT JOIN lesson_completions lc ON cs.student_id = lc.user_id AND l.id = lc.lesson_id
WHERE u.role = 'etudiant'
-- Éviter les doublons si le script est exécuté plusieurs fois
AND NOT EXISTS (
    SELECT 1 FROM user_progress up 
    WHERE up.user_id = cs.student_id 
    AND up.lesson_id = l.id
)
ORDER BY cs.student_id, l.course_id, l.module_id, l.order_index;

-- 3. Vérification : Afficher un résumé des données créées
SELECT 
    u.username,
    c.title as course_title,
    COUNT(*) as total_lessons,
    SUM(CASE WHEN up.is_completed = 1 THEN 1 ELSE 0 END) as completed_lessons,
    ROUND(AVG(up.completion_percentage), 2) as avg_progress_percentage
FROM user_progress up
JOIN users u ON up.user_id = u.id
JOIN courses c ON up.course_id = c.id
WHERE u.role = 'etudiant'
GROUP BY u.id, c.id
ORDER BY u.username, c.title;

-- 4. Vérification : Compter le nombre total d'entrées créées
SELECT 
    'Total entrées user_progress' as description,
    COUNT(*) as count
FROM user_progress
UNION ALL
SELECT 
    'Entrées avec progression > 0%' as description,
    COUNT(*) as count
FROM user_progress 
WHERE completion_percentage > 0
UNION ALL
SELECT 
    'Leçons complétées (100%)' as description,
    COUNT(*) as count
FROM user_progress 
WHERE is_completed = 1;
