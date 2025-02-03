'use client'
import {  ReactNode, SyntheticEvent } from 'react';
import { FormControl, FormControlLabel, FormLabel, Radio, RadioGroup, Typography } from '@mui/material';

export type RadioGroupCustomOptions = {
  label: string;
  value: 'own' | 'other';
  icon: ReactNode;
};

type RadioGroupCustomProps = {
  groupLabel: string;
  defaultValue: 'own' | 'other';
  options: RadioGroupCustomOptions[];
  disabled: boolean;
  handleOptionChange: (ev: SyntheticEvent<Element, Event>) => void;
};

type RadioGroupLabelProps = {
  label: string;
  icon: ReactNode;
};

const RadioGroupLabel = ({label, icon}: RadioGroupLabelProps) => {
  return (
    <>
      {icon}{label}
    </>
  )
};

const RadioGroupCustom = ({
  groupLabel,
  defaultValue,
  options,
  disabled,
  handleOptionChange
}: RadioGroupCustomProps) => {
  return (
    <FormControl>
      <FormLabel
        component='h2'
        id='radio-buttons-group-label'
        sx={{
          color: '#000',
          margin: 0,
          fontWeight: '800',
          fontSize: '2em',
          '&.Mui-focused': {
            color: '#000'
          }
        }}
      >
        {groupLabel}
      </FormLabel>
      <RadioGroup
        aria-labelledby='radio-buttons-group-label'
        defaultValue={defaultValue}
        name='radio-buttons-group'
      >
        {
          options.map( ({ value, label, icon }) => {
            return (
              <FormControlLabel
                key={value}
                value={value}
                control={<Radio />}
                onChange={handleOptionChange}
                disabled={disabled}
                label={<RadioGroupLabel label={label} icon={icon} />}
              />
            );
          })
        }
      </RadioGroup>
    </FormControl>
  );
};

export default RadioGroupCustom;
