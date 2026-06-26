import { useState } from "react";
import Main from "./Main";
import Form from "./FormAdd";

const Pembelian = () => {
    const [curentState, setCurentState] = useState('main');
    const [refreshKey, setRefreshKey] = useState(0);

    const handleSetState = (state) => {
        if (state === 'main') {
            setRefreshKey((k) => k + 1);
        }
        setCurentState(state);
    };

    if (curentState === 'main') {
        return <Main key={refreshKey} setCurentState={handleSetState} />;
    }

    if (curentState === 'form') {
        return <Form setCurentState={handleSetState} />;
    }
}

export default Pembelian;
