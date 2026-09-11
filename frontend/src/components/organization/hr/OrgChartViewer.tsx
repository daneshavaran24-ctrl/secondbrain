import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Search, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ChartNode {
  id: string;
  name: string;
  position: string;
  level: number;
  managerId?: string;
  email: string;
  department: string;
  employmentType: 'full-time' | 'part-time' | 'contract';
}

interface OrgChartViewerProps {
  organizationId: string;
  onSuccess?: () => void;
}

export function OrgChartViewer({ organizationId, onSuccess }: OrgChartViewerProps) {
  const [nodes, setNodes] = useState<ChartNode[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingNode, setIsAddingNode] = useState(false);
  const [newNode, setNewNode] = useState<Partial<ChartNode>>({
    name: '',
    position: '',
    email: '',
    department: '',
    employmentType: 'full-time',
    level: 1,
  });

  useEffect(() => {
    if (organizationId) {
      loadNodes();
    }
  }, [organizationId]);

  const loadNodes = async () => {
    if (!organizationId) return;
    
    try {
      const { data, error } = await supabase
        .from('organization_chart_nodes')
        .select('*')
        .eq('hr_id', organizationId)
        .order('level', { ascending: true });

      if (error) throw error;

      setNodes(
        data.map((n) => ({
          id: n.id,
          name: n.name,
          position: n.position,
          level: n.level,
          managerId: n.manager_id || undefined,
          email: n.email,
          department: n.department,
          employmentType: n.employment_type as any,
        }))
      );
    } catch (error: any) {
      toast.error('خطا در بارگیری چارت سازمانی');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNode = async () => {
    if (!newNode.name || !newNode.position || !newNode.email) {
      toast.error('لطفاً تمام فیلدهای الزامی را پر کنید');
      return;
    }

    try {
      const { error } = await supabase.from('organization_chart_nodes').insert({
        hr_id: organizationId,
        name: newNode.name,
        position: newNode.position,
        email: newNode.email,
        department: newNode.department || '',
        employment_type: newNode.employmentType,
        level: newNode.level || 1,
        manager_id: newNode.managerId,
        start_date: new Date().toISOString().split('T')[0],
      });

      if (error) throw error;

      toast.success('فرد جدید اضافه شد');
      setIsAddingNode(false);
      setNewNode({
        name: '',
        position: '',
        email: '',
        department: '',
        employmentType: 'full-time',
        level: 1,
      });
      loadNodes();
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || 'خطا در افزودن فرد');
    }
  };

  const handleDeleteNode = async (id: string) => {
    if (!confirm('آیا از حذف این فرد مطمئن هستید؟')) return;

    try {
      const { error } = await supabase
        .from('organization_chart_nodes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('فرد حذف شد');
      loadNodes();
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || 'خطا در حذف');
    }
  };

  const groupedByLevel = nodes.reduce((acc, node) => {
    if (!acc[node.level]) acc[node.level] = [];
    acc[node.level].push(node);
    return acc;
  }, {} as Record<number, ChartNode[]>);

  const filteredNodes = nodes.filter(
    (node) =>
      node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      node.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
      node.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return <div className="text-center py-8">در حال بارگیری...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="جستجو در چارت سازمانی..."
            className="pr-10"
          />
        </div>
        <Button onClick={() => setIsAddingNode(!isAddingNode)}>
          <Plus className="h-4 w-4 ml-2" />
          افزودن فرد
        </Button>
      </div>

      {isAddingNode && (
        <Card>
          <CardHeader>
            <CardTitle>افزودن فرد جدید</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>نام و نام خانوادگی *</Label>
                <Input
                  value={newNode.name}
                  onChange={(e) => setNewNode({ ...newNode, name: e.target.value })}
                  placeholder="نام کامل"
                />
              </div>
              <div>
                <Label>سمت *</Label>
                <Input
                  value={newNode.position}
                  onChange={(e) => setNewNode({ ...newNode, position: e.target.value })}
                  placeholder="مدیر، کارشناس، ..."
                />
              </div>
              <div>
                <Label>ایمیل *</Label>
                <Input
                  type="email"
                  value={newNode.email}
                  onChange={(e) => setNewNode({ ...newNode, email: e.target.value })}
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <Label>دپارتمان</Label>
                <Input
                  value={newNode.department}
                  onChange={(e) => setNewNode({ ...newNode, department: e.target.value })}
                  placeholder="فروش، توسعه، ..."
                />
              </div>
              <div>
                <Label>سطح</Label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={newNode.level}
                  onChange={(e) =>
                    setNewNode({ ...newNode, level: parseInt(e.target.value) })
                  }
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsAddingNode(false)}>
                انصراف
              </Button>
              <Button onClick={handleAddNode}>ذخیره</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {searchTerm ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNodes.map((node) => (
            <Card key={node.id}>
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Avatar>
                    <AvatarFallback>
                      {node.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{node.name}</h3>
                    <p className="text-sm text-muted-foreground truncate">
                      {node.position}
                    </p>
                    <p className="text-xs text-muted-foreground">{node.department}</p>
                    <Badge variant="outline" className="mt-2 text-xs">
                      Level {node.level}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteNode(node.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {Object.keys(groupedByLevel)
            .sort((a, b) => parseInt(a) - parseInt(b))
            .map((level) => (
              <div key={level}>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  سطح {level}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {groupedByLevel[parseInt(level)].map((node) => (
                    <Card key={node.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="pt-6">
                        <div className="flex flex-col items-center text-center gap-3">
                          <Avatar className="h-16 w-16">
                            <AvatarFallback className="text-lg">
                              {node.name
                                .split(' ')
                                .map((n) => n[0])
                                .join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="w-full">
                            <h3 className="font-semibold">{node.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {node.position}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {node.department}
                            </p>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="mt-3"
                              onClick={() => handleDeleteNode(node.id)}
                            >
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}

      {nodes.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>هنوز فردی در چارت سازمانی اضافه نشده است</p>
          <Button className="mt-4" onClick={() => setIsAddingNode(true)}>
            افزودن اولین فرد
          </Button>
        </div>
      )}
    </div>
  );
}
