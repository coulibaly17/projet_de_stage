import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, Check, X, Plus } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import type { Question } from '@/services/quiz.service';

interface QuestionEditorProps {
  question: Question;
  index: number;
  onUpdate: (updatedQuestion: Question) => void;
  onCancel: () => void;
  onRemove: () => void;
}

export function QuestionEditor({ 
  question, 
  index, 
  onUpdate, 
  onCancel,
  onRemove
}: QuestionEditorProps) {
  const [editedQuestion, setEditedQuestion] = useState(question);
  const [newOptionText, setNewOptionText] = useState('');

  // Mettre à jour le texte de la question
  const handleQuestionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditedQuestion({
      ...editedQuestion,
      text: e.target.value
    });
  };

  // Mettre à jour une option
  const handleOptionChange = (optionId: string, text: string) => {
    setEditedQuestion({
      ...editedQuestion,
      options: (editedQuestion.options || []).map(opt => 
        opt.id === optionId ? { ...opt, text } : opt
      )
    });
  };

  // Basculer l'état "correct" d'une option
  const toggleOptionCorrect = (optionId: string) => {
    setEditedQuestion({
      ...editedQuestion,
      options: (editedQuestion.options || []).map(opt => 
        opt.id === optionId ? { ...opt, isCorrect: !opt.isCorrect } : opt
      )
    });
  };

  // Ajouter une nouvelle option
  const addOption = () => {
    if (!newOptionText.trim()) return;
    
    const newOption = {
      id: `opt-${Date.now()}`,
      text: newOptionText,
      isCorrect: false
    };
    
    setEditedQuestion({
      ...editedQuestion,
      options: [...(editedQuestion.options || []), newOption]
    });
    
    setNewOptionText('');
  };

  // Supprimer une option
  const removeOption = (optionId: string) => {
    setEditedQuestion({
      ...editedQuestion,
      options: (editedQuestion.options || []).filter(opt => opt.id !== optionId)
    });
  };

  // Gérer la sauvegarde de la question
  const handleSave = async () => {
    console.log('📝 Début de la sauvegarde de la question');
    
    try {
      // Créer une copie de la question modifiée
      let questionToUpdate = { ...editedQuestion };
      
      // S'assurer que les options existent
      if (!questionToUpdate.options) {
        questionToUpdate.options = [];
      }
      
      // Vérifier s'il y a des options
      if (questionToUpdate.options.length === 0) {
        alert('Veuillez ajouter au moins une option à la question');
        return;
      }
      
      // S'assurer qu'il y a au moins une option correcte
      const hasCorrectAnswer = questionToUpdate.options.some(opt => opt.isCorrect);
      
      if (!hasCorrectAnswer) {
        // Si aucune option n'est correcte, marquer la première comme correcte
        const updatedOptions = [...questionToUpdate.options];
        if (updatedOptions.length > 0) {
          updatedOptions[0].isCorrect = true;
          questionToUpdate = {
            ...questionToUpdate,
            options: updatedOptions
          };
          
          // Mettre à jour l'état local
          setEditedQuestion(questionToUpdate);
        }
      }
      
      console.log('📤 Données à envoyer au parent:', questionToUpdate);
      
      // Appeler la fonction de mise à jour du parent
      onUpdate(questionToUpdate);
      
    } catch (error) {
      console.error('❌ Erreur lors de la soumission du formulaire:', error);
    }
  };

  return (
    <div className="border rounded-lg p-4 mb-4 bg-white shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <h3 className="font-medium">Question {index + 1}</h3>
        <div className="flex gap-2">
          <Button 
            type="button" 
            variant="ghost" 
            size="sm" 
            onClick={onCancel}
          >
            <X className="h-4 w-4" />
          </Button>
          <Button 
            type="button" 
            variant="ghost" 
            size="sm"
            className="text-red-500 hover:text-red-600"
            onClick={onRemove}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div>
        <div className="mb-4">
          <Label htmlFor={`question-${question.id}`}>Texte de la question</Label>
          <Input
            id={`question-${question.id}`}
            value={editedQuestion.text}
            onChange={handleQuestionChange}
            placeholder="Entrez le texte de la question"
            className="mt-1"
            required
          />
        </div>
        
        <div className="mb-4">
          <Label htmlFor="options">Options de réponse</Label>
          <div className="space-y-2 mt-2">
            {(editedQuestion.options || []).map((option, i) => (
              <div key={option.id} className="flex items-center gap-2">
                <div className="flex items-center">
                  <Switch
                    checked={option.isCorrect}
                    onClick={(e) => {
                      e.preventDefault();
                      toggleOptionCorrect(option.id);
                    }}
                    className="data-[state=checked]:bg-green-500"
                  />
                </div>
                <Input
                  value={option.text}
                  onChange={(e) => handleOptionChange(option.id, e.target.value)}
                  placeholder={`Option ${i + 1}`}
                  className="flex-1"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeOption(option.id)}
                  className="text-red-500 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            
            <div className="flex gap-2 mt-2">
              <Input
                value={newOptionText}
                onChange={(e) => setNewOptionText(e.target.value)}
                placeholder="Ajouter une option"
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addOption}
              >
                <Plus className="h-4 w-4 mr-1" /> Ajouter
              </Button>
            </div>
          </div>
        </div>
        
        <div className="flex justify-between items-center mt-4 pt-4 border-t">
          <div>
            <Badge variant="outline" className="mr-2">
              {(editedQuestion.options || []).filter(o => o.isCorrect).length} réponse(s) correcte(s)
            </Badge>
            <Badge variant="outline">
              {(editedQuestion.options || []).length} option(s)
            </Badge>
          </div>
          <Button type="button" onClick={handleSave} size="sm">
            <Check className="h-4 w-4 mr-1" /> Enregistrer
          </Button>
        </div>
      </div>
    </div>
  );
}
