import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2, Copy, Building2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { salesService, ICPProfile } from '@/services/salesService';
import { ICPForm } from './ICPForm';
import { toast } from 'sonner';

interface ICPManagerProps {
  organizationId: string;
}

export function ICPManager({ organizationId }: ICPManagerProps) {
  const [profiles, setProfiles] = useState<ICPProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProfile, setEditingProfile] = useState<ICPProfile | null>(null);

  useEffect(() => {
    loadProfiles();
  }, [organizationId]);

  const loadProfiles = async () => {
    try {
      const data = await salesService.getICPProfiles(organizationId);
      setProfiles(data);
    } catch (error) {
      console.error('Error loading ICP profiles:', error);
      toast.error('خطا در بارگذاری پروفایل‌های ICP');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('آیا از حذف این پروفایل مطمئن هستید؟')) return;

    try {
      await salesService.deleteICPProfile(id);
      toast.success('پروفایل ICP حذف شد');
      loadProfiles();
    } catch (error) {
      console.error('Error deleting ICP profile:', error);
      toast.error('خطا در حذف پروفایل');
    }
  };

  const handleDuplicate = async (profile: ICPProfile) => {
    try {
      const { id, created_at, updated_at, ...profileData } = profile;
      await salesService.createICPProfile({
        ...profileData,
        profile_name: `${profile.profile_name} (کپی)`,
      });
      toast.success('پروفایل کپی شد');
      loadProfiles();
    } catch (error) {
      console.error('Error duplicating profile:', error);
      toast.error('خطا در کپی پروفایل');
    }
  };

  if (showForm || editingProfile) {
    return (
      <ICPForm
        organizationId={organizationId}
        profile={editingProfile || undefined}
        onClose={() => {
          setShowForm(false);
          setEditingProfile(null);
        }}
        onSuccess={() => {
          setShowForm(false);
          setEditingProfile(null);
          loadProfiles();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">پروفایل‌های ICP</h3>
          <p className="text-sm text-muted-foreground">مدیریت مشتریان ایده‌آل (Ideal Customer Profile)</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          افزودن ICP
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-32 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : profiles.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">هنوز پروفایل ICP ندارید</h3>
            <p className="text-muted-foreground mb-4">
              برای شروع، اولین پروفایل مشتری ایده‌آل خود را ایجاد کنید
            </p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 ml-2" />
              ایجاد اولین ICP
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {profiles.map((profile, index) => (
            <motion.div
              key={profile.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="hover:shadow-lg transition-shadow border-border/50 bg-gradient-to-br from-card to-card/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-primary" />
                    {profile.profile_name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 text-sm">
                    {profile.industry && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">صنعت:</span>
                        <span className="font-medium">{profile.industry}</span>
                      </div>
                    )}
                    {profile.company_size && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">اندازه:</span>
                        <span className="font-medium">{profile.company_size}</span>
                      </div>
                    )}
                    {profile.annual_revenue_range && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">درآمد:</span>
                        <span className="font-medium">{profile.annual_revenue_range}</span>
                      </div>
                    )}
                  </div>

                  {profile.pain_points && profile.pain_points.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">نقاط درد:</p>
                      <div className="flex flex-wrap gap-1">
                        {profile.pain_points.slice(0, 3).map((point, i) => (
                          <span key={i} className="text-xs bg-secondary px-2 py-1 rounded">
                            {point}
                          </span>
                        ))}
                        {profile.pain_points.length > 3 && (
                          <span className="text-xs text-muted-foreground">
                            +{profile.pain_points.length - 3} بیشتر
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingProfile(profile)}
                      className="flex-1"
                    >
                      <Edit className="w-3 h-3 ml-1" />
                      ویرایش
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDuplicate(profile)}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(profile.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
