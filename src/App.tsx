import React from 'react';
import './App.css';
import {Routes, Route} from "react-router-dom";
import routers from "./router/router";

class App extends React.Component<any, any> {
    render() : React.ReactNode {
        return (
            <Routes>
                {
                    routers.map(router => {
                        return (
                            <Route path={router.path} element={<router.component/>} key={router.path}/>
                        )
                    })
                }
            </Routes>
        )
    }
}

export default App;
