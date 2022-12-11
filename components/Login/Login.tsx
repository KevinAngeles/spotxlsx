import { Box, Button, Typography } from '@mui/material';
import { MouseEventHandler } from 'react';

type LoginProps = {
  handleLogin: MouseEventHandler<HTMLButtonElement>;
};

const Login = ({
  handleLogin
}: LoginProps) => {

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
      <Typography
        variant='h2'
        component='h2'
      >
        Login
      </Typography>
      <Typography
        alignSelf='flex-start'
        paragraph
      >
        If you want to login to this application, you must contact the admin first.
      </Typography>
      <Typography
        alignSelf='flex-start'
        paragraph
      >
        To begin, click on the button below.
      </Typography>
      <Button
        type='button'
        color='primary'
        size='medium'
        id='btnLogin'
        variant='contained'
        onClick={handleLogin}
      >
        Login to Spotify
      </Button>
    </Box>
  )
};

export default Login;
