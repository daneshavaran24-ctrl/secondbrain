import React from 'react';
import { PlanningHelpGuide } from './PlanningHelpGuide';

interface PersonalPlanningHelpGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PersonalPlanningHelpGuide({ isOpen, onClose }: PersonalPlanningHelpGuideProps) {
  return (
    <PlanningHelpGuide
      isOpen={isOpen}
      onClose={onClose}
      variant="personal"
    />
  );
}