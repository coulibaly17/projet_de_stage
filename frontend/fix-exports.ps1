# Script pour corriger les exports des composants
$files = @(
    "src/pages/public/CourseDetailPage.tsx",
    "src/pages/student/DashboardPage.tsx",
    "src/pages/student/CoursesPage.tsx",
    "src/pages/student/ProfilePage.tsx",
    "src/pages/teacher/DashboardPage.tsx",
    "src/pages/teacher/CoursesPage.tsx",
    "src/pages/teacher/StudentsPage.tsx",
    "src/pages/admin/DashboardPage.tsx",
    "src/pages/admin/UsersPage.tsx",
    "src/pages/admin/SettingsPage.tsx"
)

foreach ($file in $files) {
    $content = Get-Content -Path $file -Raw
    
    # Vérifier si le fichier a déjà un export default
    if (-not ($content -match "export default")) {
        # Remplacer "export function" par "function"
        $content = $content -replace "export function", "function"
        
        # Ajouter l'export default à la fin du fichier
        $componentName = [System.IO.Path]::GetFileNameWithoutExtension($file)
        $content = $content.Trim() + "\n\nexport default $componentName;\n"
        
        # Écrire les modifications dans le fichier
        $content | Set-Content -Path $file -NoNewline
        Write-Host "Corrigé : $file"
    } else {
        Write-Host "Déjà corrigé : $file"
    }
}

Write-Host "Tous les exports ont été vérifiés et corrigés si nécessaire."
