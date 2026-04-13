'use client';

import * as React from 'react';
import { Button } from '@mui/material';

interface CompareButtonProps {
  spaceId: number;
}

const STORAGE_KEY = 'compare-space-ids';

export default function CompareButton({ spaceId }: CompareButtonProps) {
  const [added, setAdded] = React.useState(false);

  React.useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const ids: number[] = raw ? JSON.parse(raw) : [];
    setAdded(ids.includes(spaceId));
  }, [spaceId]);

  function handleToggle(event: React.MouseEvent) {
    event.stopPropagation();

    const raw = window.localStorage.getItem(STORAGE_KEY);
    let ids: number[] = raw ? JSON.parse(raw) : [];

    if (ids.includes(spaceId)) {
      ids = ids.filter((id) => id !== spaceId);
      setAdded(false);
    } else {
      ids = [...ids, spaceId].slice(-2);
      setAdded(true);
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    window.dispatchEvent(new Event('compare-storage-updated'));
  }

  return (
    <Button
      onClick={handleToggle}
      variant={added ? 'contained' : 'outlined'}
      size="small"
      sx={{
        borderRadius: '999px',
        textTransform: 'none',
        fontWeight: 700,
      }}
    >
      {added ? 'Added to compare' : 'Add to compare'}
    </Button>
  );
}