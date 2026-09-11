import React from 'react';
import { PlanningHelpGuide } from './PlanningHelpGuide';

interface OrganizationalPlanningHelpGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OrganizationalPlanningHelpGuide({ isOpen, onClose }: OrganizationalPlanningHelpGuideProps) {
  return (
    <PlanningHelpGuide
      isOpen={isOpen}
      onClose={onClose}
      variant="organizational"
    />
  );
}