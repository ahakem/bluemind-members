import React from 'react';
import { Container, Paper, Typography, Box, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { ArrowBack } from '@mui/icons-material';
import DynamicDocument from '../../components/DynamicDocument';
import PageLayout from '../../components/PageLayout';

const HouseRulesContent: React.FC = () => {
  const navigate = useNavigate();

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
        
        <Paper elevation={2} sx={{ p: 4 }}>
          <Typography variant="h3" gutterBottom color="primary" align="center">
            Blue Mind Freediving
          </Typography>
          <Typography variant="h4" gutterBottom align="center" sx={{ mb: 2 }}>
            Membership, House Rules & Governance
          </Typography>

          {/* Section 1: House Rules - Safety Protocols */}
          <Typography variant="h5" gutterBottom sx={{ mt: 4, color: 'primary.main' }}>
            1. House Rules
          </Typography>
          
          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            Safety Protocols
          </Typography>
          <Typography paragraph>
            Freediving is a physically demanding sport that involves diving without the use of breathing apparatus. 
            While most dives are safe, there is always the potential for an emergency situation. These safety protocols 
            aim to minimize risks and ensure the safety of all members.
          </Typography>

          <Typography paragraph component="div">
            • All members must obtain a basic freediving certification (PADI Level 1, SSI Level 1, AIDA 2, or equivalent) 
            before joining. This ensures adequate knowledge of freediving theory, practice, and safety protocols.
            <br />
            • For minors (&lt;18) we recommend e.g. Molchanov Lap 3 course. Minors always need to be supervised during 
            a training by an adult certified freediver who is dedicated to buddying and not diving him/her/themself.
            <br />
            • All members must sign the liability form before training with us, acknowledging that they are familiar 
            with the House Rules, including safety protocols.
            <br />
            • <strong>No one dives alone.</strong> Each member must have a buddy in the same lane, either diving or buddying. 
            Surface safety is only permitted from the edge lanes (first and last lanes).
            <br />
            • Buddy pairs are jointly responsible for each other's safety for the full duration of the session.
            <br />
            • During all in-water and dry static freediving activities, at least one designated Safety Officer must be present. 
            Two is preferred. The Safety Officer must be trained in CPR, First Aid, AED usage, and basic freedive rescue techniques. 
            Taking on the role of Safety Officer is volunteer work.
            <br />
            • Members must comply with all instructions given by the Safety Officer.
            <br />
            • All members are expected to dive within their personal limits.
          </Typography>

          <Typography variant="subtitle1" gutterBottom sx={{ mt: 2, fontWeight: 'bold' }}>
            For Personal Best (PB) attempts, the diver must:
          </Typography>
          <Typography paragraph component="div">
            • Have a dedicated safety buddy
            <br />
            • Inform the Safety Officer in advance
            <br />
            • Clearly state the name of the designated safety buddy
          </Typography>

          <Typography paragraph>
            • For dives longer than 75 meters, a dedicated safety buddy is required.
            <br />
            • Members are encouraged to train rescue scenarios regularly (e.g. once per month).
            <br />
            • <strong>Participating in BMF activities under the influence of alcohol or drugs is strictly prohibited</strong> for safety reasons.
          </Typography>

          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            Emergency Response Plan (ERP)
          </Typography>
          <Typography paragraph>
            In case of a freediving-related incident, the following steps must be followed by the diver's buddy, 
            in alignment with their freediving certification:
          </Typography>
          <Typography paragraph component="div">
            1. Bring the diver to the surface, perform blow-tap-talk. If the diver is unresponsive or blacked out, 
            rescue breaths must be given.
            <br />
            2. Immediately inform the Safety Officer, who will assist with first aid.
            <br />
            3. Remove the diver from the water as quickly and safely as possible.
            <br />
            4. If needed, call emergency services (112) and continue care until they arrive.
            <br />
            5. If the situation requires and oxygen is available, and trained personnel are present, oxygen should be administered.
          </Typography>
          <Typography paragraph>
            All incidents (including LMC, Samba, blackout, or other medical issues) must be reported to the Safety Officer for:
            <br />
            • Ensuring appropriate emergency response
            <br />
            • Logging and evaluating the incident to maintain safety standards
          </Typography>

          {/* Section 2: Association Structure */}
          <Typography variant="h5" gutterBottom sx={{ mt: 4, color: 'primary.main' }}>
            2. Association Structure
          </Typography>
          
          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            Board Composition
          </Typography>
          <Typography paragraph>
            • The board must consist of 2 to 6 members.
            <br />
            • Board members are responsible for fulfilling all duties outlined in the BMF Roles and Responsibilities document.
            <br />
            • Members elect board members via majority vote per candidate.
            <br />
            • A board member can be removed by losing the majority of board or member support, or failing to comply 
            with the BMF Statuten or House Rules.
          </Typography>

          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            Decision-Making Process
          </Typography>
          <Typography paragraph>
            • Decisions are made by the board, based on agreement or majority vote.
            <br />
            • BMF founders have veto rights.
            <br />
            • All financial decisions must be taken collectively by the board.
            <br />
            • The House Rules may be amended by the board, following the BMF decision-making process. 
            Members will be informed of any changes.
          </Typography>

          {/* Section 3: Annual Membership Meeting */}
          <Typography variant="h5" gutterBottom sx={{ mt: 4, color: 'primary.main' }}>
            3. Annual Membership Meeting
          </Typography>
          <Typography paragraph>
            At least once a year, a general membership meeting will be held. The agenda must include:
            <br />
            • Overview of past BMF activities
            <br />
            • Financial status of the association
            <br />
            • Strategic direction going forward
            <br />
            • Opportunity for members to propose agenda items
            <br />
            • Board composition review
          </Typography>

          {/* Section 4: Membership */}
          <Typography variant="h5" gutterBottom sx={{ mt: 4, color: 'primary.main' }}>
            4. Membership
          </Typography>
          
          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            Becoming a Member
          </Typography>
          <Typography paragraph>
            To join BMF, an individual must:
            <br />
            • Email the board a completed membership registration form and signed liability waiver
            <br />
            • The board will then decide on the applicant's admission
            <br />
            • The board is responsible for maintaining an up-to-date membership list
            <br />
            • The membership year starts 1 May each year
          </Typography>

          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            Membership Termination
          </Typography>
          <Typography paragraph>
            Membership will end:
            <br />
            • Upon the member's request (members must notify the board per email ultimately 1 April if they want 
            to terminate their membership for that year (starting 1 May of that year) otherwise, the membership will 
            be automatically renewed for the following year)
            <br />
            • In the event of the member's death
            <br />
            • If BMF is dissolved
            <br />
            • By board decision (must be accompanied by a statement of reasons)
          </Typography>

          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            Member Rights
          </Typography>
          <Typography paragraph>
            Members have the right to:
            <br />
            • Participate in BMF-organized activities in accordance with the House Rules
            <br />
            • Attend and participate in the annual membership meeting
          </Typography>

          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            Member Obligations
          </Typography>
          <Typography paragraph>
            Members are expected to:
            <br />
            • Comply with the BMF Statuten and House Rules, including safety protocols
            <br />
            • Pay the yearly membership contribution
            <br />
            • Cover the costs of activities they sign up for up front
            <br />
            • Contribute to a safe, respectful, inclusive, and joyful association environment
          </Typography>

          <Box sx={{ mt: 2, p: 2, bgcolor: 'warning.light', borderRadius: 1 }}>
            <Typography variant="body2">
              <strong>Important:</strong> We strongly advise all members to obtain liability insurance to protect 
              themselves from costs of claims and lawsuits if they are found legally responsible for causing bodily 
              injury or property damage to others. It acts as a safety net against unforeseen accidents and negligence. 
              Ensure it covers sports accidents and acting as a volunteer (e.g. Safety Officer role in BMF) for an 
              informal association.
            </Typography>
          </Box>

          {/* Section 5: Contributions and Activity Costs */}
          <Typography variant="h5" gutterBottom sx={{ mt: 4, color: 'primary.main' }}>
            5. Contributions and Activity Costs
          </Typography>
          <Typography paragraph>
            • The board decides on the yearly membership contribution and any other costs related to BMF activities.
            <br />
            • The annual membership fee is €15, as set by the board. Contributions help cover costs, organizational 
            work, and risk management.
          </Typography>

          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            Activity Costs
          </Typography>
          <Typography paragraph>
            By signing up for BMF activities, members agree to pay any related costs, including but not limited to:
            <br />
            • Rental of pool lanes for freediving training
            <br />
            • Costs associated with social activities held outside the water
            <br />
            • All costs are paid by members up front
          </Typography>

          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            Pool Rental Costs
          </Typography>
          <Typography paragraph>
            Costs are calculated as follows: costs per lane as charged by pool, divided by number of divers + 10%
            <br />
            <em>Example: €18 per lane per hour ÷ 3 divers = €6.00; €6.00 × 1.10 = €6.60 per diver.</em>
            <br />
            <br />
            • Founders and active board members are not required to pay the 10%.
            <br />
            • Founders are not required to pay the yearly membership fee.
            <br />
            • If BMF rents a full pool, the founders can dive there for free.
          </Typography>

          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            Lane Reservation Policy
          </Typography>
          <Typography paragraph>
            • Certain lanes are reserved on a long-term basis to secure regular training opportunities for BMF members.
            <br />
            • If a member wishes to join for a single training session and there is sufficient space available in the 
            reserved lanes, the contribution will be paid directly to BMF. These contributions support ongoing operational 
            expenses of the association.
            <br />
            • If no space is available in the reserved lanes, BMF may rent additional pool space (if possible). In this 
            case, the contributions collected from the participating members will be used to cover the rental costs of 
            the extra lanes.
          </Typography>

          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              Last updated: December 2025
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

const HouseRules: React.FC = () => {
  return (
    <PageLayout>
      <DynamicDocument pageId="house-rules" fallbackContent={<HouseRulesContent />} />
    </PageLayout>
  );
};

export default HouseRules;
