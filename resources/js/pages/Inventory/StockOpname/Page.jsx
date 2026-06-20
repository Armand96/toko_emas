import { useState } from "react";
import Main from "./Main";
import FormAdd from "./FormAdd";
import Detail from "./Detail";

const StockOpnameInventory = () => {
    // state: { view: 'main' | 'form' | 'detail', id?: number }
    const [curentState, setCurentState] = useState({ view: 'main' });

    return (
        <>
            {curentState.view === 'main' && <Main setCurentState={setCurentState} />}
            {curentState.view === 'form' && <FormAdd setCurentState={setCurentState} />}
            {curentState.view === 'detail' && <Detail id={curentState.id} setCurentState={setCurentState} />}
        </>
    );
};

export default StockOpnameInventory;
