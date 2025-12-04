import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Paper,
} from '@mui/material';
import { EmojiEvents } from '@mui/icons-material';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Member } from '../../types';

const PersonalBests: React.FC = () => {
  const { currentUser } = useAuth();
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMemberData();
  }, []);

  const fetchMemberData = async () => {
    if (!currentUser) return;

    try {
      const memberDoc = await getDoc(doc(db, 'members', currentUser.uid));
      if (memberDoc.exists()) {
        setMember(memberDoc.data() as Member);
      }
    } catch (error) {
      console.error('Error fetching member data:', error);
    } finally {
      setLoading(false);
    }
  };

  const pbData = [
    {
      discipline: 'Static Apnea (STA)',
      value: member?.personalBests?.STA,
      unit: 'time',
      description: 'Holding breath while stationary',
      icon: '🫁',
    },
    {
      discipline: 'Dynamic with Fins (DYN)',
      value: member?.personalBests?.DYN,
      unit: 'meters',
      description: 'Swimming underwater with monofin',
      icon: '🏊',
    },
    {
      discipline: 'Dynamic Bifins (DYNBIFI)',
      value: member?.personalBests?.DYNBIFI,
      unit: 'meters',
      description: 'Swimming underwater with bifins',
      icon: '🦶',
    },
    {
      discipline: 'Dynamic No Fins (DNF)',
      value: member?.personalBests?.DNF,
      unit: 'meters',
      description: 'Swimming underwater without fins',
      icon: '🏊‍♂️',
    },
    {
      discipline: 'Constant Weight (CWT)',
      value: member?.personalBests?.CWT,
      unit: 'meters',
      description: 'Depth diving with monofin',
      icon: '🤿',
    },
    {
      discipline: 'Constant Weight Bifins (CWTB)',
      value: member?.personalBests?.CWTB,
      unit: 'meters',
      description: 'Depth diving with bifins',
      icon: '🦿',
    },
    {
      discipline: 'Constant No Fins (CNF)',
      value: member?.personalBests?.CNF,
      unit: 'meters',
      description: 'Depth diving without fins',
      icon: '🧘',
    },
  ];

  const formatValue = (value: number | string | undefined, unit: string) => {
    if (!value) return 'Not set';
    if (unit === 'time') {
      // STA is already in mm:ss string format
      return value.toString();
    }
    return `${value} ${unit}`;
  };

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={3}>
        <EmojiEvents sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
        <Typography variant="h4">Personal Bests</Typography>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Track your freediving achievements. Update your PBs in your profile settings.
      </Typography>

      <Grid container spacing={3}>
        {pbData.map((pb, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <Typography variant="h3" mr={2}>
                    {pb.icon}
                  </Typography>
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      {pb.discipline}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {pb.description}
                    </Typography>
                  </Box>
                </Box>
                <Paper
                  sx={{
                    p: 2,
                    textAlign: 'center',
                    bgcolor: pb.value ? 'primary.main' : 'background.default',
                    color: pb.value ? 'white' : 'text.secondary',
                  }}
                >
                  <Typography variant="h4" fontWeight="bold">
                    {formatValue(pb.value, pb.unit)}
                  </Typography>
                </Paper>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {!member?.personalBests || Object.keys(member.personalBests).length === 0 && (
        <Box mt={4} textAlign="center">
          <Typography variant="body1" color="text.secondary">
            No personal bests recorded yet. Keep training! 💪
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default PersonalBests;
