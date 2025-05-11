import { useState } from "react";
import { Box, Drawer, List, ListItem, ListItemIcon, ListItemText, IconButton, Toolbar, AppBar, Typography, Button } from "@mui/material";
import { Menu as MenuIcon, Home, Assignment, Event, Person, LocalPharmacy } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function DashboardLayout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();

  const drawerWidth = 260;

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const drawer = (
    <div>
      <Toolbar sx={{ borderBottom: 1, borderColor: "grey.200" }}>
          <Typography
              variant="h6"
              noWrap
              component="div"
              sx={{ fontWeight: "bold", color: "black", letterSpacing: 1.5, fontSize: "1.5rem" }}
            >
              HealthTrack Pro
            </Typography>
      </Toolbar>
      <List sx={{ padding: 1 }}>
        {[
          { text: "Overview", icon: <Home sx={{ color: "blue.500" }} />, path: "/dashboard" },
          { text: "Health Tracking", icon: <Assignment sx={{ color: "green.500" }} />, path: "/dashboard/health-tarcking"},
          { text: "Medications", icon: <LocalPharmacy sx={{ color: "red.500" }} />, path: "/dashboard/medications" },
          { text: "Appointments", icon: <Event sx={{ color: "purple.500" }} />, path: "/dashboard/appointments" },
          { text: "Profile", icon: <Person sx={{ color: "indigo.500" }} />, path: "/dashboard/profile" },
        ].map((item) => (
          <ListItem
            button
            key={item.text}
            onClick={() => navigate(item.path)}
            sx={{
              marginY: 0.5,
              borderRadius: 2,
              "&:hover": { backgroundColor: "blue.50" },
              transition: "all 0.2s",
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
            <ListItemText
              primary={item.text}
              primaryTypographyProps={{ sx: { fontWeight: "medium", color: "grey.700" } }}
            />
          </ListItem>
        ))}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          background: "linear-gradient(to right, #00a895, #007a6d)",
          boxShadow: 3,
        }}
      >
        <Toolbar sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <IconButton
              color="inherit"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { sm: "none" }, "&:hover": { backgroundColor: "#007a6d" } }}
            >
              <MenuIcon />
            </IconButton>
            
            <Typography variant="body1" sx={{ ml: 3, color: "white", fontWeight: "medium" }}>
              Welcome, {currentUser?.name}!
            </Typography>
          </Box>
          <Button
            onClick={() => {
              localStorage.removeItem("token");
              localStorage.removeItem("user");
              navigate("/");
            }}
            sx={{
              color: "white",
              backgroundColor: "red.900",
              "&:hover": { backgroundColor: "red" },
              borderRadius: "20px",
              px: 3,
              py: 1,
              textTransform: "none",
            }}
          >
            Logout
          </Button>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 }, boxShadow: 1 }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: "block", sm: "none" },
            "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", sm: "block" },
            "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: 1000 },
          ml: -8,
          mt: 0,
          backgroundColor: "grey.50",
          minHeight: "100vh",
        }}
      >
        <Box
          sx={{
            maxWidth: "1500px",
            mx: "auto",
            backgroundColor: "white",
            borderRadius: 3,
            boxShadow: 1,
            p: 4,
            textAlign: "left",
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}