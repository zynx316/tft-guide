// Zentrale Rendering-Basis: Preact + htm (ohne Build-Schritt, lokal vendored).
import { h, render, Fragment, Component, createContext } from 'preact';
import htm from 'htm';

export const html = htm.bind(h);
export { h, render, Fragment, Component, createContext };
