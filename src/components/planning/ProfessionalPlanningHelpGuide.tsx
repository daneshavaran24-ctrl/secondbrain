import React from 'react';
import { PlanningHelpGuide } from './PlanningHelpGuide';

interface ProfessionalPlanningHelpGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProfessionalPlanningHelpGuide({ isOpen, onClose }: ProfessionalPlanningHelpGuideProps) {
  return (
    <PlanningHelpGuide
      isOpen={isOpen}
      onClose={onClose}
      variant="professional"
    />
  );
}