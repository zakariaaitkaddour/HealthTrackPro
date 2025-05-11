import { Drawer, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import {
  CalendarToday as AppointmentsIcon,
  People as PatientsIcon,
  Medication as MedicationsIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';

export default function DoctorDrawer({ open, onClose }) {
  return (
    <Drawer
      variant="permanent"
      sx={{
        width: 240,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: 240,
          boxSizing: 'border-box',
        },
      }}
    >
      <Toolbar />
      <List>
        <ListItem button>
          <ListItemIcon><AppointmentsIcon /></ListItemIcon>
          <ListItemText primary="Appointments" />
        </ListItem>
        <ListItem button>
          <ListItemIcon><PatientsIcon /></ListItemIcon>
          <ListItemText primary="Patients" />
        </ListItem>
        <ListItem button>
          <ListItemIcon><MedicationsIcon /></ListItemIcon>
          <ListItemText primary="Medications" />
        </ListItem>
        <ListItem button>
          <ListItemIcon><SettingsIcon /></ListItemIcon>
          <ListItemText primary="Settings" />
        </ListItem>
      </List>
    </Drawer>
  );
}