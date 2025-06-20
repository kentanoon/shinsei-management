import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Chip,
  Tooltip,
  Button,
  Card,
  CardContent,
} from '@mui/material';
import {
  ChevronLeft as PrevIcon,
  ChevronRight as NextIcon,
  Today as TodayIcon,
} from '@mui/icons-material';
import { projectApi } from '../services/api';

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  type: 'reinforcement' | 'interim' | 'completion';
  projectCode: string;
  projectName: string;
}

interface InspectionCalendarProps {
  onDateClick?: (date: Date, events: CalendarEvent[]) => void;
}

const InspectionCalendar: React.FC<InspectionCalendarProps> = ({ onDateClick }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, [currentDate]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await projectApi.getProjects({ skip: 0, limit: 1000 });
      const calendarEvents = generateCalendarEvents(response.projects);
      setEvents(calendarEvents);
    } catch (error) {
      console.error('Failed to fetch calendar events:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateCalendarEvents = (projects: any[]): CalendarEvent[] => {
    const events: CalendarEvent[] = [];

    projects.forEach((project) => {
      if (project.schedule) {
        const inspectionTypes = [
          {
            field: 'reinforcement_scheduled',
            type: 'reinforcement' as const,
            title: '配筋検査'
          },
          {
            field: 'interim_scheduled',
            type: 'interim' as const,
            title: '中間検査'
          },
          {
            field: 'completion_scheduled',
            type: 'completion' as const,
            title: '完了検査'
          }
        ];

        inspectionTypes.forEach(({ field, type, title }) => {
          const date = project.schedule[field];
          if (date) {
            events.push({
              id: `${project.id}-${field}`,
              title: `${title}`,
              date,
              type,
              projectCode: project.project_code,
              projectName: project.project_name,
            });
          }
        });
      }
    });

    return events;
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'reinforcement':
        return '#ff6b6b';
      case 'interim':
        return '#4ecdc4';
      case 'completion':
        return '#45b7d1';
      default:
        return '#95a5a6';
    }
  };

  const getEventTypeLabel = (type: string) => {
    switch (type) {
      case 'reinforcement':
        return '配筋';
      case 'interim':
        return '中間';
      case 'completion':
        return '完了';
      default:
        return '';
    }
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getEventsForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return events.filter(event => event.date === dateString);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isPastDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Previous month's trailing days
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <Box key={`empty-${i}`} sx={{ p: 1, minHeight: 80 }}>
        </Box>
      );
    }

    // Current month's days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dayEvents = getEventsForDate(date);
      const isCurrentDay = isToday(date);
      const isPast = isPastDate(date);

      days.push(
        <Box
          key={day}
          sx={{
            p: 1,
            minHeight: 80,
            border: 1,
            borderColor: 'divider',
            bgcolor: isCurrentDay ? 'primary.light' : isPast ? 'grey.50' : 'background.paper',
            cursor: dayEvents.length > 0 ? 'pointer' : 'default',
            '&:hover': {
              bgcolor: dayEvents.length > 0 ? 'action.hover' : undefined,
            },
          }}
          onClick={() => {
            if (dayEvents.length > 0 && onDateClick) {
              onDateClick(date, dayEvents);
            }
          }}
        >
          <Typography
            variant="body2"
            sx={{
              fontWeight: isCurrentDay ? 'bold' : 'normal',
              color: isPast ? 'text.secondary' : isCurrentDay ? 'primary.contrastText' : 'text.primary',
              mb: 1,
            }}
          >
            {day}
          </Typography>
          
          {dayEvents.slice(0, 2).map((event) => (
            <Tooltip
              key={event.id}
              title={`${event.projectCode} - ${event.projectName}`}
              arrow
            >
              <Chip
                label={getEventTypeLabel(event.type)}
                size="small"
                sx={{
                  mb: 0.5,
                  fontSize: '0.6rem',
                  height: 16,
                  bgcolor: getEventColor(event.type),
                  color: 'white',
                  '& .MuiChip-label': { px: 0.5 },
                }}
              />
            </Tooltip>
          ))}
          
          {dayEvents.length > 2 && (
            <Typography variant="caption" color="textSecondary">
              +{dayEvents.length - 2}件
            </Typography>
          )}
        </Box>
      );
    }

    return days;
  };

  const renderWeekDays = () => {
    const weekDays = ['日', '月', '火', '水', '木', '金', '土'];
    return weekDays.map((day, index) => (
      <Box
        key={day}
        sx={{
          p: 1,
          textAlign: 'center',
          bgcolor: 'grey.100',
          fontWeight: 'bold',
          color: index === 0 ? 'error.main' : index === 6 ? 'primary.main' : 'text.primary',
        }}
      >
        {day}
      </Box>
    ));
  };

  const monthName = currentDate.toLocaleDateString('ja-JP', { 
    year: 'numeric', 
    month: 'long' 
  });

  return (
    <Paper sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6">
          🗓️ 検査カレンダー
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton onClick={() => navigateMonth('prev')} size="small">
            <PrevIcon />
          </IconButton>
          <Typography variant="h6" sx={{ minWidth: 160, textAlign: 'center' }}>
            {monthName}
          </Typography>
          <IconButton onClick={() => navigateMonth('next')} size="small">
            <NextIcon />
          </IconButton>
          <Button
            startIcon={<TodayIcon />}
            onClick={goToToday}
            size="small"
            variant="outlined"
          >
            今日
          </Button>
        </Box>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', border: 1, borderColor: 'divider' }}>
        {renderWeekDays()}
        {renderCalendarDays()}
      </Box>

      {/* 凡例 */}
      <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Chip
          label="配筋検査"
          size="small"
          sx={{ bgcolor: getEventColor('reinforcement'), color: 'white' }}
        />
        <Chip
          label="中間検査"
          size="small"
          sx={{ bgcolor: getEventColor('interim'), color: 'white' }}
        />
        <Chip
          label="完了検査"
          size="small"
          sx={{ bgcolor: getEventColor('completion'), color: 'white' }}
        />
      </Box>
    </Paper>
  );
};

export default InspectionCalendar;