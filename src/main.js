import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './index.css';
// Расширение JSX-словаря Pixi-компонентами (важно сделать до первого рендера).
import './core/pixiExtend';
ReactDOM.createRoot(document.getElementById('root')).render(_jsx(React.StrictMode, { children: _jsx(App, {}) }));
