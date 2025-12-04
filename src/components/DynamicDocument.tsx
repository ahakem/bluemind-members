import React, { useState, useEffect } from 'react';
import { Container, Paper, Box, Button, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { ArrowBack } from '@mui/icons-material';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import DOMPurify from 'dompurify';

interface DynamicDocumentProps {
  pageId: string;
  fallbackContent: JSX.Element;
}

const DynamicDocument: React.FC<DynamicDocumentProps> = ({ pageId, fallbackContent }) => {
  const navigate = useNavigate();
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContent();
  }, [pageId]);

  const loadContent = async () => {
    try {
      const docRef = doc(db, 'content', pageId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        setContent(docSnap.data().content);
      }
    } catch (err) {
      console.error('Error loading content:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50', py: 4 }}>
        <Container maxWidth="md">
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
            <CircularProgress />
          </Box>
        </Container>
      </Box>
    );
  }

  if (content) {
    // Sanitize HTML content from CMS
    const sanitizedContent = DOMPurify.sanitize(content);
    
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50', py: 4 }}>
        <Container maxWidth="md">
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate(-1)}
            sx={{ mb: 2 }}
          >
            Back
          </Button>
          
          <Paper 
            elevation={2} 
            sx={{ 
              p: 4,
              '& h1': { color: 'primary.main', textAlign: 'center', mb: 2 },
              '& h2': { textAlign: 'center', mb: 4 },
              '& h3': { color: 'primary.main', mt: 3, mb: 2 },
              '& h4': { mt: 2, mb: 1, fontWeight: 'bold' },
              '& p': { mb: 2 },
              '& ul, & ol': { mb: 2, pl: 4 },
              '& li': { mb: 1 },
              '& strong': { fontWeight: 'bold' },
              '& em': { fontStyle: 'italic' },
              '& div': { mb: 2 }, // For styled warning/info boxes
            }}
            dangerouslySetInnerHTML={{ __html: sanitizedContent }}
          />
        </Container>
      </Box>
    );
  }

  // Fallback to original component
  return fallbackContent;
};

export default DynamicDocument;
