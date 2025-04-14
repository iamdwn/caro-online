import React from 'react';
import { Game } from './components/Game';
import { BrowserRouter } from 'react-router-dom';

function App() {
    return (
        <BrowserRouter>
            <div className="App">
                <Game 
                    connection={null}
                    roomId=""
                    isHost={false}
                />
            </div>
        </BrowserRouter>
    );
}

export default App; 