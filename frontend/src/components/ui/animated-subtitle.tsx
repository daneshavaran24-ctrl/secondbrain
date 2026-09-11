import { useState, useEffect } from "react";

const quotes = [
  "وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا - و هر که از خدا بترسد، خدا برایش راه نجاتی قرار می‌دهد",
  "إِنَّ مَعَ الْعُسْرِ يُسْرًا - همانا با هر سختی آسانی است",
  "وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ - و هر که بر خدا توکل کند، خدا برایش کافی است",
  "لَا تَحْزَنْ إِنَّ اللَّهَ مَعَنَا - غم نخور که خدا با ماست",
  "أَلَيْسَ اللَّهُ بِكَافٍ عَبْدَهُ - آیا خدا بنده‌اش را کافی نیست؟"
];

export function AnimatedSubtitle() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false);
      
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % quotes.length);
        setIsVisible(true);
      }, 500);
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-6 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-b border-border/30 overflow-hidden">
      <div 
        className={`h-full flex items-center justify-center transition-all duration-500 transform ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
        }`}
      >
        <p className="text-xs text-muted-foreground/80 font-light px-4 text-center">
          {quotes[currentIndex]}
        </p>
      </div>
    </div>
  );
}