import { useContext } from 'react';
import { ThemeContext } from '../context/ThemeContextCore';

export const useTheme = () => useContext(ThemeContext);
