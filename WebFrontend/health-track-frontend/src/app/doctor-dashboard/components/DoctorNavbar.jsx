import { AppBar, Toolbar, Typography, IconButton, Avatar } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';

export default function DoctorNavbar({ onDrawerToggle }) {
  return (
    <AppBar position="sticky" elevation={0}>
      <Toolbar>
        <IconButton
          color="inherit"
          edge="start"
          onClick={onDrawerToggle}
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Doctor Dashboard
        </Typography>
        <Avatar alt="Doctor" src="/doctor-avatar.jpg" />
      </Toolbar>
    </AppBar>
  );
}