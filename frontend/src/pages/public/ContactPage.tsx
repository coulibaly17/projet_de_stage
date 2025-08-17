import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const ContactPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Contactez-nous</h1>
        <p className="text-xl text-muted-foreground">
          Nous sommes là pour répondre à toutes vos questions
        </p>
      </div>

      <div className="bg-card rounded-lg shadow-lg p-8">
        <form className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="first-name" className="block text-sm font-medium">
                Prénom
              </label>
              <Input id="first-name" placeholder="Votre prénom" required />
            </div>
            <div className="space-y-2">
              <label htmlFor="last-name" className="block text-sm font-medium">
                Nom
              </label>
              <Input id="last-name" placeholder="Votre nom" required />
            </div>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium">
              Email
            </label>
            <Input id="email" type="email" placeholder="votre@email.com" required />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="subject" className="block text-sm font-medium">
              Sujet
            </label>
            <Input id="subject" placeholder="Objet de votre message" required />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="message" className="block text-sm font-medium">
              Message
            </label>
            <Textarea 
              id="message" 
              placeholder="Votre message..." 
              rows={5} 
              required 
              className="min-h-[150px]"
            />
          </div>
          
          <div className="pt-2">
            <Button type="submit" className="w-full md:w-auto">
              Envoyer le message
            </Button>
          </div>
        </form>
        
        <div className="mt-12 pt-8 border-t border-border">
          <h2 className="text-2xl font-semibold mb-4">Nos coordonnées</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium">Adresse</h3>
                <p className="text-sm text-muted-foreground">123 Rue de l'Éducation, 75000 Paris</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium">Téléphone</h3>
                <p className="text-sm text-muted-foreground">+33 1 23 45 67 89</p>
                <p className="text-sm text-muted-foreground">Lun-Ven, 9h-18h</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium">Email</h3>
                <p className="text-sm text-muted-foreground">contact@edusmart.fr</p>
                <p className="text-sm text-muted-foreground">Réponse sous 24h</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
