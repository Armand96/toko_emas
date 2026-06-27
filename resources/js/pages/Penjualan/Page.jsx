import { useState } from "react";
import Main from "./Main";
import Form from "./FormAdd";

const Penjualan = () => {
    const [curentState, setCurentState] = useState('main');

    if (curentState === 'main') {
        return <Main setCurentState={setCurentState} />;
    }

    if (curentState === 'form') {
        return <Form setCurentState={setCurentState} />;
    }
}

export default Penjualan;
