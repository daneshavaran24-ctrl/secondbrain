import { supabase } from '@/integrations/supabase/client';

export interface Employee {
  id: string;
  organization_id: string;
  employee_code?: string;
  full_name: string;
  position?: string;
  department_id?: string;
  email?: string;
  phone?: string;
  employment_type?: string;
  hire_date?: string;
  base_salary?: number;
  allowances?: number;
  bonus?: number;
  currency?: string;
  bank_account?: string;
  status?: string;
  manager_id?: string;
  avatar_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Department {
  id: string;
  organization_id: string;
  name: string;
  code?: string;
  description?: string;
  head_id?: string;
  budget?: number;
  parent_department_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PerformanceEvaluation {
  id: string;
  organization_id: string;
  employee_id: string;
  evaluator_id?: string;
  evaluator_name: string;
  evaluation_period: string;
  evaluation_date: string;
  performance_score?: number;
  goals_achieved?: number;
  strengths?: string[];
  areas_for_improvement?: string[];
  goals_for_next_period?: string[];
  feedback?: string;
  employee_comments?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

// Employee CRUD
export async function getEmployees(organizationId: string): Promise<Employee[]> {
  const { data, error } = await supabase
    .from('organization_employees')
    .select('*')
    .eq('organization_id', organizationId)
    .order('full_name');

  if (error) throw error;
  return data || [];
}

export async function createEmployee(employee: Omit<Employee, 'id' | 'created_at' | 'updated_at'>): Promise<Employee> {
  const { data, error } = await supabase
    .from('organization_employees')
    .insert(employee)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateEmployee(id: string, updates: Partial<Employee>): Promise<Employee> {
  const { data, error } = await supabase
    .from('organization_employees')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteEmployee(id: string): Promise<void> {
  const { error } = await supabase
    .from('organization_employees')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Department CRUD
export async function getDepartments(organizationId: string): Promise<Department[]> {
  const { data, error } = await supabase
    .from('organization_departments')
    .select('*')
    .eq('organization_id', organizationId)
    .order('name');

  if (error) throw error;
  return data || [];
}

export async function createDepartment(department: Omit<Department, 'id' | 'created_at' | 'updated_at'>): Promise<Department> {
  const { data, error } = await supabase
    .from('organization_departments')
    .insert(department)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateDepartment(id: string, updates: Partial<Department>): Promise<Department> {
  const { data, error } = await supabase
    .from('organization_departments')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteDepartment(id: string): Promise<void> {
  const { error } = await supabase
    .from('organization_departments')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Performance Evaluation CRUD
export async function getPerformanceEvaluations(organizationId: string): Promise<PerformanceEvaluation[]> {
  const { data, error } = await supabase
    .from('organization_performance_evaluations')
    .select('*')
    .eq('organization_id', organizationId)
    .order('evaluation_date', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createPerformanceEvaluation(
  evaluation: Omit<PerformanceEvaluation, 'id' | 'created_at' | 'updated_at'>
): Promise<PerformanceEvaluation> {
  const { data, error } = await supabase
    .from('organization_performance_evaluations')
    .insert(evaluation)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updatePerformanceEvaluation(
  id: string,
  updates: Partial<PerformanceEvaluation>
): Promise<PerformanceEvaluation> {
  const { data, error } = await supabase
    .from('organization_performance_evaluations')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deletePerformanceEvaluation(id: string): Promise<void> {
  const { error } = await supabase
    .from('organization_performance_evaluations')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
