import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  TextField,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { ActivityType, CategoryFilter, SortType } from '../types/space';

interface FilterPanelProps {
  search: string;
  category: CategoryFilter;
  activity: ActivityType;
  sortBy: SortType;
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: CategoryFilter) => void;
  onActivityChange: (value: ActivityType) => void;
  onSortChange: (value: SortType) => void;
}

export default function FilterPanel({
  search,
  category,
  activity,
  sortBy,
  onSearchChange,
  onCategoryChange,
  onActivityChange,
  onSortChange,
}: FilterPanelProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, md: 2.2 },
        borderRadius: '28px',
        bgcolor: 'rgba(255,255,255,0.88)',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 18px 50px rgba(15, 23, 42, 0.10)',
        border: '1px solid rgba(255,255,255,0.78)',
      }}
    >
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '2fr 1fr 1fr 1fr auto' },
          gap: 1.5,
          alignItems: 'center',
        }}
      >
        <TextField
          placeholder="Search suburb or place"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          fullWidth
          size="small"
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '18px',
              bgcolor: 'rgba(255,255,255,0.92)',
            },
          }}
        />

        <FormControl
          fullWidth
          size="small"
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '18px',
              bgcolor: 'rgba(255,255,255,0.92)',
            },
          }}
        >
          <InputLabel>Category</InputLabel>
          <Select
            value={category}
            label="Category"
            onChange={(e: SelectChangeEvent) =>
              onCategoryChange(e.target.value as CategoryFilter)
            }
          >
            <MenuItem value="all">All categories</MenuItem>
            <MenuItem value="Library">Library</MenuItem>
            <MenuItem value="Park">Park</MenuItem>
            <MenuItem value="Public Lounge">Public Lounge</MenuItem>
          </Select>
        </FormControl>

        <FormControl
          fullWidth
          size="small"
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '18px',
              bgcolor: 'rgba(255,255,255,0.92)',
            },
          }}
        >
          <InputLabel>Activity</InputLabel>
          <Select
            value={activity}
            label="Activity"
            onChange={(e: SelectChangeEvent) =>
              onActivityChange(e.target.value as ActivityType)
            }
          >
            <MenuItem value="study">Study</MenuItem>
            <MenuItem value="remote work">Remote work</MenuItem>
            <MenuItem value="relax">Relax</MenuItem>
          </Select>
        </FormControl>

        <FormControl
          fullWidth
          size="small"
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '18px',
              bgcolor: 'rgba(255,255,255,0.92)',
            },
          }}
        >
          <InputLabel>Sort by</InputLabel>
          <Select
            value={sortBy}
            label="Sort by"
            onChange={(e: SelectChangeEvent) =>
              onSortChange(e.target.value as SortType)
            }
          >
            <MenuItem value="best">Best match</MenuItem>
            <MenuItem value="quiet">Most quiet</MenuItem>
            <MenuItem value="comfort">Highest comfort</MenuItem>
            <MenuItem value="distance">Nearest</MenuItem>
          </Select>
        </FormControl>

        <Button
          variant="contained"
          startIcon={<SearchIcon />}
          sx={{
            borderRadius: '999px',
            px: 3,
            py: 1.15,
            minWidth: 148,
            textTransform: 'none',
            fontWeight: 700,
            height: '100%',
            boxShadow: '0 10px 24px rgba(79,70,229,0.24)',
          }}
        >
          Search
        </Button>
      </Box>
    </Paper>
  );
}