import { useState } from "react";
import Main from "./Main";
import FormAdd from "./FormAdd";

const RemoveInventory = () => {
    const [curentState, setCurentState] = useState('main');

    return (
        <>
            {curentState === 'main' && <Main setCurentState={setCurentState} />}
            {curentState === 'form' && <FormAdd setCurentState={setCurentState} />}
        </>
    );
};

export default RemoveInventory;