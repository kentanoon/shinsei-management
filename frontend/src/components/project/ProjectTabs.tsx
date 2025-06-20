import React from 'react';
import { Tabs, Tab, Box } from '@mui/material';
import {
  Home as HomeIcon,
  Assessment as AssessmentIcon,
  Schedule as ScheduleIcon,
  Payment as PaymentIcon,
} from '@mui/icons-material';

interface ProjectTabsProps {
  currentTab: number;
  onTabChange: (event: React.SyntheticEvent, newValue: number) => void;
}

const ProjectTabs: React.FC<ProjectTabsProps> = ({ currentTab, onTabChange }) => {
  return (
    <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
      <Tabs 
        value={currentTab} 
        onChange={onTabChange}
        variant="scrollable"
        scrollButtons="auto"
        aria-label="project tabs"
      >
        <Tab 
          icon={<HomeIcon />} 
          iconPosition="start" 
          label="概要" 
          sx={{ minHeight: 64 }} 
        />
        <Tab 
          icon={<PaymentIcon />} 
          iconPosition="start" 
          label="財務情報" 
          sx={{ minHeight: 64 }} 
        />
        <Tab 
          icon={<ScheduleIcon />} 
          iconPosition="start" 
          label="スケジュール" 
          sx={{ minHeight: 64 }} 
        />
        <Tab 
          icon={<AssessmentIcon />} 
          iconPosition="start" 
          label="申請書類" 
          sx={{ minHeight: 64 }} 
        />
      </Tabs>
    </Box>
  );
};

export default ProjectTabs;
