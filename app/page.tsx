'use client';
import { SyntheticEvent } from 'react';
import { ChangeEvent, MouseEvent, useState } from 'react'
import { SpotifyHome } from '@/components/SpotifyHome';
import { Login } from '@/components/Login';
import { Box, Button, CardMedia, Container, Link, Modal, Typography } from '@mui/material';
import { useSession, signIn, signOut } from 'next-auth/react';
import { saveAs } from 'file-saver';

export default function Home() {
  const {status} = useSession();

  const [accountChecked, setAccountChecked] = useState<'own' | 'other'>('own');
  const [inputError, setInputError] = useState(false);
  const [otherSpotifyUserId, setOtherSpotifyUserId] = useState<string>('');
  const [modal, setModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleOptionChange = (ev: SyntheticEvent<Element, Event>) => {
    setAccountChecked((ev.target as HTMLInputElement).value as 'own' | 'other');
    setInputError(false);
  };

  const handleOtherSpotifyUserIdChange = (ev: ChangeEvent<HTMLInputElement>) => {
    setOtherSpotifyUserId(ev.target.value);
    setInputError(false);
  };

  const toggleModal = () => {
    setModal(!modal);
  };

  const handleLogout = (ev: MouseEvent<HTMLSpanElement, globalThis.MouseEvent> | MouseEvent<HTMLAnchorElement, globalThis.MouseEvent>) => {
    setOtherSpotifyUserId('');
    setErrorMessage('');
    setInputError(false);
    signOut();
  };

  const handleClickButton = async (ev: MouseEvent<HTMLButtonElement, globalThis.MouseEvent>) => {
    setIsLoading(true);
    let userSpotifyId = '';
    const baseUrl = `${window.location.href}`;
    if(accountChecked === 'other') {
      userSpotifyId = otherSpotifyUserId;
    }

    const params = new URLSearchParams({
      spotifyId: userSpotifyId,
    });
    const urlToDownloadXLSX = `${baseUrl}api/playlist?${params}`;
    try {
      const playlistResponse = await fetch(urlToDownloadXLSX, {
        method: 'GET', // *GET, POST, PUT, DELETE, etc.
        mode: 'cors', // no-cors, *cors, same-origin
        cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
        credentials: 'same-origin', // include, *same-origin, omit
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        },
        redirect: 'follow', // manual, *follow, error
        referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
      });
      if(playlistResponse.status !== 200) {
        const errorDetail = await playlistResponse.json();
        if('error' in errorDetail &&
         'errorDetails' in errorDetail &&
         'message' in errorDetail.errorDetails &&
         'item' in errorDetail.errorDetails &&
         typeof errorDetail.errorDetails.message === 'string'
        ) {
          setErrorMessage(errorDetail.errorDetails.message);
          setInputError(true);
        } else {
          setErrorMessage('There was a problem downloading the XLSX file');
        }
        setIsLoading(false);
        toggleModal();
        return;
      }
      const playlistName = playlistResponse.headers.get('Content-Disposition')?.split('filename=')[1];
      const playlistXLSX = await playlistResponse.blob();
      saveAs(playlistXLSX, playlistName);
      setInputError(false);
    } catch(error) {
      setErrorMessage('There was a problem processing the XLSX file');
      toggleModal();
    }
    setIsLoading(false);
  };

  const handleLogin = (ev: MouseEvent<HTMLButtonElement, globalThis.MouseEvent>) => {
    signIn();
  };

  const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 400,
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    p: 4,
  };

  return (
    <Container maxWidth='xs'>
      <Modal
        open={modal}
        onClose={toggleModal}
        aria-labelledby='modal-modal-title'
        aria-describedby='modal-modal-description'
      >
        <Box sx={style}>
          <Typography id="modal-modal-title" variant="h6" component="h2">
            Ooops!
          </Typography>
          <Typography id="modal-modal-description" sx={{ mt: 2 }}>
            {errorMessage}
          </Typography>
          <Button color='primary' onClick={toggleModal}>OK</Button>
        </Box>
      </Modal>
      <Box
        component='header'
        sx={{
          display: 'flex',
          height: 70,
          flexDirection: 'row',
          justifyContent: 'space-between'
        }}
      >
      {
        <>
          <Typography id="modal-modal-description" sx={{
            display: 'flex',
            flexWrap: 'wrap',
            alignContent: 'center'
          }}>
            Created by
            <Link href='https://www.kevinangeles.com' sx={{ ml: '5px' }}>
              Kevin Angeles
            </Link>
          </Typography>
          {
            (status === 'authenticated') && (
              <Link component='button' onClick={handleLogout}>
                Logout
              </Link>
            )
          }
        </>
      }
      </Box>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}
      >
        <Typography
          variant='h1'
          component='h1'
          align='center'
        >
          Playlists to XLSX
        </Typography>
        <Typography
          align='center'
          paragraph
        >
          Retrieve a list of tracks from Spotify in a .xslx file
        </Typography>
        <CardMedia
          component='img'
          image="images/spotxlsx2.jpg"
          alt="application logo"
        />
      </Box>
      {
        (status === 'authenticated') ? (
          <SpotifyHome
            otherSpotifyUserId={otherSpotifyUserId}
            accountChecked={accountChecked}
            isLoading={isLoading}
            inputError={inputError}
            handleOptionChange={handleOptionChange}
            handleOtherSpotifyUserIdChange={handleOtherSpotifyUserIdChange}
            handleClickButton={handleClickButton}
          />
        ) : (
          <Login
            handleLogin={handleLogin}
          />
        )
      }
      <footer className="text-center"></footer>
    </Container>
  )
}
