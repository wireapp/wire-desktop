import React from 'react'

import TeamsSidebar from '../containers/TeamsSidebar'
import WebviewList from '../containers/WebviewList'

import DragRegion from './DragRegion'

import './App.css'

const App = () =>
    <div className="App">
        <DragRegion />
        <WebviewList />
        <TeamsSidebar />
    </div>

export default App
