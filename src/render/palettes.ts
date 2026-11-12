import type { Biome, SurfaceId } from '../tracks/types';

export interface BiomePalette {
  skyTop: string;
  skyMid: string;
  skyBottom: string;
  sun: string;
  sunGlow: string;
  haze: string;
  farRidge: string;
  midRidge: string;
  nearRidge: string;
  groundFill: string;
  groundDeep: string;
  groundEdge: string;
  accent: string;
  shadow: string;
  ambient: string;
  vegetation: string;
}

export const BIOME_PALETTES: Record<Biome, BiomePalette> = {
  mountain: {
    skyTop: '#1d2b3a',
    skyMid: '#48607a',
    skyBottom: '#c7a47a',
    sun: '#f4d6a0',
    sunGlow: 'rgba(244, 214, 160, 0.32)',
    haze: 'rgba(214, 186, 150, 0.28)',
    farRidge: '#5a6d7e',
    midRidge: '#3f5060',
    nearRidge: '#2c3948',
    groundFill: '#3b3a38',
    groundDeep: '#232322',
    groundEdge: '#6b6255',
    accent: '#d9a441',
    shadow: 'rgba(0, 0, 0, 0.38)',
    ambient: 'rgba(255, 214, 170, 0.08)',
    vegetation: '#43553f',
  },
  desert: {
    skyTop: '#2c3a4d',
    skyMid: '#8c7f75',
    skyBottom: '#e8c79a',
    sun: '#ffe1ad',
    sunGlow: 'rgba(255, 225, 173, 0.4)',
    haze: 'rgba(240, 205, 160, 0.32)',
    farRidge: '#b99a78',
    midRidge: '#a3825f',
    nearRidge: '#8a6848',
    groundFill: '#c9a06a',
    groundDeep: '#8f6b44',
    groundEdge: '#efd2a4',
    accent: '#e0a44b',
    shadow: 'rgba(72, 43, 18, 0.34)',
    ambient: 'rgba(255, 220, 170, 0.12)',
    vegetation: '#7b7a4a',
  },
  forest: {
    skyTop: '#202a2b',
    skyMid: '#425450',
    skyBottom: '#8fa091',
    sun: '#e6e0bd',
    sunGlow: 'rgba(230, 224, 189, 0.22)',
    haze: 'rgba(190, 205, 190, 0.3)',
    farRidge: '#5a6c63',
    midRidge: '#3b4d43',
    nearRidge: '#26382f',
    groundFill: '#4a3b2c',
    groundDeep: '#2a211a',
    groundEdge: '#6f5a41',
    accent: '#c8a24a',
    shadow: 'rgba(0, 0, 0, 0.4)',
    ambient: 'rgba(200, 230, 200, 0.06)',
    vegetation: '#33472f',
  },
  urban: {
    skyTop: '#1a1f27',
    skyMid: '#3d4653',
    skyBottom: '#a98a72',
    sun: '#f0c98f',
    sunGlow: 'rgba(240, 201, 143, 0.25)',
    haze: 'rgba(190, 170, 150, 0.26)',
    farRidge: '#4a5462',
    midRidge: '#333c48',
    nearRidge: '#242b34',
    groundFill: '#33373d',
    groundDeep: '#1e2126',
    groundEdge: '#6e7278',
    accent: '#d9a441',
    shadow: 'rgba(0, 0, 0, 0.42)',
    ambient: 'rgba(220, 200, 175, 0.07)',
    vegetation: '#3f4a3c',
  },
};

export interface SurfaceLook {
  top: string;
  fill: string;
  deep: string;
  grain: string;
  /** Rolling resistance visual hint (loose surfaces get speckle). */
  loose: boolean;
}

export const SURFACE_LOOK: Record<SurfaceId, SurfaceLook> = {
  'asphalt-dry': { top: '#6d7278', fill: '#3c4045', deep: '#26292d', grain: '#8a9098', loose: false },
  'asphalt-wet': { top: '#5a6a78', fill: '#313a44', deep: '#1e252c', grain: '#9db4c6', loose: false },
  dirt: { top: '#8a7350', fill: '#5b4934', deep: '#3b2f22', grain: '#a89070', loose: true },
  gravel: { top: '#9a958a', fill: '#6a655c', deep: '#45423c', grain: '#c2bcae', loose: true },
  sand: { top: '#e3c48c', fill: '#c9a06a', deep: '#96744a', grain: '#f2ddb4', loose: true },
  mud: { top: '#5c4a35', fill: '#3f3224', deep: '#282015', grain: '#7a6244', loose: true },
  rock: { top: '#8b8578', fill: '#5d574d', deep: '#3c3831', grain: '#b0a999', loose: false },
  wood: { top: '#a17a4e', fill: '#6f5133', deep: '#4a3421', grain: '#c39a68', loose: false },
};
