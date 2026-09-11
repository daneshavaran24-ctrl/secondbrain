import React, { useState } from 'react';
import { Target, Heart, Edit, Save, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const Mission = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [missionData, setMissionData] = useState({
    personalStatement: 'خدمت به مردم و کمک به نیازمندان، رسالت اصلی من در این دنیا است. با ایمان به اینکه هر عمل خیر ما را به خداوند نزدیک‌تر می‌کند.',
    inspirationalVerse: 'و من أحياها فكأنما أحيا الناس جميعا',
    verseSource: 'مائده - آیه ۳۲',
    strategicGoal: 'ایجاد شبکه‌ای از خدمات رسانی که پوشش جامع و پایدار به نیازمندان ارائه دهد و فرهنگ خیرخواهی را در جامعه تقویت کند.',
    coreValues: [
      'صداقت و امانت‌داری در تمام کارها',
      'احترام به کرامت انسانی',
      'عدالت در توزیع امکانات',
      'شفافیت در عملکرد',
      'پایداری و تداوم در خدمات'
    ]
  });

  const handleSave = () => {
    // در اینجا می‌توان داده‌ها را در دیتابیس ذخیره کرد
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    // بازگردانی داده‌ها به حالت قبلی
  };

  return (
    <div className="min-h-screen bg-gradient-subtle p-8">
      <div className="max-w-4xl mx-auto spacing-relaxed">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Target className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">رسالت و فلسفه خدمت</h1>
              <p className="text-muted-foreground">بیانیه‌ها و اهداف راهبردی خدمت‌رسانی</p>
            </div>
          </div>
          <Button
            onClick={isEditing ? handleSave : () => setIsEditing(true)}
            className="flex items-center gap-2"
          >
            {isEditing ? <Save className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
            {isEditing ? 'ذخیره' : 'ویرایش'}
          </Button>
          {isEditing && (
            <Button variant="outline" onClick={handleCancel} className="mr-2">
              <X className="h-4 w-4" />
              انصراف
            </Button>
          )}
        </div>

        <div className="space-y-8">
          {/* Personal Mission Statement */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-rose-600" />
                بیانیه شخصی رسالت
              </CardTitle>
              <CardDescription>فلسفه شخصی شما در خدمت‌رسانی</CardDescription>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <Textarea
                  value={missionData.personalStatement}
                  onChange={(e) => setMissionData({...missionData, personalStatement: e.target.value})}
                  className="min-h-32"
                  placeholder="بیانیه رسالت شخصی خود را بنویسید..."
                />
              ) : (
                <p className="text-lg leading-relaxed text-foreground italic border-r-4 border-rose-500 pr-4 bg-rose-50 p-4 rounded">
                  {missionData.personalStatement}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Inspirational Verse */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-emerald-600" />
                آیه یا حدیث الهام‌بخش
              </CardTitle>
              <CardDescription>متن مقدسی که شما را در مسیر خدمت هدایت می‌کند</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isEditing ? (
                  <>
                    <div>
                      <Label htmlFor="verse">متن آیه یا حدیث</Label>
                      <Textarea
                        id="verse"
                        value={missionData.inspirationalVerse}
                        onChange={(e) => setMissionData({...missionData, inspirationalVerse: e.target.value})}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="source">منبع</Label>
                      <Input
                        id="source"
                        value={missionData.verseSource}
                        onChange={(e) => setMissionData({...missionData, verseSource: e.target.value})}
                        className="mt-2"
                      />
                    </div>
                  </>
                ) : (
                  <div className="text-center p-6 bg-emerald-50 rounded-lg border border-emerald-200">
                    <p className="text-xl font-semibold text-foreground mb-3 font-arabic">
                      {missionData.inspirationalVerse}
                    </p>
                    <p className="text-sm text-emerald-700">{missionData.verseSource}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Strategic Goal */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-600" />
                هدف راهبردی
              </CardTitle>
              <CardDescription>جهت‌گیری کلی و چشم‌انداز آینده</CardDescription>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <Textarea
                  value={missionData.strategicGoal}
                  onChange={(e) => setMissionData({...missionData, strategicGoal: e.target.value})}
                  className="min-h-24"
                  placeholder="هدف راهبردی خود را تعریف کنید..."
                />
              ) : (
                <p className="text-lg leading-relaxed text-foreground bg-blue-50 p-4 rounded border-r-4 border-blue-500">
                  {missionData.strategicGoal}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Core Values */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-purple-600" />
                ارزش‌های بنیادین
              </CardTitle>
              <CardDescription>اصول و ارزش‌هایی که عملکرد شما را هدایت می‌کنند</CardDescription>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="space-y-2">
                  {missionData.coreValues.map((value, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        value={value}
                        onChange={(e) => {
                          const newValues = [...missionData.coreValues];
                          newValues[index] = e.target.value;
                          setMissionData({...missionData, coreValues: newValues});
                        }}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newValues = missionData.coreValues.filter((_, i) => i !== index);
                          setMissionData({...missionData, coreValues: newValues});
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    onClick={() => {
                      setMissionData({
                        ...missionData,
                        coreValues: [...missionData.coreValues, 'ارزش جدید']
                      });
                    }}
                  >
                    افزودن ارزش جدید
                  </Button>
                </div>
              ) : (
                <ul className="space-y-3">
                  {missionData.coreValues.map((value, index) => (
                    <li key={index} className="flex items-center gap-3 p-3 bg-purple-50 rounded border-r-4 border-purple-500">
                      <span className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </span>
                      <span className="text-foreground">{value}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Mission;