import { ChangeEventHandler, MouseEventHandler, SyntheticEvent } from 'react';
import { Alert, AlertTitle, Box, Button, CircularProgress, TextField } from '@mui/material';
import { RadioGroupCustom, RadioGroupCustomOptions } from '@/components/RadioGroupCustom';
import Person from '@mui/icons-material/Person';
import People from '@mui/icons-material/People';

type SpotifyHomeProps = {
  otherSpotifyUserId: string;
  accountChecked: string;
  isLoading: boolean;
  alertMessage: string;
  errorType: 'input' | 'forbidden' | null;
  handleOptionChange: (ev: SyntheticEvent<Element, Event>) => void;
  handleOtherSpotifyUserIdChange: ChangeEventHandler<HTMLInputElement>;
  handleClickButton: MouseEventHandler<HTMLButtonElement>;
};

const SpotifyHome = ({
  otherSpotifyUserId,
  accountChecked,
  isLoading,
  alertMessage,
  errorType,
  handleOptionChange,
  handleOtherSpotifyUserIdChange,
  handleClickButton,
}: SpotifyHomeProps) => {
  const radioOptions: RadioGroupCustomOptions[] = [
    {
      label: 'From my account',
      value: 'own',
      icon: <Person />
    },
    {
      label: 'From other account',
      value: 'other',
      icon: <People />
    }
  ];
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <RadioGroupCustom
        groupLabel='Select Source:'
        defaultValue='own'
        disabled={errorType === 'forbidden'}
        options={radioOptions}
        handleOptionChange={handleOptionChange}
      />
      <Box
        sx={{
          height: 80
        }}
      >
      {
        (accountChecked === 'other') && (
          <TextField
            label='Spotify Id'
            variant='outlined'
            value={otherSpotifyUserId}
            error={errorType === 'input'}
            disabled={errorType === 'forbidden'}
            onChange={handleOtherSpotifyUserIdChange}
          />
        )
      }
      </Box>
      <Button
        type='button'
        color='primary'
        size='medium'
        disabled={accountChecked === 'other' && otherSpotifyUserId.trim() === '' || isLoading || errorType === 'forbidden'}
        variant='contained'
        onClick={handleClickButton}
      >
        Download playlists
      </Button>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'center',
          marginTop: '30px'
        }}
      >
        {
          (isLoading) && (<CircularProgress />)
        }
      </Box>
      {
        ((errorType === 'forbidden' || errorType === 'input') && alertMessage.trim() !== '') && (
          <Alert severity='error'>
            <AlertTitle>Error</AlertTitle>
            {alertMessage}
          </Alert>
        )
      }
    </Box>
  );
};

export default SpotifyHome;
