"use client";

import React from 'react';
import IconButton from '@mui/material/IconButton';
import IosShareIcon from '@mui/icons-material/IosShare';
import { styled } from '@mui/material/styles';
import Button from '@mui/material/Button';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import Dialog from '@mui/material/Dialog';
import ListItemText from '@mui/material/ListItemText';
import ListItemButton from '@mui/material/ListItemButton';
import List from '@mui/material/List';
import Divider from '@mui/material/Divider';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';
import Slide from '@mui/material/Slide';
import { TransitionProps } from '@mui/material/transitions';
import { grey } from '@mui/material/colors';
import ForceGraph from '@/components/ForceGraph';

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<unknown>;
  },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

export default function Home() {
  const [csvInput, setCsvInput] = React.useState(null as File | null);
  const [loading, setLoading] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [response, setResponse] = React.useState(null as any);

  const handleClose = () => {
    setOpen(false);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setCsvInput(file);
    }
  }

  const showAIDetails = async() => {
    if (!csvInput) {
      alert("Please select a CSV file first.");
      return;
    }
    
    setLoading(true);
    const formData = new FormData();
    formData.append("file", csvInput);

    try {
      const res = await fetch("http://127.0.0.1:8000/analyze", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      setOpen(true);
      setResponse(data);
    } catch (err) {
      console.error("Upload failed", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen gap-16 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] row-start-2 justify-center items-center sm:items-start">
        <img src="/banker.png" alt="logo" className="w-24 h-24" />
        <h1 className="text-4xl font-bold text-center">
          Fraud Detection using ML and Graph Theory
        </h1>
        <h2 className="text-2xl text-center">
          Upload your CSV file below to get started with the analysis
        </h2>
        
        <div className="flex flex-row gap-4">
          <Button
            component="label"
            role={undefined}
            variant="contained"
            tabIndex={-1}
            startIcon={<CloudUploadIcon />}
            disabled={loading}
            sx={{
              backgroundColor: 'white',
              color: 'black',
              '&.Mui-disabled': {
                backgroundColor: 'black',
                color: 'white',
              },
            }}
          >
            Choose file
            <VisuallyHiddenInput
              type="file"
              onChange={handleFileChange}
              multiple
            />
          </Button>

          <IconButton
            aria-label="delete"
            size="large"
            className="bg-gray-200 hover:bg-gray-300 transition-colors duration-200"
            color="primary"
            onClick={showAIDetails}
            disabled={loading || csvInput === null}
            sx={{
              backgroundColor: 'white',
              color: 'black',
              '&.Mui-disabled': {
                backgroundColor: 'black',
                color: 'white',
              },
            }}
          >
            <IosShareIcon />
          </IconButton>
        </div>

        <div className="flex flex-col gap-4">
          {csvInput && (
            <div className="flex flex-col">
              <p className="text-lg">Selected file: {csvInput.name}</p>
              <p className="text-sm text-gray-500">Click again to upload a different file</p>
              {loading && (
                <p className="text-sm text-gray-500">Loading...</p>
              )}
            </div>
          )}
          {csvInput === null && (
            <p className="text-lg">No file selected</p>
          )}
        </div>

        <Dialog
          fullScreen
          open={open}
          onClose={handleClose}
          TransitionComponent={Transition}
          TransitionProps={{
            onExited: () => {
              setCsvInput(null);
            },
          }}
          PaperProps={{
            style: {
              backgroundColor: 'black',
              color: 'white',
            },
          }}
          sx={{
            '& .MuiDialog-container': {
              '& .MuiPaper-root': {
                backgroundColor: 'black',
                color: 'white',
              },
            },
          }}
        >
          <AppBar sx={{ position: 'relative' }}>
            <Toolbar>
              <IconButton
                edge="start"
                color="inherit"
                onClick={handleClose}
                aria-label="close"
              >
                <CloseIcon />
              </IconButton>
              <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">
                Fraud Detection Results
              </Typography>
            </Toolbar>
          </AppBar>
          {response && (
            <>
              <div className="flex flex-col gap-4 px-4 py-2">
                <h2 className="text-lg">
                  Summary of Analysis
                </h2>
              </div>
              <Divider sx={{ borderColor: 'white' }} />
              <List>
                <ListItemButton>
                  <ListItemText
                    primary="Total Transactions"
                    secondary={response.summary.total_transactions}
                    sx={{
                      '& .MuiListItemText-secondary': {
                        color: grey[400],
                      },
                    }}
                  />
                </ListItemButton>
                <Divider sx={{ borderColor: grey[700] }} />
                <ListItemButton>
                  <ListItemText
                    primary="Fraudulent Transactions"
                    secondary={response.summary.fraudulent_transactions}
                    sx={{
                      '& .MuiListItemText-secondary': {
                        color: grey[400],
                      },
                    }}
                  />
                </ListItemButton>
                <Divider sx={{ borderColor: grey[700] }} />
                <ListItemButton>
                  <ListItemText
                    primary="Anomalies Detected"
                    secondary={response.summary.detected_anomalies}
                    sx={{
                      '& .MuiListItemText-secondary': {
                        color: grey[400],
                      },
                    }}
                  />
                </ListItemButton>
              </List>
              <div className="flex flex-col gap-4 px-4 py-2">
                <h2 className="text-lg">
                  Graph Analysis
                </h2>
              </div>
              <Divider sx={{ borderColor: 'white' }} />
              <ForceGraph nodes={response.graph.nodes} links={response.graph.edges} />
            </>
          )}
        </Dialog>
      </main>
    </div>
  );
}
