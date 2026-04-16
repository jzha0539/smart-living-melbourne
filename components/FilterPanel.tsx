'use client';

import * as React from 'react';
import {
  Box,
  Button,
  MenuItem,
  Paper,
  TextField,
} from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import {
  ActivityType,
  CategoryFilter,
  SortType,
} from '../types/space';

type Props = {
  search: string;
  category: CategoryFilter;
  activity: ActivityType;
  sortBy: SortType;
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: CategoryFilter) => void;
  onActivityChange: (value: ActivityType) => void;
  onSortChange: (value: SortType) => void;
  onApply?: () => void;
  onReset?: () => void;
};

export default function FilterPanel({
  search,
  category,
  activity,
  sortBy,
  onSearchChange,
  onCategoryChange,
  onActivityChange,
  onSortChange,
  onApply,
  onReset,
}: Props) {
  const [localSearch, setLocalSearch] = React.useState(search);
  const [localCategory, setLocalCategory] = React.useState<CategoryFilter>(category);
  const [localActivity, setLocalActivity] = React.useState<ActivityType>(activity);
  const [localSortBy, setLocalSortBy] = React.useState<SortType>(sortBy);

  React.useEffect(() => {
    setLocalSearch(search);
  }, [search]);

  React.useEffect(() => {
    setLocalCategory(category);
  }, [category]);

  React.useEffect(() => {
    setLocalActivity(activity);
  }, [activity]);

  React.useEffect(() => {
    setLocalSortBy(sortBy);
  }, [sortBy]);

  function handleApply() {
    onSearchChange(localSearch.trim());
    onCategoryChange(localCategory);
    onActivityChange(localActivity);
    onSortChange(localSortBy);
    onApply?.();
  }

  function handleReset() {
    setLocalSearch('');
    setLocalCategory('all');
    setLocalActivity('study');
    setLocalSortBy('best');

    onSearchChange('');
    onCategoryChange('all');
    onActivityChange('study');
    onSortChange('best');
    onReset?.();
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    handleApply();
  }

  return (
    <Paper
      component="form"
      onSubmit={handleSubmit}
      elevation={0}
      sx={{
        p: { xs: 2, md: 2.5 },
        borderRadius: '28px',
        bgcolor: '#ffffff',
        border: '1px solid #eceff5',
        boxShadow: '0 12px 30px rgba(15,23,42,0.04)',
      }}
    >
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            md: '2fr 1fr 1fr 1fr auto',
          },
          gap: 2,
          alignItems: 'center',
        }}
      >
        <TextField
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          placeholder="Search suburb or place"
          fullWidth
          variant="outlined"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleApply();
            }
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '999px',
              bgcolor: '#fff',
              minHeight: 54,
            },
          }}
        />

        <TextField
          select
          label="Category"
          value={localCategory}
          onChange={(e) => setLocalCategory(e.target.value as CategoryFilter)}
          fullWidth
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '999px',
              minHeight: 54,
            },
          }}
        >
          <MenuItem value="all">All categories</MenuItem>
          <MenuItem value="Library">Library</MenuItem>
          <MenuItem value="Park">Park</MenuItem>
          <MenuItem value="Public Lounge">Public Lounge</MenuItem>
        </TextField>

        <TextField
          select
          label="Activity"
          value={localActivity}
          onChange={(e) => setLocalActivity(e.target.value as ActivityType)}
          fullWidth
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '999px',
              minHeight: 54,
            },
          }}
        >
          <MenuItem value="study">Study</MenuItem>
          <MenuItem value="remote work">Remote work</MenuItem>
          <MenuItem value="relax">Relax</MenuItem>
        </TextField>

        <TextField
          select
          label="Sort by"
          value={localSortBy}
          onChange={(e) => setLocalSortBy(e.target.value as SortType)}
          fullWidth
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '999px',
              minHeight: 54,
            },
          }}
        >
          <MenuItem value="best">Best match</MenuItem>
          <MenuItem value="quiet">Quietest</MenuItem>
          <MenuItem value="comfort">Highest comfort</MenuItem>
          <MenuItem value="distance">Closest</MenuItem>
        </TextField>

        <Box
          sx={{
            display: 'flex',
            gap: 1.2,
            flexDirection: { xs: 'column', lg: 'row' },
          }}
        >
          <Button
            type="submit"
            variant="contained"
            startIcon={<SearchRoundedIcon />}
            sx={{
              minWidth: 160,
              height: 54,
              borderRadius: '999px',
              textTransform: 'none',
              fontWeight: 800,
              fontSize: '1rem',
              boxShadow: '0 12px 24px rgba(79,70,229,0.22)',
            }}
          >
            Search
          </Button>

          <Button
            type="button"
            variant="outlined"
            onClick={handleReset}
            sx={{
              minWidth: 120,
              height: 54,
              borderRadius: '999px',
              textTransform: 'none',
              fontWeight: 800,
            }}
          >
            Reset
          </Button>
        </Box>
      </Box>
    </Paper>
  );
}