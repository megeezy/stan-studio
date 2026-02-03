import { useContext } from 'react';
import { SettingsContext } from '../context/SettingsContextCore';

export const useSettings = () => useContext(SettingsContext);
