import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Star, Quote } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const TestimonialsSection: React.FC = () => {
  const testimonials = [
    {
      name: 'محمد رضایی',
      role: 'مدیر محصول',
      content: 'دستیار منتور AI به من کمک کرد تا اهدافم را بهتر تعریف کنم و برنامه‌ریزی دقیق‌تری برای رسیدن به آن‌ها داشته باشم. واقعاً حس می‌کنم یک مشاور شخصی دارم.',
      rating: 5,
      initials: 'م.ر',
    },
    {
      name: 'سارا احمدی',
      role: 'کارآفرین',
      content: 'مشاور تصمیم‌گیری AI در لحظات حساس کسب‌وکارم کمک بزرگی به من کرد. تحلیل‌های جامع و بی‌طرفانه‌ای که ارائه می‌دهد، اعتماد به نفسم را در تصمیم‌گیری‌ها افزایش داده است.',
      rating: 5,
      initials: 'س.ا',
    },
    {
      name: 'علی کریمی',
      role: 'توسعه‌دهنده نرم‌افزار',
      content: 'کوچ AI دقیقاً همان چیزی بود که برای بهبود مهارت‌های برنامه‌نویسی‌ام نیاز داشتم. پاسخ‌های سریع، دقیق و کاربردی که می‌دهد، یادگیری را برایم لذت‌بخش‌تر کرده است.',
      rating: 5,
      initials: 'ع.ک',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">نظرات کاربران</h2>
        <p className="text-muted-foreground">
          تجربه کاربران واقعی از استفاده دستیارهای هوشمند AI
        </p>
      </div>
      
      <div className="grid md:grid-cols-3 gap-6">
        {testimonials.map((testimonial, index) => (
          <Card key={index} className="relative overflow-hidden">
            <CardContent className="pt-6">
              <Quote className="absolute top-4 left-4 w-8 h-8 text-primary/20" />
              
              <div className="flex items-center gap-3 mb-4">
                <Avatar>
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {testimonial.initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-semibold">{testimonial.name}</h4>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              </div>

              <div className="flex gap-1 mb-3">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                ))}
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed">
                {testimonial.content}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default TestimonialsSection;
