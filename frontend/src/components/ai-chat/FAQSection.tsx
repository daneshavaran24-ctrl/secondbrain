import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { HelpCircle } from 'lucide-react';

const FAQSection: React.FC = () => {
  const faqs = [
    {
      question: 'چگونه از دستیار AI استفاده کنم؟',
      answer: 'برای شروع، یکی از سه دستیار (منتور، کوچ یا مشاور تصمیم‌گیری) را انتخاب کنید و سوال یا موضوع خود را مطرح کنید. دستیار AI بر اساس تخصص خود به شما پاسخ می‌دهد و راهنمایی‌های لازم را ارائه می‌دهد.',
    },
    {
      question: 'تفاوت منتور، کوچ و مشاور تصمیم‌گیری چیست؟',
      answer: 'منتور AI برای راهنمایی در دستیابی به اهداف و توسعه فردی طراحی شده است. کوچ AI روی بهبود مهارت‌ها و عملکرد تمرکز دارد. مشاور تصمیم‌گیری AI به شما کمک می‌کند تا با تحلیل گزینه‌های مختلف، تصمیمات بهتری بگیرید.',
    },
    {
      question: 'آیا مکالمات من محفوظ و محرمانه است؟',
      answer: 'بله، تمام مکالمات شما با رمزگذاری ایمن ذخیره می‌شود و فقط برای شما قابل دسترسی است. هیچ کس دیگری، حتی مدیران سیستم، نمی‌تواند به محتوای مکالمات شما دسترسی داشته باشد.',
    },
    {
      question: 'آیا می‌توانم تاریخچه مکالمات خود را ذخیره کنم؟',
      answer: 'بله، تمام مکالمات شما به صورت خودکار ذخیره می‌شود. شما می‌توانید در هر زمان به تاریخچه مکالمات خود دسترسی داشته باشید، آن‌ها را جستجو کنید یا به فرمت‌های مختلف (متن، PDF، Markdown) صادر کنید.',
    },
    {
      question: 'چند مکالمه می‌توانم همزمان داشته باشم؟',
      answer: 'شما می‌توانید تعداد نامحدودی مکالمه با دستیارهای مختلف داشته باشید. هر مکالمه به صورت جداگانه ذخیره می‌شود و می‌توانید در هر زمان بین آن‌ها جابه‌جا شوید.',
    },
    {
      question: 'آیا می‌توانم تصاویر یا فایل‌ها را به دستیار ارسال کنم؟',
      answer: 'بله، شما می‌توانید تصاویر را به دستیار AI ارسال کنید تا آن‌ها را تحلیل کند. این قابلیت برای مواردی مثل تحلیل نمودارها، تصاویر محصولات، یا اسناد مفید است.',
    },
    {
      question: 'آیا دستیار AI می‌تواند به زبان‌های دیگر پاسخ دهد؟',
      answer: 'در حال حاضر دستیارهای AI ما به زبان فارسی پاسخ می‌دهند. قابلیت پشتیبانی از زبان‌های دیگر در نسخه‌های آینده اضافه خواهد شد.',
    },
    {
      question: 'آیا می‌توانم از دستیار AI در موبایل استفاده کنم؟',
      answer: 'بله، وب‌اپلیکیشن ما کاملاً ریسپانسیو است و می‌توانید از طریق مرورگر موبایل خود به تمام قابلیت‌ها دسترسی داشته باشید.',
    },
  ];

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <HelpCircle className="w-6 h-6 text-primary" />
        </div>
        <CardTitle className="text-2xl">سوالات متداول</CardTitle>
        <CardDescription>
          پاسخ سوالات رایج درباره دستیارهای هوشمند AI
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-right">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-right">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
};

export default FAQSection;
