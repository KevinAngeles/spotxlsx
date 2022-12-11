import { ChangeEventHandler, MouseEventHandler, SyntheticEvent } from 'react';
import { Box, Button, CircularProgress, TextField } from '@mui/material';
import { RadioGroupCustom, RadioGroupCustomOptions } from '@/components/RadioGroupCustom';
import Person from '@mui/icons-material/Person';
import People from '@mui/icons-material/People';

type SpotifyHomeProps = {
  otherSpotifyUserId: string;
  accountChecked: string;
  isLoading: boolean;
  inputError: boolean;
  handleOptionChange: (ev: SyntheticEvent<Element, Event>) => void;
  handleOtherSpotifyUserIdChange: ChangeEventHandler<HTMLInputElement>;
  handleClickButton: MouseEventHandler<HTMLButtonElement>;
};

const SpotifyHome = ({
  otherSpotifyUserId,
  accountChecked,
  isLoading,
  inputError,
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
            error={inputError}
            onChange={handleOtherSpotifyUserIdChange}
          />
        )
      }
      </Box>
      <Button
        type='button'
        color='primary'
        size='medium'
        disabled={accountChecked === 'other' && otherSpotifyUserId.trim() === '' || isLoading}
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
    </Box>
  );
}

export default SpotifyHome;
