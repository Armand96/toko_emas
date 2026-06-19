import { useState } from "react";
import Main from "./Main";
import FormAdd from "./FormAdd";
import Detail from "./Detail";

const StockOpnameInventory = () => {
    const [curentState, setCurentState] = useState('main');

    return (
        <>
            {curentState === 'main' && <Main setCurentState={setCurentState} />}
            {curentState === 'form' && <FormAdd setCurentState={setCurentState} />}
            {curentState === 'detail' && <Detail setCurentState={setCurentState} />}
        </>
    );
};

export default StockOpnameInventory;
