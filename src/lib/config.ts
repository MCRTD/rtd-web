export const API_URL = (import.meta.env.VITE_API_URL ?? 'https://api.rtd.cloudowo.com').replace(
  /\/$/,
  ''
);

export const SITE_NAME = 'MC RTD';

export const SITE_FULL_NAME = 'Minecraft Redstone Database';

export const MC_VERSIONS = [
  '1.21.10',
  '1.21.8',
  '1.21.5',
  '1.21.4',
  '1.21.3',
  '1.21.1',
  '1.20.6',
  '1.20.4',
  '1.20.2',
  '1.20.1',
  '1.19.4',
  '1.19.3',
  '1.19.2',
  '1.18.2',
  '1.17.1',
  '1.16.5',
  '1.15.2',
  '1.14.4',
  '1.13.2'
];

export const PER_PAGE = 24;
