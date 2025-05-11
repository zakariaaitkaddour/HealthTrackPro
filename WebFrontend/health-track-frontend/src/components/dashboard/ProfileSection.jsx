import { useState, useEffect } from "react";
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Button, 
  TextField, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  Avatar,
  Divider,
  Chip,
  CircularProgress,
  Alert,
  Grid,
  Paper
} from "@mui/material";
import { format, parseISO } from "date-fns";
import { useAuth } from "../../context/AuthContext";
import EditIcon from '@mui/icons-material/Edit';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

export default function ProfileSection({ currentUser: initialProfile }) {
  const [profile, setProfile] = useState(initialProfile);
  const { currentUser } = useAuth();
  const [openDialog, setOpenDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  const [editProfile, setEditProfile] = useState({
    name: "",
    phoneNumber: "",
  });

  useEffect(() => {
    if (currentUser) {
      setEditProfile({
        name: currentUser.name || "",
        phoneNumber: currentUser.phoneNumber || "",
      });
    }
  }, [currentUser]);

  const handleUpdateProfile = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      const response = await fetch("http://localhost:8080/api/users/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(editProfile),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update profile");
      }
      
      const updatedProfile = await response.json();
      setProfile(updatedProfile);
      setSuccess(true);
      setTimeout(() => {
        setOpenDialog(false);
        setSuccess(false);
      }, 1000);
    } catch (error) {
      console.error("Error updating profile:", error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="h5" gutterBottom color="textSecondary">
          Profile Information
        </Typography>
        <Alert severity="error" sx={{ maxWidth: 800, mx: 'auto' }}>
          User data not available. Please log in.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      width: '95%',
      maxWidth: 1200,
      mx: 'auto',
      px: 3,
      py: 4
    }}>
      <Paper elevation={2} sx={{ 
        p: 4,
        borderRadius: 4,
        backgroundColor: 'background.paper'
      }}>
        <Typography variant="h3" sx={{ 
          fontWeight: 600,
          width: "90%",
          color: 'primary.main',
          mb: 4,
          fontSize: { xs: '1.8rem', md: '2.2rem' }
        }}>
          My Profile
        </Typography>
        
        <Grid container spacing={4}>
          {/* Left Column - Profile Info */}
          <Grid item xs={12} md={8}>
            <Card sx={{ 
              width: '150%',
              borderRadius: 3,
              boxShadow: 'none',
              border: '1px solid',
              borderColor: 'divider'
            }}>
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ 
                  display: 'flex',
                  alignItems: 'center',
                  mb: 4
                }}>
                  <Avatar sx={{ 
                    width: 100, 
                    height: 100,
                    bgcolor: 'primary.main',
                    fontSize: '2.5rem',
                    mr: 4
                  }}>
                    {currentUser.name?.charAt(0) || 'U'}
                  </Avatar>
                  
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 600 }}>
                      {currentUser.name}
                    </Typography>
                    <Chip 
                      label={currentUser.role} 
                      size="medium" 
                      color="primary" 
                      variant="outlined"
                      sx={{ 
                        mt: 1,
                        fontSize: '0.9rem',
                        px: 2,
                        py: 1
                      }}
                    />
                  </Box>
                </Box>
                
                <Divider sx={{ my: 3 }} />
                
                <Grid container spacing={6}>
                  <Grid item xs={12} sm={6}>
                    <ProfileField 
                      label="Email" 
                      value={currentUser.email}
                    />
                    <ProfileField 
                      label="Phone Number" 
                      value={currentUser.phoneNumber || "Not provided"}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <ProfileField 
                      label="Birthday" 
                      value={currentUser.birthday 
                        ? format(parseISO(currentUser.birthday), 'MMMM d, yyyy') 
                        : "Not set"}
                    />
                    {currentUser.specialization && (
                      <ProfileField 
                        label="Specialization" 
                        value={currentUser.specialization}
                      />
                    )}
                  </Grid>
                </Grid>
                
                <Box sx={{ 
                  mt: 5, 
                  textAlign: 'right',
                  pr: 2
                }}>
                  <Button
                    variant="contained"
                    startIcon={<EditIcon />}
                    size="large"
                    sx={{ 
                      bgcolor: 'primary.main',
                      '&:hover': { bgcolor: 'primary.dark' },
                      px: 5,
                      py: 1.5,
                      fontSize: '1rem'
                    }}
                    onClick={() => setOpenDialog(true)}
                  >
                    Edit Profile
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
         
        </Grid>
      </Paper>

      {/* Edit Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={() => !isLoading && setOpenDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ 
          fontWeight: 600,
          bgcolor: 'primary.main',
          color: 'white',
          fontSize: '1.5rem'
        }}>
          Edit Profile Information
        </DialogTitle>
        
        <DialogContent sx={{ pt: 4, pb: 3 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          
          {success ? (
            <Box sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              py: 6
            }}>
              <CheckCircleIcon sx={{ 
                fontSize: 80,
                color: 'success.main',
                mb: 3
              }} />
              <Typography variant="h5" color="success.main" sx={{ fontWeight: 600 }}>
                Profile updated successfully!
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Full Name"
                  margin="normal"
                  variant="outlined"
                  size="medium"
                  value={editProfile.name}
                  onChange={(e) => setEditProfile({ ...editProfile, name: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  margin="normal"
                  variant="outlined"
                  size="medium"
                  value={editProfile.phoneNumber}
                  onChange={(e) => setEditProfile({ ...editProfile, phoneNumber: e.target.value })}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        
        <DialogActions sx={{ px: 4, pb: 3 }}>
          <Button 
            onClick={() => setOpenDialog(false)}
            disabled={isLoading}
            color="inherit"
            size="large"
            sx={{ mr: 2 }}
          >
            Cancel
          </Button>
          
          {!success && (
            <Button 
              onClick={handleUpdateProfile} 
              variant="contained" 
              disabled={isLoading}
              startIcon={isLoading ? <CircularProgress size={24} /> : null}
              size="large"
              sx={{ 
                bgcolor: 'primary.main',
                px: 4
              }}
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// Reusable Profile Field Component
function ProfileField({ label, value }) {
  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle1" color="textSecondary" sx={{ mb: 0.5 }}>
        {label}
      </Typography>
      <Typography variant="h6" sx={{ fontWeight: 500 }}>
        {value}
      </Typography>
    </Box>
  );
}