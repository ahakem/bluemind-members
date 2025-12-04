import React, { useState, useEffect, useMemo } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  TextField,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import { Save, Code, Visibility } from '@mui/icons-material';
import ReactQuill, { Quill } from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db, auth } from '../../config/firebase';
import { ContentPage } from '../../types';

// Initial content templates
const initialContent = {
  'house-rules': `<h1>Blue Mind Freediving</h1>
<h2>House Rules & Governance</h2>

<h3>1. Safety Protocols</h3>
<p><strong>Buddy System:</strong> No one dives alone. Every freediver must have a designated buddy who remains at the surface to observe the dive.</p>
<p><strong>Safety Officer:</strong> Every training session must have an appointed Safety Officer responsible for emergency response coordination and ensuring compliance with safety protocols.</p>

<h4>For Personal Best (PB) attempts:</h4>
<ul>
<li>Have a dedicated safety buddy</li>
<li>Inform the Safety Officer in advance</li>
<li>Clearly state the name of the designated safety buddy</li>
</ul>

<h4>Emergency Response Plan (ERP)</h4>
<ol>
<li>Bring the diver to the surface, perform blow-tap-talk</li>
<li>Immediately inform the Safety Officer</li>
<li>Remove the diver from the water</li>
<li>If needed, call emergency services (112)</li>
<li>If available and trained, administer oxygen</li>
</ol>

<h3>2. Membership</h3>
<p><strong>Annual Fee:</strong> €15 per year</p>
<p><strong>Health Insurance:</strong> All members must have valid health insurance in the Netherlands.</p>

<div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ff9800;">
<strong>⚠️ Important:</strong> We strongly advise all members to obtain liability insurance to protect themselves from costs of claims and lawsuits.
</div>

<p><em>Last updated: December 2025</em></p>`,
  
  'liability-waiver': `<h1>Blue Mind Freediving</h1>
<h2>Liability Waiver & Release Form</h2>

<div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ff9800;">
<strong>⚠️ IMPORTANT: READ CAREFULLY BEFORE SIGNING</strong>
</div>

<h3>Introduction</h3>
<p>This Liability Waiver and Release Form is designed to inform all people diving with Blue Mind Freediving of the risks involved in freediving and to clarify the responsibilities of each individual when engaging in freediving activities.</p>

<h3>Assumption of Risk</h3>
<p>I, the undersigned, fully understand and acknowledge that freediving is an inherently dangerous activity that involves physical risks including:</p>
<ul>
<li>Shallow and deep water blackouts</li>
<li>Decompression sickness</li>
<li>Drowning</li>
<li>Hypoxia or hyperoxia</li>
<li>Injury caused by physical exertion or pressure changes</li>
<li>Equipment failure</li>
<li>Collisions with underwater obstacles</li>
</ul>

<h3>Obligation to Obtain Insurance</h3>
<p>Everyone freediving with Blue Mind Freediving is required to have (standard) health insurance that is valid in the Netherlands.</p>

<h3>Exemption from Liability</h3>
<p>The Association and its officers, directors, and instructors will not be held liable for any injuries, losses, or damages incurred during freediving activities.</p>

<h3>Waiver of Liability and Release</h3>
<p>In consideration of being allowed to participate in freediving activities with Blue Mind Freediving, you, for yourself, your heirs, executors, and assigns, hereby release, waive, and discharge Blue Mind Freediving, its officers, instructors, agents, employees, volunteers, and affiliates from any and all liability for any injury, loss, damage, or death arising out of or in connection with my participation in any freediving activities organized by the association.</p>

<div style="background-color: #ffebee; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #f44336;">
<strong>⚠️ Legal Notice:</strong> This is a legal document that affects your rights. By registering and providing your signature, you acknowledge that you have read, understood, and agree to the terms of this waiver.
</div>

<p><em>Last updated: December 2025</em></p>`,
  
  'privacy-policy': `<h1>Blue Mind Freediving</h1>
<h2>Privacy Policy</h2>

<p>Blue Mind Freediving is an informal freediving club in the Netherlands. This Privacy Policy explains how we collect, use, store, and protect your personal data in compliance with the GDPR.</p>

<h3>1. Who We Are</h3>
<p>Blue Mind Freediving is a club that organizes freediving training sessions and events.</p>
<p><strong>Contact:</strong> bluemindfreediving@gmail.com</p>

<h3>2. What Personal Data We Collect</h3>
<ul>
<li>Full name and contact information</li>
<li>Emergency contact details</li>
<li>Health insurance information</li>
<li>Freediving certifications</li>
<li>Personal best records</li>
<li>Photos/videos (with your consent)</li>
</ul>

<h3>3. Why We Collect Your Data</h3>
<ul>
<li><strong>Membership Administration:</strong> To manage your membership and communicate about club activities</li>
<li><strong>Safety and Emergency:</strong> To verify insurance and contact emergency contacts if needed</li>
<li><strong>Communication:</strong> To send updates, training schedules, and announcements</li>
<li><strong>Media (with consent):</strong> To share photos or videos on our website and social media</li>
</ul>

<h3>4. Your Rights Under GDPR</h3>
<p>You have the right to:</p>
<ul>
<li><strong>Access:</strong> Request copies of your personal data</li>
<li><strong>Rectification:</strong> Correct inaccurate or incomplete data</li>
<li><strong>Erasure:</strong> Request deletion of your data ("right to be forgotten")</li>
<li><strong>Withdraw Consent:</strong> Withdraw consent at any time</li>
<li><strong>Lodge a Complaint:</strong> File a complaint with the Dutch Data Protection Authority</li>
</ul>

<h3>5. Data Retention</h3>
<p>We retain your personal data for as long as you are an active member. After your membership ends, most personal data is deleted within <strong>3 months</strong>.</p>

<div style="background-color: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #2196f3;">
<strong>ℹ️ Your Privacy Matters:</strong> We are committed to protecting your personal information and complying with GDPR and Dutch data protection laws. Contact us at bluemindfreediving@gmail.com with any concerns.
</div>

<p><em>Last updated: December 2025</em></p>`,
};

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`content-tabpanel-${index}`}
      aria-labelledby={`content-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const ContentManagement: React.FC = () => {
  const [currentTab, setCurrentTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  
  const [houseRulesContent, setHouseRulesContent] = useState('');
  const [liabilityWaiverContent, setLiabilityWaiverContent] = useState('');
  const [privacyPolicyContent, setPrivacyPolicyContent] = useState('');

  const pages = [
    { id: 'house-rules', title: 'House Rules', content: houseRulesContent, setContent: setHouseRulesContent },
    { id: 'liability-waiver', title: 'Liability Waiver', content: liabilityWaiverContent, setContent: setLiabilityWaiverContent },
    { id: 'privacy-policy', title: 'Privacy Policy', content: privacyPolicyContent, setContent: setPrivacyPolicyContent },
  ];

  // Rich text editor configuration with full formatting
  const modules = useMemo(() => ({
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      [{ 'font': [] }],
      [{ 'size': ['small', false, 'large', 'huge'] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'script': 'sub'}, { 'script': 'super' }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      [{ 'align': [] }],
      ['link', 'image'],
      ['blockquote', 'code-block'],
      ['clean']
    ],
    clipboard: {
      matchVisual: false, // Preserve pasted formatting
    }
  }), []);

  const formats = [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'script',
    'list', 'bullet', 'indent',
    'align',
    'link', 'image',
    'blockquote', 'code-block'
  ];

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Load all three documents
      const houseRulesDoc = await getDoc(doc(db, 'content', 'house-rules'));
      const liabilityWaiverDoc = await getDoc(doc(db, 'content', 'liability-waiver'));
      const privacyPolicyDoc = await getDoc(doc(db, 'content', 'privacy-policy'));
      
      // Set content from Firestore or use initial content as placeholder
      setHouseRulesContent(
        houseRulesDoc.exists() 
          ? houseRulesDoc.data().content 
          : initialContent['house-rules']
      );
      
      setLiabilityWaiverContent(
        liabilityWaiverDoc.exists() 
          ? liabilityWaiverDoc.data().content 
          : initialContent['liability-waiver']
      );
      
      setPrivacyPolicyContent(
        privacyPolicyDoc.exists() 
          ? privacyPolicyDoc.data().content 
          : initialContent['privacy-policy']
      );
      
    } catch (err: any) {
      console.error('Error loading content:', err);
      setError('Failed to load content: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!auth.currentUser) {
      setError('You must be logged in to save content');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const currentPage = pages[currentTab];
      const contentData: Partial<ContentPage> = {
        id: currentPage.id,
        title: currentPage.title,
        content: currentPage.content,
        lastUpdatedBy: auth.currentUser.uid,
        lastUpdatedAt: Timestamp.now() as any,
      };

      // Check if document exists to set createdAt
      const docRef = doc(db, 'content', currentPage.id);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        contentData.createdAt = Timestamp.now() as any;
      }

      await setDoc(docRef, contentData, { merge: true });
      
      setSuccess(`${currentPage.title} saved successfully!`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error('Error saving content:', err);
      setError('Failed to save content: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4">Content Management</Typography>
          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </Box>

        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <Alert severity="info" sx={{ mb: 3 }}>
          <strong>Rich Text Editor:</strong> Full formatting control including colors, fonts, and styles.
          <br />
          💡 <strong>Tip:</strong> Paste formatted content directly from Word or HTML - it will preserve your styles!
          <br />
          🎨 Use the color buttons in the toolbar to change text and background colors.
        </Alert>

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={currentTab} onChange={(_, newValue) => setCurrentTab(newValue)}>
            <Tab label="House Rules" />
            <Tab label="Liability Waiver" />
            <Tab label="Privacy Policy" />
          </Tabs>
        </Box>

        <TabPanel value={currentTab} index={0}>
          <Box sx={{ 
            '& .ql-container': { 
              minHeight: '500px',
              fontSize: '16px',
            },
            '& .ql-editor': {
              minHeight: '500px',
            }
          }}>
            <ReactQuill
              theme="snow"
              value={houseRulesContent}
              onChange={setHouseRulesContent}
              modules={modules}
              formats={formats}
              placeholder="Paste or type content for House Rules..."
            />
          </Box>
        </TabPanel>

        <TabPanel value={currentTab} index={1}>
          <Box sx={{ 
            '& .ql-container': { 
              minHeight: '500px',
              fontSize: '16px',
            },
            '& .ql-editor': {
              minHeight: '500px',
            }
          }}>
            <ReactQuill
              theme="snow"
              value={liabilityWaiverContent}
              onChange={setLiabilityWaiverContent}
              modules={modules}
              formats={formats}
              placeholder="Paste or type content for Liability Waiver..."
            />
          </Box>
        </TabPanel>

        <TabPanel value={currentTab} index={2}>
          <Box sx={{ 
            '& .ql-container': { 
              minHeight: '500px',
              fontSize: '16px',
            },
            '& .ql-editor': {
              minHeight: '500px',
            }
          }}>
            <ReactQuill
              theme="snow"
              value={privacyPolicyContent}
              onChange={setPrivacyPolicyContent}
              modules={modules}
              formats={formats}
              placeholder="Paste or type content for Privacy Policy..."
            />
          </Box>
        </TabPanel>
      </Paper>
    </Container>
  );
};

export default ContentManagement;
