'use client';

import * as React from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
} from '@mui/material';
import StorageOutlinedIcon from '@mui/icons-material/StorageOutlined';
import TuneOutlinedIcon from '@mui/icons-material/TuneOutlined';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import StarBorderOutlinedIcon from '@mui/icons-material/StarBorderOutlined';
import ScheduleOutlinedIcon from '@mui/icons-material/ScheduleOutlined';
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import AppNavbar from '../../components/AppNavbar';

type NoteCard = {
  title: string;
  text: string;
  icon: React.ReactNode;
};

type FaqItem = {
  question: string;
  answer: string;
};

const noteCards: NoteCard[] = [
  {
    title: 'How the data works',
    text: 'Live noise, comfort and shade readings come from a Melbourne sensor network, refreshed regularly.',
    icon: <StorageOutlinedIcon />,
  },
  {
    title: 'Tuning the suggestions',
    text: 'The Preferences sliders re-rank Top Picks instantly. Higher quiet weight = quieter spots float up.',
    icon: <TuneOutlinedIcon />,
  },
  {
    title: 'Privacy basics',
    text: "Saved spots and preferences live on your device only. We don't store profiles or send your location anywhere.",
    icon: <ShieldOutlinedIcon />,
  },
  {
    title: 'Reading the Serenity score',
    text: 'A 0–100 blend of noise, comfort, shade and location context. Higher scores mean calmer places.',
    icon: <StarBorderOutlinedIcon />,
  },
  {
    title: 'Best time today',
    text: "A simple time-of-day estimate based on each spot's baseline noise and typical CBD rhythms.",
    icon: <ScheduleOutlinedIcon />,
  },
  {
    title: 'Got feedback?',
    text: "Email the team — we're a small student project and we read everything.",
    icon: <HelpOutlineOutlinedIcon />,
  },
];

const faqItems: FaqItem[] = [
  {
    question: 'How accurate are the noise readings?',
    answer:
      'Each reading is a rolling average over the most recent sensor window — not a single instantaneous spike. Treat values within a few decibels of each other as equivalent.',
  },
  {
    question: 'Why is the "Cafés" filter sometimes empty?',
    answer:
      'The current sensor dataset focuses on libraries, parks and public lounges. Cafés will appear here as soon as cafe-tagged spaces are added to the dataset.',
  },
  {
    question: 'Can I sync my saved spots across devices?',
    answer:
      "Not yet. Saved spots are kept in your browser's local storage. Clearing browser data will remove them.",
  },
  {
    question: 'How do you decide which spot wins a comparison?',
    answer:
      'For each metric we pick the better value. For example, lower noise and higher comfort perform better. Ties are shown as no-winner. The final message is computed from the overall serenity score.',
  },
  {
    question: 'Does the app know where I am?',
    answer:
      'Only if you turn on location access and your browser grants permission. The default is off, and the app can still work without using your exact location.',
  },
  {
    question: 'Can I rely on this app for safety-critical decisions?',
    answer:
      'No. This is a recommendation tool for finding pleasant spaces. Use official sources for emergencies, accessibility-critical needs, or safety-critical decisions.',
  },
];

function HelpCard({ card }: { card: NoteCard }) {
  return (
    <Paper
      elevation={0}
      sx={{
        minHeight: 176,
        p: 2.4,
        borderRadius: '14px',
        border: '1px solid #d8ccb7',
        bgcolor: 'rgba(255, 250, 242, 0.58)',
        boxShadow: '0 8px 18px rgba(73, 62, 42, 0.04)',
        transition:
          'transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease, background-color 180ms ease',
        cursor: 'default',
        '&:hover': {
          transform: 'translateY(-6px)',
          borderColor: '#8ea285',
          bgcolor: 'rgba(255, 250, 242, 0.86)',
          boxShadow: '0 18px 34px rgba(73, 62, 42, 0.14)',
        },
      }}
    >
      <Box
        sx={{
          color: '#64785e',
          mb: 2.2,
          transition: 'transform 180ms ease, color 180ms ease',
          '.MuiPaper-root:hover &': {
            transform: 'translateY(-2px) scale(1.04)',
            color: '#536b4e',
          },
          '& svg': {
            fontSize: 30,
            strokeWidth: 1.4,
          },
        }}
      >
        {card.icon}
      </Box>

      <Typography
        sx={{
          fontFamily: 'Georgia, serif',
          fontSize: '1rem',
          fontWeight: 900,
          color: '#2f3d39',
          mb: 1.2,
          lineHeight: 1.2,
        }}
      >
        {card.title}
      </Typography>

      <Typography
        sx={{
          fontSize: '0.9rem',
          color: '#65736f',
          lineHeight: 1.45,
        }}
      >
        {card.text}
      </Typography>
    </Paper>
  );
}

function FaqRow({
  item,
  open,
  onToggle,
  isLast,
}: {
  item: FaqItem;
  open: boolean;
  onToggle: () => void;
  isLast: boolean;
}) {
  return (
    <Box
      sx={{
        borderBottom: isLast ? 'none' : '1px solid #d8ccb7',
        transition: 'background-color 180ms ease',
        '&:hover': {
          bgcolor: 'rgba(220, 232, 210, 0.28)',
        },
      }}
    >
      <Box
        component="button"
        onClick={onToggle}
        sx={{
          width: '100%',
          border: 0,
          bgcolor: 'transparent',
          cursor: 'pointer',
          px: { xs: 2.2, sm: 3 },
          py: 2.2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          textAlign: 'left',
          color: '#2f3d39',
        }}
      >
        <Typography
          sx={{
            fontFamily: 'Georgia, serif',
            fontSize: { xs: '1rem', sm: '1.08rem' },
            fontWeight: 900,
            color: '#2f3d39',
            pr: 2,
          }}
        >
          {item.question}
        </Typography>

        <Box
          sx={{
            color: '#6f817b',
            display: 'flex',
            alignItems: 'center',
            transition: 'transform 180ms ease',
            transform: open ? 'rotate(0deg)' : 'rotate(0deg)',
          }}
        >
          {open ? (
            <CloseRoundedIcon sx={{ fontSize: 18 }} />
          ) : (
            <AddRoundedIcon sx={{ fontSize: 18 }} />
          )}
        </Box>
      </Box>

      {open && (
        <Box
          sx={{
            px: { xs: 2.2, sm: 3 },
            pb: 2.6,
            maxWidth: 650,
          }}
        >
          <Typography
            sx={{
              fontSize: '0.95rem',
              lineHeight: 1.65,
              color: '#65736f',
            }}
          >
            {item.answer}
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export default function HelpPage() {
  const [openIndex, setOpenIndex] = React.useState<number | null>(0);

  function toggleFaq(index: number) {
    setOpenIndex((current) => (current === index ? null : index));
  }

  return (
    <>
      <AppNavbar />

      <Box
        sx={{
          minHeight: '100vh',
          bgcolor: '#eee9df',
          py: { xs: 4, md: 6 },
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            width: 520,
            height: 520,
            borderRadius: '50%',
            bgcolor: 'rgba(188, 211, 174, 0.22)',
            filter: 'blur(110px)',
            top: -190,
            left: -160,
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            width: 520,
            height: 520,
            borderRadius: '50%',
            bgcolor: 'rgba(214, 166, 135, 0.16)',
            filter: 'blur(115px)',
            right: -210,
            bottom: -210,
          },
        }}
      >
        <Container
          maxWidth="lg"
          sx={{
            position: 'relative',
            zIndex: 1,
          }}
        >
          <Box
            sx={{
              maxWidth: 620,
              mb: 4,
            }}
          >
            <Typography
              sx={{
                fontFamily: '"Courier New", monospace',
                fontSize: '0.78rem',
                fontWeight: 900,
                letterSpacing: '0.35em',
                color: '#7f8c88',
                mb: 1.2,
              }}
            >
              BEHIND THE SCENES
            </Typography>

            <Typography
              component="h1"
              sx={{
                fontFamily: 'Georgia, serif',
                fontSize: {
                  xs: '2.4rem',
                  sm: '3.4rem',
                  md: '4rem',
                },
                fontWeight: 900,
                lineHeight: 1.05,
                color: '#2f3d39',
                mb: 2,
              }}
            >
              A few{' '}
              <Box
                component="span"
                sx={{
                  fontStyle: 'italic',
                }}
              >
                notes
              </Box>{' '}
              on how this works.
            </Typography>

            <Typography
              sx={{
                fontSize: {
                  xs: '0.98rem',
                  sm: '1.05rem',
                },
                lineHeight: 1.55,
                color: '#65736f',
                maxWidth: 560,
              }}
            >
              What the numbers mean, what we do and don’t collect, and how to
              get the most out of the suggestions.
            </Typography>
          </Box>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(3, 1fr)',
                lg: 'repeat(5, 1fr)',
              },
              gap: 2,
              mb: 6,
            }}
          >
            {noteCards.slice(0, 5).map((card) => (
              <HelpCard key={card.title} card={card} />
            ))}

            <Box
              sx={{
                gridColumn: {
                  xs: 'auto',
                  sm: 'span 1',
                  md: 'span 1',
                  lg: 'span 1',
                },
              }}
            >
              <HelpCard card={noteCards[5]} />
            </Box>
          </Box>

          <Typography
            sx={{
              fontFamily: 'Georgia, serif',
              fontSize: '1.45rem',
              fontWeight: 900,
              color: '#2f3d39',
              mb: 2,
            }}
          >
            FAQ
          </Typography>

          <Paper
            elevation={0}
            sx={{
              borderRadius: '16px',
              border: '1px solid #8ea285',
              bgcolor: 'rgba(255, 250, 242, 0.54)',
              overflow: 'hidden',
              boxShadow: '0 14px 28px rgba(73, 62, 42, 0.08)',
              transition:
                'transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease',
              '&:hover': {
                transform: 'translateY(-3px)',
                borderColor: '#7e9877',
                boxShadow: '0 20px 36px rgba(73, 62, 42, 0.13)',
              },
            }}
          >
            {faqItems.map((item, index) => (
              <FaqRow
                key={item.question}
                item={item}
                open={openIndex === index}
                onToggle={() => toggleFaq(index)}
                isLast={index === faqItems.length - 1}
              />
            ))}
          </Paper>

          <Paper
            elevation={0}
            sx={{
              mt: 5,
              p: { xs: 2.4, sm: 3 },
              borderRadius: '16px',
              border: '1px solid #e1d6bf',
              bgcolor: 'rgba(226, 219, 204, 0.55)',
              textAlign: 'center',
              boxShadow: '0 10px 24px rgba(73, 62, 42, 0.08)',
              transition:
                'transform 180ms ease, box-shadow 180ms ease, background-color 180ms ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                bgcolor: 'rgba(226, 219, 204, 0.72)',
                boxShadow: '0 18px 32px rgba(73, 62, 42, 0.13)',
              },
            }}
          >
            <Typography
              sx={{
                fontFamily: 'Georgia, serif',
                fontSize: '1rem',
                fontWeight: 700,
                fontStyle: 'italic',
                color: '#526d4f',
                lineHeight: 1.5,
              }}
            >
              A student project from Monash · TP28 — built with care for the
              people who like a quieter Melbourne.
            </Typography>
          </Paper>
        </Container>
      </Box>
    </>
  );
}